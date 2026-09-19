"""
JobMatch local helper. Receives scraped jobs from the Chrome extension,
classifies each against the user's CV using Google Gemini, returns scored
results.

Endpoints:
  GET  /health    -> {"ok": true, ...}
  GET  /cv        -> {"cv": "<text of configured CV file>"}
  POST /classify  -> body: {"cv": "...", "jobs": [{...}, ...]}
                     returns: {"results": [{..., score, verdict, reason,
                                            matched_skills, missing_skills}]}
  POST /outreach  -> body: {"cv": "...", "fork": "...", "profile": {...},
                            "mentorType": "auto|career|technical|industry"}
                     returns: {mentor_type, fit_score, fit_reason, why_you,
                               connection_note, message, email_subject,
                               email_body, follow_up}
  POST /outreach/log -> append a sent message to outreach.csv
  GET  /outreach/due -> rows whose follow-up date has passed

Run:
  python server.py

Env (loaded from .env if present):
  GOOGLE_API_KEY   required (get a free one at https://aistudio.google.com/apikey)
  CV_FILE          path to a CV markdown/text file
                   (default: ../../public/Ali_Mansouri_CV.md)
  MODEL            Gemini model id (default: gemini-2.5-flash)
                   Free-tier friendly alternative: gemini-2.5-flash-lite
  PORT             default 5577
  CACHE_DIR        default ./cache
  MAX_PARALLEL     default 3 (Gemini free tier is rate-limited; keep low)
  OUTREACH_MODEL   Gemini model for outreach drafts (default: gemini-2.5-flash;
                   one call per person, so rate limits don't bite. flash-lite
                   tends to drop the "one numeric achievement" rule.)
  OUTREACH_CSV     default ./outreach.csv (mentor outreach tracker)
  FOLLOWUP_DAYS    default 35 (days after "sent" before a follow-up is due)
"""
from __future__ import annotations

import csv
import hashlib
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timedelta
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

from google import genai
from google.genai import types as genai_types

ROOT = Path(__file__).parent
DEFAULT_CV = (ROOT / ".." / ".." / "public" / "Ali_Mansouri_CV.md").resolve()
CV_FILE = Path(os.environ.get("CV_FILE", DEFAULT_CV)).resolve()
MODEL = os.environ.get("MODEL", "gemini-2.5-flash")
PORT = int(os.environ.get("PORT", "5577"))
CACHE_DIR = Path(os.environ.get("CACHE_DIR", ROOT / "cache")).resolve()
CACHE_DIR.mkdir(exist_ok=True)
MAX_PARALLEL = int(os.environ.get("MAX_PARALLEL", "3"))
MAX_RETRIES = 3
OUTREACH_MODEL = os.environ.get("OUTREACH_MODEL", "gemini-2.5-flash")
OUTREACH_CSV = Path(os.environ.get("OUTREACH_CSV", ROOT / "outreach.csv")).resolve()
FOLLOWUP_DAYS = int(os.environ.get("FOLLOWUP_DAYS", "35"))
OUTREACH_FIELDS = [
    "sent_at", "name", "url", "company", "mentor_type", "area", "channel",
    "followup_due", "status", "notes",
]
AREAS = (
    "firmware-platform", "embedded-security", "low-power-wireless", "embedded-linux",
    "hardware-pcb-power", "silicon-soc-fpga", "automotive-safety", "edge-ai-dsp",
    "robotics-control", "other",
)

API_KEY = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print(
        "[!] GOOGLE_API_KEY not set. Get a free key at https://aistudio.google.com/apikey\n"
        "    then put it in helper/.env or your shell env.",
        file=sys.stderr,
    )

client = genai.Client(api_key=API_KEY) if API_KEY else None

app = Flask(__name__)
# Only the extension may call this from a browser context. /cv and
# /outreach/due expose the CV and real contact names; a "*" origin would let
# any open web page read them.
CORS(app, resources={r"/*": {"origins": [r"^chrome-extension://.*$"]}})

SYSTEM_INSTRUCTIONS = """You are a career-fit assistant. Given a candidate's CV and a job posting, you score the fit and return a structured JSON object.

Scoring rubric (0-100):
  85-100  Strong fit. Candidate clearly meets core requirements; minor gaps only.
  65-84   Good fit. Most core requirements met; some real gaps but plausible application.
  45-64   Stretch. Significant gaps but candidate has transferable skills or could learn.
  20-44   Weak. Domain or seniority mismatch; would need major upskilling.
  0-19    Not relevant. Wrong field, wrong language requirement, etc.

Be honest. If the job is in a completely different domain or requires hard-blocking qualifications (specific language, citizenship, years of experience the candidate doesn't have), score it low even if some keywords match.

Output STRICT JSON only, no markdown, no prose around it. Schema:
{
  "score": <int 0-100>,
  "verdict": "<one of: strong, good, stretch, weak, irrelevant>",
  "reason": "<one or two sentences explaining the score>",
  "matched_skills": ["<from the CV that the job actually wants>", ...],
  "missing_skills": ["<from the job that the CV does not show>", ...]
}"""


def cache_key(cv_text: str, job: dict) -> Path:
    h = hashlib.sha256()
    h.update(cv_text.encode("utf-8"))
    h.update(b"||")
    h.update((job.get("url") or "").encode("utf-8"))
    h.update(b"||")
    h.update((job.get("description") or "")[:4000].encode("utf-8"))
    h.update(b"||")
    h.update(MODEL.encode("utf-8"))
    return CACHE_DIR / f"{h.hexdigest()[:20]}.json"


def job_to_prompt(job: dict) -> str:
    parts = []
    for label, key in (
        ("Title", "title"),
        ("Company", "company"),
        ("Location", "location"),
        ("Deadline", "deadline"),
        ("URL", "url"),
    ):
        v = job.get(key)
        if v:
            parts.append(f"{label}: {v}")
    desc = (job.get("description") or "").strip()
    if desc:
        parts.append("\nDescription:\n" + desc[:8000])
    return "\n".join(parts) if parts else "(no job data)"


def extract_json(text: str) -> dict | None:
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
        return None


def call_gemini(cv_text: str, job: dict) -> str:
    """Call Gemini once. Raises on hard failure; caller handles retries."""
    # Gemini 2.5 Flash defaults to "thinking" mode which silently consumes the
    # output-token budget. For a structured classification we don't need it,
    # and leaving it on means responses get truncated. Disable it explicitly.
    config = genai_types.GenerateContentConfig(
        system_instruction=f"{SYSTEM_INSTRUCTIONS}\n\nCANDIDATE CV:\n\n{cv_text}",
        response_mime_type="application/json",
        max_output_tokens=1200,
        temperature=0.2,
        thinking_config=genai_types.ThinkingConfig(thinking_budget=0),
    )
    resp = client.models.generate_content(
        model=MODEL,
        contents=job_to_prompt(job),
        config=config,
    )
    return resp.text or ""


def classify_one(cv_text: str, job: dict) -> dict:
    cached = cache_key(cv_text, job)
    if cached.exists():
        try:
            data = json.loads(cached.read_text(encoding="utf-8"))
            return {**job, **data, "_cached": True}
        except Exception:
            pass

    if not client:
        return {**job, "score": 0, "verdict": "error", "reason": "No API key configured."}

    last_err = None
    for attempt in range(MAX_RETRIES):
        try:
            raw = call_gemini(cv_text, job)
            data = extract_json(raw) or {}
            try:
                data["score"] = int(data.get("score", 0))
            except Exception:
                data["score"] = 0
            data.setdefault("verdict", "unknown")
            data.setdefault("reason", "")
            data.setdefault("matched_skills", [])
            data.setdefault("missing_skills", [])

            try:
                cached.write_text(
                    json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
                )
            except Exception:
                pass
            return {**job, **data, "_cached": False}
        except Exception as e:
            last_err = e
            msg = str(e).lower()
            # Retry on rate-limit (429) and transient unavailability (503).
            transient = (
                "429" in msg
                or "503" in msg
                or "rate" in msg
                or "quota" in msg
                or "resource exhausted" in msg
                or "unavailable" in msg
                or "overloaded" in msg
            )
            if transient:
                time.sleep(2 ** attempt * 2)
                continue
            # Other errors: don't retry.
            break

    return {
        **job,
        "score": 0,
        "verdict": "error",
        "reason": f"Classification failed: {last_err}",
    }


OUTREACH_INSTRUCTIONS = """You write short, honest cold-outreach messages on behalf of a candidate who is looking for career guidance. You are given the candidate's CV, the candidate's current career fork (the decision they are stuck on), and a scraped LinkedIn profile of the person to contact.

STEP 1 - Classify the mentor type this person can realistically be (unless one is forced):
  career     senior/staff/lead/principal engineer or manager, 8+ years, ideally has made a visible transition (firmware -> hardware, IC -> lead, big company -> startup, moved country). Can answer "which direction should I go".
  technical  hands-on expert in the candidate's stack (embedded C/C++, RTOS, BLE, PCB, ESP32/STM32, Zephyr, power electronics), open-source maintainer, DevRel, FAE, author. Can critique the candidate's work.
  industry   professor, university staff, alumni of the candidate's university, former manager/colleague, recruiter, founder in the local ecosystem. Can open doors and say what the market wants.

STEP 1a - Judge people by what they DO (experience bullets, about, projects, skills), never by title alone. An "Electronics Engineer" or "R&D Engineer" at a small company who lays out boards and writes firmware is a strong target; a "Firmware Engineer" title with no embedded content is not. Generic or unusual titles must not lower the fit score.

STEP 1b - Tag the area this person actually works in, one of: firmware-platform, embedded-security, low-power-wireless, embedded-linux, hardware-pcb-power, silicon-soc-fpga, automotive-safety, edge-ai-dsp, robotics-control, other. Pick the one that describes most of their recent work, not their title.

STEP 2 - Score fit 0-100: how worthwhile is contacting THIS person for the candidate's fork? Penalize: unrelated field, same seniority as candidate, no overlap with the fork, profile too thin to personalize. Reward: shared school/city/company, a transition matching the fork, active in the candidate's stack. For an exploration fork, "no overlap with the fork" does not apply: a clear, senior representative of any embedded area is a good target. Be blunt in fit_reason; if fit < 40, say to skip and why.

STEP 3 - Write the messages. Content rules:
  - Never use the words "mentor", "mentorship", "pick your brain", "passionate", "reaching out", "impressive", "inspiring", or any "hope this ... finds you well" opener.
  - Exactly ONE concrete, numeric achievement from the CV (e.g. "6-month battery life", "99% idle-power cut", "sub-100 ms BLE protocol"). Pick the one closest to the recipient's world. Optional in connection_note, but it MUST appear in message and email_body - it is the proof the candidate is worth 20 minutes.
  - "why_you" must cite ONE specific item from their profile (a role change, a company, a project, a post) - no generic flattery. If the profile is too thin to do this, say so in fit_reason and keep why_you factual.
  - The ask is small and bounded: about 20 minutes, ONE specific question. The question itself is written out in the message.
  - The candidate's fork is either a DILEMMA ("stuck between A and B") or an EXPLORATION ("early career, talking to people across areas before choosing"). Dilemma: the question comes from the fork and targets the recipient's side of it. Exploration: the question is about the reality of THEIR area only, e.g. what a normal week actually looks like, what they'd tell someone starting in it, what people complain about after a year, whether they'd pick it again today. Never ask "which area should I choose" and never list the areas he is considering; one sentence saying he's talking to people across embedded before choosing is enough.
  - Type-specific ask: career -> ask about the transition they made; technical -> the question MUST be a technical one from their domain (e.g. a deep-sleep vs light-sleep trade-off, when to push power sequencing into hardware), never a career question, and offer to send one concrete design (portfolio link from the CV); industry -> ask for a coffee / office hour and what the local market currently hires for. Never ask for a referral or a job in a first message.
  - If the recipient is a professor or holds "Prof." / "Dr." in their name or headline, address them as "Prof. <surname>" (or "Dr. <surname>") in every text, DM included. Never by first name.
  - Use ONLY facts that appear in the CV or in the recipient's profile. Never invent a project, number, company, event or conversation. If you need a fact you do not have, write a placeholder in square brackets for the candidate to fill, e.g. [what you did since].

STEP 4 - Voice. These messages must read as if the candidate typed them himself on his phone. A 25-year-old engineer, fluent but not native, direct, slightly informal. If a recruiter would guess "ChatGPT wrote this", you failed. Rules:
  - Contractions are normal: I'm, I've, don't, that's, you've.
  - Do NOT open with "I am <name>, a <role>...". His name is on the profile. Open with the thing about THEM, or with the question, or with one blunt sentence about where he is. Introduce himself in half a clause later, or not at all in the DM.
  - Vary sentence length. At least one sentence under six words. One can run longer.
  - No em dashes (the character "-" between words as an aside), no semicolons, no bullet points, no bold, no emojis, no exclamation marks. Commas and full stops only.
  - No lists of three. If you catch yourself writing "X, Y and Z", cut one.
  - Banned words and phrases (AI tells): leverage, navigate, journey, landscape, delve, insight(s), keen, resonate, robust, seamless, transformative, pivotal, valuable, align(s/ed), fellow, "came across your profile", "I would love to", "I'd greatly appreciate", "would value", "happy to work around your schedule", "in the next few weeks", "quick question", "touch base", "looking forward", "thank you for your time", "best regards", "kind regards", "I hope".
  - The anchor line must not always start with "I saw you moved from". Other shapes: "You went from X to Y.", "Your ST-to-Nordic move is the one I'm weighing.", "You did the PCB-to-firmware switch.", or fold it into the question.
  - The question should sound like something you'd ask over coffee, not in an interview. Not "what was the biggest challenge in your transition" but "did you ever regret leaving the hardware side?" or "how did you know it was time to switch?".
  - The ask is one short sentence in his own words, different every time: "20 min on a call some week?", "Would a short call be ok, whenever suits you?", "Could I ask you that properly over a call, 20 min max?". Never the same canonical line twice.
  - A DM is signed "Ali" or not at all. Email sign-off is plain: "Thanks," then name, degree and university, portfolio link. Nothing else.
  - It's fine to be a bit blunt or self-aware: "Honest question.", "Not asking for a job.", "Feel free to ignore if you're busy."

Outputs:
  connection_note   <= 280 characters INCLUDING spaces (LinkedIn connect-note limit is 300). One or two sentences, the kind of thing a person types into the connect box: one specific hook about them plus "mind if I ask you one thing about it sometime?" in his own words. No numeric achievement needed here.
  message           LinkedIn DM, 250-600 characters, 3-5 sentences in 2-3 short paragraphs (blank line between). Must contain: the ONE numeric achievement, the ONE anchor about them, the ONE question written out, the bounded ask. Order is free. Greeting "Hi <first name>," or just "<first name>,".
  email_subject     <= 60 chars, specific, no clickbait, lowercase after the first word is fine ("PCB to firmware, one question").
  email_body        <= 900 characters. Same content and voice as message, may be one sentence longer, then the plain sign-off described above.
  follow_up         2-3 sentences to send if there is no reply after 5 weeks. One sentence built around the literal placeholder [one concrete thing you did since - fill in], copied exactly, brackets included - do NOT fill it in or invent what it is. You never spoke, so "since I wrote" / "since my last message", never "since we spoke". Re-ask once, same question, shorter. No guilt, no apology, no "just following up".

Output STRICT JSON only, no markdown. Schema:
{
  "mentor_type": "<career|technical|industry>",
  "area": "<one of the area tags from STEP 1b>",
  "fit_score": <int 0-100>,
  "fit_reason": "<one or two blunt sentences>",
  "why_you": "<the specific profile item you anchored on>",
  "connection_note": "<string>",
  "message": "<string>",
  "email_subject": "<string>",
  "email_body": "<string>",
  "follow_up": "<string>"
}"""


# Words and phrases that read as machine-written (from the humanize-writing
# skill's tell list, trimmed to what shows up in short cold messages).
AI_TELLS = (
    "mentor", "passionate", "pick your brain", "reaching out", "impressive", "inspiring",
    "leverage", "navigate", "journey", "landscape", "delve", "insight", "keen", "resonate",
    "robust", "seamless", "transformative", "pivotal", "valuable", "fellow",
    "came across your profile", "i would love to", "i'd greatly appreciate", "would value",
    "happy to work around your schedule", "in the next few weeks", "quick question",
    "touch base", "looking forward", "thank you for your time", "best regards",
    "kind regards", "i hope", "hope you're", "hope you are", "just following up",
    "wanted to follow up", "since we last", "we last spoke", "we spoke", "we connected",
    "circling back", "circle back", "in case it got lost", "re-send", "resend", "bumping this",
)
FOLLOWUP_PLACEHOLDER = "[one concrete thing you did since - fill in]"
# The bounded ask itself carries a number; it must not count as the achievement.
ASK_NUMBERS = re.compile(r"\b20[- ]?(min|minute)", re.IGNORECASE)


def draft_problems(data: dict) -> list[str]:
    """Rule violations worth one retry. Empty list means the draft passes."""
    out = []
    dm = str(data.get("message") or "")
    if not re.search(r"\d", ASK_NUMBERS.sub("", dm)):
        out.append("'message' has no numeric achievement from the CV")
    if len(dm) > 700:
        out.append(f"'message' is {len(dm)} chars, keep it under 600")
    if FOLLOWUP_PLACEHOLDER not in str(data.get("follow_up") or ""):
        out.append(f"'follow_up' must contain the literal placeholder {FOLLOWUP_PLACEHOLDER}")
    for k in ("connection_note", "message", "email_body", "follow_up"):
        # Bracketed placeholders are ours, not the model's prose.
        t = re.sub(r"\[[^\]]*\]", "", str(data.get(k) or ""))
        low = t.lower()
        hits = [w for w in AI_TELLS if w in low]
        if hits:
            out.append(f"'{k}' uses banned words: {', '.join(hits)}")
        if "—" in t or " - " in t:
            out.append(f"'{k}' uses a dash as an aside; use a comma or full stop")
        if "!" in t:
            out.append(f"'{k}' has an exclamation mark")
    return out


# "Hi Marco,\nI hope this message finds you well. ..." -> group 1 keeps the greeting.
FILLER_OPENER = re.compile(
    r"^(\s*(?:hi|hello|dear)\b[^\n.!?]*?(?:,|\n)\s*)?(?:I )?hope (?:this|you)[^.!?\n]*[.!?][ \t]*",
    re.IGNORECASE,
)


def profile_to_prompt(profile: dict, fork: str, mentor_type: str) -> str:
    parts = []
    if mentor_type and mentor_type != "auto":
        parts.append(f"FORCED MENTOR TYPE: {mentor_type}")
    parts.append(
        "CANDIDATE'S CURRENT FORK:\n"
        + (fork.strip() or "(not provided - infer a sensible question from the CV)")
    )
    parts.append("\nRECIPIENT PROFILE:")
    for label, key in (
        ("Name", "name"),
        ("Headline", "headline"),
        ("Location", "location"),
        ("URL", "url"),
        ("About", "about"),
    ):
        v = (profile.get(key) or "").strip()
        if v:
            parts.append(f"{label}: {v[:1500]}")
    for label, key in (("Experience", "experience"), ("Education", "education")):
        items = profile.get(key) or []
        if items:
            parts.append(f"{label}:")
            parts.extend(f"  - {str(x)[:300]}" for x in items[:12])
    raw = (profile.get("raw") or "").strip()
    if raw:
        parts.append("\nRaw page text (use if structured fields above are thin):\n" + raw[:6000])
    return "\n".join(parts)


def draft_outreach(cv_text: str, fork: str, profile: dict, mentor_type: str) -> dict:
    config = genai_types.GenerateContentConfig(
        system_instruction=f"{OUTREACH_INSTRUCTIONS}\n\nCANDIDATE CV:\n\n{cv_text}",
        response_mime_type="application/json",
        max_output_tokens=1800,
        temperature=0.8,
        thinking_config=genai_types.ThinkingConfig(thinking_budget=0),
    )
    contents = profile_to_prompt(profile, fork, mentor_type)
    last_err = None
    for attempt in range(MAX_RETRIES):
        try:
            resp = client.models.generate_content(
                model=OUTREACH_MODEL, contents=contents, config=config
            )
            data = extract_json(resp.text or "")
            if not data:
                raise ValueError("model returned no JSON")
            # Cheap lint for the rules models drop most often. Ask once more
            # with the specific problems, then accept whatever comes back
            # (never on the last attempt - a draft beats an error).
            problems = draft_problems(data)
            if problems and "REMINDER" not in contents and attempt < MAX_RETRIES - 1:
                contents += "\n\nREMINDER: your previous draft broke these rules, fix them: " + "; ".join(problems)
                continue
            try:
                data["fit_score"] = int(data.get("fit_score", 0))
            except Exception:
                data["fit_score"] = 0
            for k in ("mentor_type", "area", "fit_reason", "why_you", "connection_note",
                      "message", "email_subject", "email_body", "follow_up"):
                data.setdefault(k, "")
            if data.get("area") not in AREAS:
                data["area"] = "other"
            # The model occasionally re-classifies despite the FORCED line.
            if mentor_type != "auto":
                data["mentor_type"] = mentor_type
            # ...and keeps opening the follow-up with this filler despite the ban.
            # Only the opener is stripped (optionally after a greeting line);
            # an "I hope you could ..." later in the body is left alone.
            for k in ("message", "email_body", "follow_up"):
                data[k] = FILLER_OPENER.sub(
                    lambda m: m.group(1) or "", str(data.get(k) or ""), count=1
                ).strip()
            return data
        except Exception as e:
            last_err = e
            msg = str(e).lower()
            transient = any(
                t in msg
                for t in ("429", "503", "rate", "quota", "resource exhausted", "unavailable", "overloaded")
            )
            if transient:
                time.sleep(2 ** attempt * 2)
                continue
            break
    raise RuntimeError(f"Outreach draft failed: {last_err}")


def outreach_rows() -> list[dict]:
    if not OUTREACH_CSV.exists():
        return []
    with OUTREACH_CSV.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


@app.get("/")
def index():
    return (
        "<h2>JobMatch helper is running</h2>"
        "<p>This server is consumed by the JobMatch Chrome extension. "
        "There's no UI here.</p>"
        "<ul>"
        "<li><a href='/health'>/health</a> &mdash; status + config</li>"
        "<li><a href='/cv'>/cv</a> &mdash; current CV being used</li>"
        "<li><code>POST /classify</code> &mdash; called by the extension</li>"
        "<li><code>POST /outreach</code> &mdash; draft a mentor-outreach message</li>"
        "<li><a href='/outreach/due'>/outreach/due</a> &mdash; follow-ups that are due</li>"
        "</ul>",
        200,
        {"Content-Type": "text/html; charset=utf-8"},
    )


@app.get("/health")
def health():
    return jsonify(
        ok=True,
        model=MODEL,
        cv_file=str(CV_FILE),
        cv_exists=CV_FILE.exists(),
        has_api_key=bool(API_KEY),
        provider="google-gemini",
    )


@app.get("/cv")
def get_cv():
    if not CV_FILE.exists():
        return jsonify(error=f"CV file not found at {CV_FILE}"), 404
    return jsonify(cv=CV_FILE.read_text(encoding="utf-8"), path=str(CV_FILE))


@app.post("/classify")
def classify():
    body = request.get_json(silent=True) or {}
    cv = (body.get("cv") or "").strip()
    jobs = body.get("jobs") or []
    if not cv:
        return jsonify(error="Missing 'cv' in body."), 400
    if not isinstance(jobs, list) or not jobs:
        return jsonify(error="Body 'jobs' must be a non-empty list."), 400
    if not client:
        return jsonify(error="GOOGLE_API_KEY not configured on the helper."), 500

    print(f"[classify] {len(jobs)} jobs, cv {len(cv)} chars, model {MODEL}")
    results: list[dict] = [None] * len(jobs)  # type: ignore
    done_cached = 0
    done_fresh = 0
    with ThreadPoolExecutor(max_workers=MAX_PARALLEL) as ex:
        futs = {ex.submit(classify_one, cv, job): i for i, job in enumerate(jobs)}
        for fut in as_completed(futs):
            i = futs[fut]
            r = fut.result()
            results[i] = r
            if r.get("_cached"):
                done_cached += 1
            else:
                done_fresh += 1
    print(f"[classify] done. cached={done_cached} fresh={done_fresh}")
    return jsonify(results=results)


@app.post("/outreach")
def outreach():
    body = request.get_json(silent=True) or {}
    cv = (body.get("cv") or "").strip()
    profile = body.get("profile") or {}
    fork = body.get("fork") or ""
    mentor_type = (body.get("mentorType") or "auto").strip().lower()
    if not cv:
        return jsonify(error="Missing 'cv' in body."), 400
    if not isinstance(profile, dict) or not (profile.get("name") or profile.get("raw")):
        return jsonify(error="Body 'profile' must have at least 'name' or 'raw'."), 400
    if mentor_type not in ("auto", "career", "technical", "industry"):
        return jsonify(error="mentorType must be auto|career|technical|industry."), 400
    if not client:
        return jsonify(error="GOOGLE_API_KEY not configured on the helper."), 500

    print(f"[outreach] {profile.get('name') or '(no name)'} type={mentor_type} model={OUTREACH_MODEL}")
    try:
        data = draft_outreach(cv, fork, profile, mentor_type)
    except Exception as e:
        return jsonify(error=str(e)), 502
    print(f"[outreach] -> {data.get('mentor_type')} fit={data.get('fit_score')}")
    log_event(
        "outreach",
        model=OUTREACH_MODEL,
        forced_type=mentor_type,
        profile={k: trim(profile.get(k), 200) for k in
                 ("name", "headline", "location", "url", "experience", "education")},
        profile_raw_chars=len(profile.get("raw") or ""),
        # The lint's own verdict on what shipped, so a rule that keeps slipping
        # through shows up as a pattern rather than as a one-off impression.
        lint=draft_problems(data),
        draft={k: data.get(k) for k in
               ("fit_score", "fit_reason", "mentor_type", "area", "why_you",
                "connection_note", "message", "email_subject", "email_body", "follow_up")},
    )
    return jsonify(data)


@app.post("/outreach/log")
def outreach_log():
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    if not name:
        return jsonify(error="Missing 'name'."), 400
    now = datetime.now()
    row = {
        "sent_at": now.strftime("%Y-%m-%d"),
        "name": name,
        "url": (body.get("url") or "").strip(),
        "company": (body.get("company") or "").strip(),
        "mentor_type": (body.get("mentor_type") or "").strip(),
        "area": (body.get("area") or "").strip(),
        "channel": (body.get("channel") or "").strip(),
        "followup_due": (now + timedelta(days=FOLLOWUP_DAYS)).strftime("%Y-%m-%d"),
        "status": "sent",
        "notes": (body.get("notes") or "").strip().replace("\n", " "),
    }
    new_file = not OUTREACH_CSV.exists()
    with OUTREACH_CSV.open("a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=OUTREACH_FIELDS)
        if new_file:
            w.writeheader()
        w.writerow(row)
    print(f"[outreach/log] {name} via {row['channel']} -> follow-up {row['followup_due']}")
    return jsonify(ok=True, row=row, path=str(OUTREACH_CSV))


@app.get("/outreach/due")
def outreach_due():
    today = date.today().isoformat()
    rows = outreach_rows()
    # Edit the 'status' column in outreach.csv by hand (replied / done / dead)
    # to drop a row from this list.
    due = [r for r in rows if r.get("status") == "sent" and (r.get("followup_due") or "") <= today]
    return jsonify(due=due, total=len(rows), path=str(OUTREACH_CSV))


# Two conversations per area is the exploration target in README D2. The popup's
# search launcher shows this so you can see which areas are still untouched.
AREA_TARGET = int(os.environ.get("AREA_TARGET", "2"))


# A run log, so a bad draft or a wrong ranking can be looked at afterwards
# instead of reconstructed from memory. It records what the page adapter
# actually extracted alongside what the model made of it, which is the pair
# that matters when either one misbehaves.
#
# It holds real people's names: gitignored, same rule as outreach.csv.
LOG_DIR = Path(os.environ.get("LOG_DIR", ROOT / "logs")).resolve()


def log_event(kind: str, **fields) -> None:
    try:
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        path = LOG_DIR / f"{date.today().isoformat()}.jsonl"
        row = {"ts": datetime.now().isoformat(timespec="seconds"), "event": kind, **fields}
        with path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    except Exception as e:
        # Logging must never take the request down with it.
        print(f"[log] could not write: {e}", file=sys.stderr)


def trim(value, limit: int = 300):
    if isinstance(value, str):
        return value if len(value) <= limit else value[:limit] + "…"
    if isinstance(value, list):
        return [trim(v, limit) for v in value]
    return value


TRIAGE_INSTRUCTIONS = """You triage a page of LinkedIn people-search results for
someone mapping out embedded engineering before choosing a specialisation.

You see only what a search card shows: name, headline, location, sometimes a
one-line snippet and the connection degree. That is thin. Judge whether the
person is WORTH OPENING, not how good the eventual message would be. Say so
honestly when a card is too thin to tell.

DRAFT (worth opening) when the card suggests:
- real embedded, firmware, hardware, silicon, automotive, robotics or test work
- roughly five to eight years ahead of the candidate: senior, staff, lead,
  principal, or a small-company engineer who clearly does several of these jobs
- someone who has crossed between areas (hardware to firmware, bare metal to
  Linux, product to silicon). They can describe more than one area from inside.

SKIP when the card shows:
- an OPEN TO WORK badge, "seeking", "looking for opportunities": they want help,
  not to give it
- a student, intern, or someone who graduated in the last year or two: same
  stage as the candidate, so there is nothing to ask
- C-level at a large company, VP, director, twenty years ahead: they rarely
  answer a cold note from a junior engineer
- recruiters, sales, marketing, HR
- a field with no overlap: web, pure AI/ML platforms, finance, aerospace
  structures, anything where the day-to-day says nothing about embedded

MAYBE when the headline is vague or generic ("Engineer at X", "Software
Engineer") and the area cannot be told from the card. These are worth opening
only when nothing better is on the page: a small-company "Electronics Engineer"
is often exactly the right person, and the card cannot tell you.

READ THE CV BELOW AND USE IT. The generic rules above only sort out who is
plausible; the CV is what makes one plausible person better than another. Raise
the score when the card shows something the candidate can actually open a
conversation with:

- the same parts and tools the CV names, not just the same job family. Someone
  whose headline carries a chip family, an RTOS or a protocol the candidate has
  shipped is worth far more than a generic "Embedded Engineer", because there is
  a real question to ask and a real thing in common to open with.
- the same school or the same city as the CV
- a company the CV already touches, or a direct competitor or supplier of one
- the area next door to what the candidate has done, where the question "what
  did you gain and lose moving there" is a genuine one

Lower it when there is no overlap at all: nothing in the card connects to
anything in the CV, so the first message would have to be generic, and generic
is what gets ignored.

Name that overlap explicitly in "overlap" — the concrete shared thing, in a few
words, quoting the card and the CV rather than describing them. Empty string
when there is genuinely nothing.

Score 0-100 for how worth opening they are. Be decisive: most cards on a page
are not worth a message, and saying so saves the candidate more time than a
generous score does.

Return JSON: {"results": [{"i": <index as given>, "verdict": "draft"|"maybe"|"skip",
"score": <int>, "reason": "<one short sentence, concrete, naming what in the card
decided it>", "overlap": "<the shared thing, or empty>",
"area": "<one of AREAS or other>"}]}

One entry per person, same indexes, no extras. AREAS: """ + ", ".join(AREAS) + "."


def people_to_prompt(fork: str, people: list[dict]) -> str:
    lines = []
    if fork.strip():
        lines.append(f"The candidate's current fork:\n{fork.strip()}\n")
    lines.append("Search result cards:")
    for i, p in enumerate(people):
        bits = [f"[{i}] {p.get('name') or '(no name)'}"]
        for key in ("headline", "location", "snippet", "degree"):
            v = (p.get(key) or "").strip()
            if v:
                bits.append(f"    {key}: {v[:300]}")
        if p.get("open_to_work"):
            bits.append("    badge: OPEN TO WORK")
        lines.append("\n".join(bits))
    return "\n".join(lines)


def triage_people(cv_text: str, fork: str, people: list[dict]) -> list[dict]:
    """One model call for the whole page, not one per person.

    Uses MODEL (flash-lite by default) rather than OUTREACH_MODEL: this is a
    coarse sort, and the drafting model's daily quota is the scarce one.
    """
    config = genai_types.GenerateContentConfig(
        system_instruction=f"{TRIAGE_INSTRUCTIONS}\n\nCANDIDATE CV:\n\n{cv_text}",
        response_mime_type="application/json",
        max_output_tokens=4000,
        temperature=0.2,
        thinking_config=genai_types.ThinkingConfig(thinking_budget=0),
    )
    last_err = None
    for attempt in range(3):
        try:
            resp = client.models.generate_content(
                model=MODEL,
                contents=people_to_prompt(fork, people),
                config=config,
            )
            data = extract_json(resp.text or "")
            rows = (data or {}).get("results")
            if not isinstance(rows, list):
                raise ValueError("model did not return a results list")
            break
        except Exception as e:
            last_err = e
            if any(t in str(e).lower() for t in ("429", "503", "rate", "quota", "unavailable")):
                time.sleep(2 ** attempt * 2)
                continue
            raise
    else:
        raise RuntimeError(f"Triage failed: {last_err}")

    by_index = {}
    for r in rows:
        try:
            i = int(r.get("i"))
        except (TypeError, ValueError):
            continue
        if not 0 <= i < len(people):
            continue
        verdict = str(r.get("verdict") or "maybe").lower()
        if verdict not in ("draft", "maybe", "skip"):
            verdict = "maybe"
        area = r.get("area") if r.get("area") in AREAS else "other"
        try:
            score = max(0, min(100, int(r.get("score", 0))))
        except (TypeError, ValueError):
            score = 0
        by_index[i] = {"verdict": verdict, "score": score, "area": area,
                       "reason": str(r.get("reason") or "").strip(),
                       "overlap": str(r.get("overlap") or "").strip()}

    # A card the model skipped entirely is a "maybe", not a silent disappearance.
    out = []
    for i, p in enumerate(people):
        row = by_index.get(i) or {
            "verdict": "maybe", "score": 0, "area": "other", "overlap": "",
            "reason": "the model did not rate this card",
        }
        out.append({**p, **row})
    return out


@app.post("/triage")
def triage():
    body = request.get_json(silent=True) or {}
    cv = (body.get("cv") or "").strip()
    fork = body.get("fork") or ""
    people = body.get("people") or []
    if not cv:
        return jsonify(error="Missing 'cv' in body."), 400
    if not isinstance(people, list) or not people:
        return jsonify(error="Body 'people' must be a non-empty list."), 400
    if len(people) > 40:
        people = people[:40]
    if not client:
        return jsonify(error="GOOGLE_API_KEY not configured on the helper."), 500
    print(f"[triage] {len(people)} cards, model={MODEL}")
    try:
        results = triage_people(cv, fork, people)
    except Exception as e:
        return jsonify(error=str(e)), 502
    counts = {}
    for r in results:
        counts[r["verdict"]] = counts.get(r["verdict"], 0) + 1
    print(f"[triage] -> {counts}")
    log_event(
        "triage",
        model=MODEL,
        counts=counts,
        # Both halves: what the adapter read off each card, and what came back.
        cards=[{k: trim(p.get(k), 200) for k in
                ("name", "headline", "location", "snippet", "degree", "open_to_work", "url")}
               for p in results],
        verdicts=[{k: r.get(k) for k in ("name", "verdict", "score", "area", "reason", "overlap")}
                  for r in results],
    )
    return jsonify(results=results)


@app.get("/outreach/coverage")
def outreach_coverage():
    rows = outreach_rows()
    by_area = {a: {"contacted": 0, "replied": 0} for a in AREAS}
    for r in rows:
        a = (r.get("area") or "other").strip() or "other"
        if a not in by_area:
            a = "other"
        by_area[a]["contacted"] += 1
        if (r.get("status") or "").strip() in ("replied", "done"):
            by_area[a]["replied"] += 1
    today = date.today().isoformat()
    sent_today = sum(1 for r in rows if (r.get("sent_at") or "").startswith(today))
    return jsonify(
        by_area=by_area,
        target=AREA_TARGET,
        total=len(rows),
        sent_today=sent_today,
        path=str(OUTREACH_CSV),
    )


if __name__ == "__main__":
    print(f"[i] JobMatch helper starting on http://127.0.0.1:{PORT}")
    print(f"[i] provider=google-gemini  model={MODEL}")
    print(f"[i] cv_file={CV_FILE} (exists={CV_FILE.exists()})")
    print(f"[i] cache_dir={CACHE_DIR}  max_parallel={MAX_PARALLEL}")
    print(f"[i] outreach_model={OUTREACH_MODEL}  outreach_csv={OUTREACH_CSV}  followup_days={FOLLOWUP_DAYS}")
    app.run(host="127.0.0.1", port=PORT, debug=False)

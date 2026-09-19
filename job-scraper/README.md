# JobMatch

A personal Chrome extension that scrapes job listings from any site you're already logged into (starting with [careerdays.polito.it](https://careerdays.polito.it/offerte-di-lavoro/), with a stub for LinkedIn), then ranks them against your CV using Google Gemini (free tier).

```
┌──────────────────┐    POST /classify    ┌──────────────────┐
│  Chrome ext.     │ ───────────────────▶ │  Local helper    │
│  (scrapes page)  │                      │  (Flask + Gemini)│
│  uses your       │ ◀─────────────────── │  reads CV from   │
│  logged-in tab   │     scored jobs      │  ../public/...   │
└──────────────────┘                      └──────────────────┘
```

The extension uses your existing browser session (no separate login dance), and the API key stays on your machine in the local helper — not in the browser.

The same extension has a second mode, **MentorMatch**: on a LinkedIn profile page it drafts a personalised outreach message to that person and tracks who you contacted. See [MentorMatch](#mentormatch--mentor-outreach) below.

---

## MentorMatch — mentor outreach

Purpose: contact more potential mentors in less time *without* automating LinkedIn
itself (auto-sending gets accounts restricted). The tool does research + drafting +
tracking; **you** read every message and press Send.

```
linkedin.com/in/<slug>         popup                          helper
┌────────────────────┐  POST /outreach  ┌──────────────────────────────┐
│ profile adapter    │ ───────────────▶ │ CV + your fork + profile     │
│ name, headline,    │                  │ → fit score + mentor type    │
│ about, experience, │ ◀─────────────── │ → connection note (≤300)     │
│ education, raw     │   JSON draft     │ → LinkedIn DM (5 lines)      │
└────────────────────┘                  │ → email subject + body       │
   [Copy] [Open in Gmail]               │ → follow-up text             │
   [Mark as sent] ─── POST /outreach/log ─▶ helper/outreach.csv        │
   "N follow-ups due" ◀── GET /outreach/due                            │
                                        └──────────────────────────────┘
```

### A. Fresh machine — do this once

Needs Python 3.10+ and Chrome (or Edge). Node is **not** needed.

```powershell
git clone https://github.com/eynmim/eynmim.github.io.git      # or: git pull
cd eynmim.github.io\job-scraper\helper
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
notepad .env
```

Put these two lines in `.env` (free key from <https://aistudio.google.com/apikey>,
your own Google account, no card):

```
GOOGLE_API_KEY=AIza...
MODEL=gemini-2.5-flash-lite
```

Leave `OUTREACH_MODEL` unset (default `gemini-2.5-flash`). `flash-lite` drops the
"one numeric achievement" rule — tested.

```powershell
python server.py
```

Expect `outreach_model=gemini-2.5-flash ... followup_days=35` in the console and
`"has_api_key": true, "cv_exists": true` at <http://127.0.0.1:5577/health>.
**Keep this window open** whenever you use the extension.

Extension:

1. `chrome://extensions` → **Developer mode** on → **Load unpacked** →
   `eynmim.github.io\job-scraper\extension` → pin the JobMatch icon.
2. Right-click icon → **Options**:
   - **Load CV from helper**
   - **Your current career fork** — two honest sentences, in English:
     `Right now I am stuck between ___ and ___.` `In 3 years I want to be ___.`
     Every draft turns this into the one question you ask. Without it the
     messages come out generic. This is the most important field.
   - **Save**

After every `git pull` that touches `extension/`: `chrome://extensions` → ⟳ Reload.

### B. Per person (~1 minute)

```
① open linkedin.com/in/<person>  → scroll down once so Experience loads
② JobMatch icon → Type: auto-detect → [Draft message]        (5–15 s)
③ read the fit score FIRST
      70+     go ahead
      40–70   read the reason, your call
      < 40    skip, next person (the reason says why)
④ Copy ONE of:
      Connection note  → not connected yet   (LinkedIn: Connect → Add a note → paste)
      LinkedIn message → already connected   (Message → paste)
      Email            → [Open in Gmail] → type the address → Send   (professors, alumni)
   READ IT before sending. Edit in the box if anything is off.
⑤ sent? → "Sent via:" = the channel you used → [Mark as sent]
      → "Logged. Follow up on 2026-xx-xx."
```

### B2. Doing several in one sitting

Two pages hang off the popup header, **Search** and **Batch**. Both exist to cut the time
you spend, not to remove you from the loop: nothing is scraped in the background and
nothing is ever sent.

**Search** turns [TITLES.md](TITLES.md) into buttons. Per area it shows who to look for,
the area-specific question from §D2, how many people you have already contacted out of the
two you are aiming for, and one click per Boolean string (by title, by tools). Two toggles
add `"Politecnico di Torino"` or a seniority filter to every search, and a button warns
when the string passes ~15 terms because LinkedIn silently truncates past that. The counter
in the corner is today's messages against the daily cap in §D.

**Batch** takes the `linkedin.com/in/` tabs you already have open and drafts them one after
another, so the model's 5-15 seconds stop being your waiting time. Middle-click a handful
of search results, scroll each tab once so Experience loads, then open Batch, untick anyone
you don't want, and hit Draft selected. Each result comes back as the same card the popup
shows: fit score first, then the four drafts, then Mark as sent. Read every one before it
goes anywhere. If the Gemini quota runs out mid-run the batch stops there and says so; the
drafts already on screen stay usable.

Drafting ten and sending five is fine. Sending ten is not, and the page says so when you
select more than eight.

### C. Follow-ups

Whenever you open the popup on any profile, overdue contacts are listed at the top
("N follow-ups due: …"). For each one: open their profile → Draft → copy the
**Follow-up** box → replace `[one concrete thing you did since - fill in]` with
something **true** (a result, a finished project) → send.

When someone replies: open `helper/outreach.csv` (Excel/Notepad), change that row's
`status` from `sent` to `replied` / `done` / `dead`. It leaves the due list.

### D. Rules — you, not the tool

| do | don't |
|---|---|
| Max **5–8 messages per day**. LinkedIn flags bulk notes to strangers; quality beats volume anyway. | Never automate sending. Never paste in a loop. |
| Read every draft before Send. The tool drafts; you are responsible for what goes out. | Never send a follow-up with the `[fill in]` placeholder still in it. |
| Exploration mode (§D2): two people per area, one or two calls a week. Start with the easy ones (ex-manager at Stratobotic, PoliTo alumni). | Don't ask for a referral or a job in a first message. The prompt won't; don't add it by hand. |
| Fill the follow-up placeholder with something real. | Don't invent achievements when editing. Everything in the drafts is from the CV on purpose. |
| Target people **5–8 years ahead** of you — they remember your fork and have time. | Skip people 20 years ahead, same seniority as you, or unrelated field (fit score will say so). |

### D2. Exploring instead of deciding (current mode)

Early career, no specialization picked yet. The goal of the next three months is a map
of embedded, not a choice. The "fork" field then reads like this (this is what to put in
Options right now):

```
I'm early in my career (2 years of product firmware on ESP32-S3, some PCB, some robotics)
and I don't want to pick a specialization yet. I'm talking to people across embedded
(firmware, security, Linux, hardware, silicon, automotive, edge AI, robotics) to understand
what each one is really like day to day before I choose.
```

With an exploration fork the drafts change shape: the question is about the reality of
*their* area (what a normal week is, what they'd tell someone starting, what people complain
about after a year, whether they'd pick it again). They never ask "which should I choose"
and never list the areas.

Each draft is tagged with an `area` (shown in the popup, written to `outreach.csv`) so you
can see coverage. Target: **two people per area**, 16 conversations, one or two a week.

| area tag | who to search for | area-specific question |
|---|---|---|
| `firmware-platform` | Senior/Staff Firmware @ Nordic, Espressif, Silicon Labs, ST | how much of your week is new code vs debugging someone else's |
| `embedded-security` | Product/Firmware Security @ ST secure MCU, NXP, Infineon; automotive cyber @ Stellantis, Marelli | how much is engineering vs compliance and paperwork |
| `embedded-linux` | BSP/platform engineer at camera, gateway, robotics companies; Bootlin, Toradex | what made you leave bare-metal for Linux, any regrets |
| `hardware-pcb-power` | Hardware engineer @ Leonardo, Marelli, Turin startups | in the first 3 years how much is design vs BOM and suppliers |
| `silicon-soc-fpga` | Design/Verification @ ST Agrate, Infineon Villach | what does someone with product-firmware background lose and gain going into silicon |
| `automotive-safety` | @ Stellantis/CRF, Marelli, Italdesign, Bosch Italia | what do outsiders get wrong about automotive work |
| `edge-ai-dsp` | ML-on-edge @ Arduino, ST (STM32 AI), vision startups | how much ML vs embedded do you need, which is harder to learn late |
| `robotics-control` | @ Comau, PoliTo spin-offs | where's the line between robotics engineer and embedded engineer in your team |

**Ask everyone the same four questions** after the area-specific one, so answers compare:

1. What does a normal week actually look like, not the job description?
2. If you were 25 today with what you know, would you pick this area again? Why?
3. What do people entering this area usually complain about after a year?
4. Bigger or smaller in five years, and why?

**After every call, same day**, five lines in a private file (`exploration.md`, outside the
repo):

```
area | name | date
my energy after the call: up / flat / down      <- the signal that matters most
one thing I didn't know:
one thing that scared me:
talk to them again? yes / no
```

After 16, read the energy column first. The answer is usually there before any analysis.
Then switch the fork field to a dilemma ("stuck between A and B") and the drafts switch
shape with it.

### E. What the output looks like

Real run against a test profile ("Marco", PCB at ST → firmware → Staff FW at Nordic,
PoliTo alumnus). Fit 95, type `career`. Nothing here is edited.

**Connection note** (140/300)
> Your move from PCB design at ST to firmware architect at Nordic is exactly what I'm weighing. Mind if I ask you one thing about it sometime?

**LinkedIn message**
> Hi Marco,
>
> I'm an embedded engineer from PoliTo, currently designing an IoT product that achieved 6+ months battery life by cutting idle power 99%. I'm trying to decide between specializing in hardware/PCB or becoming a firmware architect.
>
> Your career path, moving from PCB design at ST to leading the BLE stack at Nordic, is the one I'm looking at. Did you ever regret leaving the hardware side completely? Could I ask you that properly over a call, 20 min max?

**Email** — subject `PoliTo alumnus: PCB to firmware, one question`, same content, one
sentence longer, then:
> Thanks,
> Ali Mansouri
> MSc Computer Engineering, Politecnico di Torino
> eynmim.github.io

**Follow-up** (5 weeks, no reply)
> Hi Marco, I wrote a few weeks ago about your move from PCB to firmware. Since I wrote, I've [one concrete thing you did since - fill in]. Still wondering if you ever regretted leaving hardware completely. Could I ask you that over a very short call?

Two more from the same run, so you can see the shape is *not* a template:

*technical* (Developer Advocate at Espressif who writes the ESP-IDF power docs), note:
> Your ESP-IDF power management docs helped me a lot. Mind if I ask you one thing about low-power design sometime?

*industry* (PoliTo professor, ex-ST), DM opens with `Prof. Sample,` never a first name:
> Your background at STMicroelectronics and as a professor here is very relevant. What kind of embedded roles do you see the local market hiring for right now? Would a short call be ok, whenever suits you?

Every DM contains: ONE number from the CV, ONE fact from *their* profile, ONE question
that sounds like coffee talk not an interview, and a short ask in different words each
time. The voice rules come from the `humanize-writing` skill: contractions, varied
sentence length, no em dashes, no lists of three, no "I am Ali Mansouri, a..." opener,
and a banned list (leverage, journey, insights, keen, fellow, "happy to work around your
schedule", "since we spoke", ...). A lint in the helper rejects drafts that break these
and asks the model once more; the fill-in placeholder must survive untouched.

### F. Who to look for

Don't search by title alone. A small-company "Electronics Engineer" often does the
board, the firmware and the EMC test, and is exactly who you want. **[TITLES.md](TITLES.md)**
has, per area, the English and Italian titles, the tool/part keywords that find people by
what they *do*, and copy-paste LinkedIn Boolean strings. The fit score judges by
experience, not title. The **Search** page (§B2) is that file as buttons, with
your coverage per area next to each one.

The flow is: the tool drafts the **first** message only. Replies are a conversation, and
that's yours by hand. The follow-up box is only for people who never answered.

### G. Troubleshooting

| symptom | cause / fix |
|---|---|
| "Helper unreachable" | `python server.py` not running, or `.venv` not activated |
| "Could not read a profile from this page" | not on a `/in/` URL, or page not loaded — scroll, retry |
| name/headline blank but a draft came | LinkedIn changed its DOM. Press **Check DOM** in the popup: it reruns the adapter and prints one line per field saying `ok` or `EMPTY`, with no helper call and no model call, so it costs nothing. **Copy report** puts it on the clipboard. Drafts keep working from the raw page text meanwhile; fix the selectors in `extension/adapters/linkedin-profile.js`. |
| "GOOGLE_API_KEY not configured" | check `.env`, restart helper |
| slow draft / 429 in helper console | Gemini free tier per-minute limit; helper retries with backoff, wait a few seconds |
| `502 ... 429 RESOURCE_EXHAUSTED ... exceeded your current quota` | the free tier's **daily** cap on `gemini-2.5-flash` is used up (each draft is 1-2 calls). Resets at midnight Pacific. Normal use (5-8 people/day) never hits it; a long test session does. |
| draft text looks generic | the **career fork** field in Options is empty |
| extension behaves oddly after `git pull` | `chrome://extensions` → ⟳ Reload |

### H. Internals

Prompt: `helper/server.py → OUTREACH_INSTRUCTIONS` (content rules + voice rules). Lint in
`draft_problems()`: AI-tell words, dashes as asides, exclamation marks, missing CV number,
missing follow-up placeholder → one retry with the problems listed. `draft_outreach()` also
enforces the forced type and strips a "hope this finds you well" opener. Tracker: `helper/outreach.csv` (columns `sent_at, name, url,
company, mentor_type, area, channel, followup_due, status, notes`) — **gitignored, real names**.
CORS is limited to `chrome-extension://` origins because `/cv`, `/outreach/due` and
`/outreach/coverage` expose personal data. Env: `OUTREACH_MODEL`, `FOLLOWUP_DAYS`,
`OUTREACH_CSV`, `AREA_TARGET`.

`GET /outreach/coverage` counts the tracker by area (`contacted`, `replied`) plus
`sent_today`, and is what the Search and Batch pages show. It reads the same CSV; no new
state. The search strings live in `extension/search.js` as data copied from TITLES.md —
when you edit one, edit both. Batch reuses `background.js → draftOutreach` per tab with a
1.5 s gap and stops the run on a 429.

Tested end-to-end (real extension in Chromium + fake `www.linkedin.com` over HTTPS +
real helper, 36 checks). [test/](test/) holds the headless checks that run anywhere:
`npm test` drives the Search and Batch pages in jsdom against stubbed `chrome.*`, and
`helper_test.py` covers the lint and the tracker endpoints against a temp CSV. Neither
touches LinkedIn, the real tracker, or Gemini. Not tested: LinkedIn's live DOM (see G),
clipboard in headless.

---

## One-time setup

### 1. Get a free Gemini API key

- Go to <https://aistudio.google.com/apikey>
- Sign in with your Google account.
- Click **Create API key** → copy it (starts with `AIza…`).
- No credit card required. Free tier is plenty for personal use.

### 2. Helper (local Python server)

```powershell
cd job-scraper/helper
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# edit .env and paste your GOOGLE_API_KEY
```

Test it:

```powershell
python server.py
# in another shell:
curl http://127.0.0.1:5577/health
```

You should see `{"ok": true, "has_api_key": true, "cv_exists": true, "provider": "google-gemini", ...}`.

### 3. Extension (Chrome)

1. Open `chrome://extensions/`
2. Toggle **Developer mode** (top right).
3. Click **Load unpacked** and pick `job-scraper/extension/`.
4. Pin the JobMatch icon to the toolbar.
5. Right-click the icon → **Options**. Click **Load CV from helper** (pulls your CV from `public/Ali_Mansouri_CV.md`), then **Save**.

---

## Daily use

1. Start the helper (`python server.py` from `job-scraper/helper/`).
2. Make sure you're logged into careerdays.polito.it in your normal Chrome.
3. Go to the listings page: <https://careerdays.polito.it/offerte-di-lavoro/>
4. Click the JobMatch icon → **Scan this page**.
5. Sort/filter the ranked results.

Each job gets a score (0–100), a one-sentence reason, plus matched and missing skills relative to your CV.

---

## How matching works

- The extension's content script collects job cards from the page (title, company, link).
- For each card, the background fetches the detail page (re-using your cookies) and grabs the full description.
- The local helper sends each job to Gemini (`gemini-2.5-flash` by default).
- Results are cached on disk by `hash(cv + job_url + description)`, so re-scanning is free.

To change the model edit `helper/.env`:
- `MODEL=gemini-2.5-flash-lite` — higher free-tier rate limits, slightly lower quality.
- `MODEL=gemini-2.5-pro` — best quality, lower free-tier rate limits.

**Rate limits:** Gemini's free tier caps requests per minute. If you hit limits, the helper retries with backoff, but a 200-job scan may take a couple of minutes. Lower `MAX_PARALLEL` in `.env` if you see many `429` errors.

---

## Adding a new site

Each site lives in `extension/adapters/<name>.js` and exposes:

```js
window.__JOBMATCH_ADAPTER = {
  name: "yourSite",
  collectJobs() { return [{ title, company, location, url, description }, ...]; }
};
```

Then wire the hostname in `background.js → pickAdapter()` and add it to `host_permissions` in `manifest.json`.

For LinkedIn: the stub at `adapters/linkedin.js` has the rough selector set — open `linkedin.com/jobs/search`, inspect a card, and tune.

---

## Troubleshooting

- **"Helper unreachable"** — start `python server.py` in `helper/`. Confirm `http://127.0.0.1:5577/health` returns OK.
- **"No jobs found on this page"** — open DevTools console on the listings page, click Scan, look for `[JobMatch:careerdays] collected N jobs from M cards`. If `M = 0`, the selectors in `adapters/careerdays.js` don't match the current DOM — add the right selector to `CARD_SELECTORS`.
- **Scores look off** — the prompt is in `helper/server.py → SYSTEM_INSTRUCTIONS`. Tighten the rubric to your taste (e.g., "treat seniority mismatch as hard-blocking").
- **Costs** — $0 on Gemini's free tier for personal volumes. If you eventually exceed free quota, Gemini Flash paid pricing is still cheap (~$0.0002 per job).
- **Rate-limited (429)** — lower `MAX_PARALLEL` in `helper/.env` to 1 or 2, or switch `MODEL` to `gemini-2.5-flash-lite`.

---

## Files

```
job-scraper/
├── extension/
│   ├── manifest.json
│   ├── popup.html / popup.js / popup.css
│   ├── options.html / options.js
│   ├── search.html / search.js    # TITLES.md as one-click searches + coverage
│   ├── batch.html / batch.js      # draft every open profile tab, still hand-sent
│   ├── background.js              # service worker
│   └── adapters/
│       ├── careerdays.js
│       ├── linkedin.js            # stub (jobs)
│       ├── linkedin-profile.js    # MentorMatch: one person
│       └── generic.js             # fallback
├── test/                          # headless checks, no browser and no API calls
│   ├── search.test.js / batch.test.js
│   └── helper_test.py
└── helper/
    ├── server.py                  # Flask + Claude
    ├── requirements.txt
    ├── .env.example
    ├── cache/                     # per-job result cache
    └── outreach.csv               # MentorMatch tracker (gitignored)
```

Local-only state (`.env`, `cache/`, `.venv/`) is gitignored.

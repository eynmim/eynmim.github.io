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

Purpose: cover more people in less time *without* automating LinkedIn itself (auto-sending gets accounts restricted). The tool does research + drafting + tracking; you press Send.

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

### Setup (once)

1. Extension → **Options** → fill **Your current career fork** — two honest sentences
   ("Right now I am stuck between ___ and ___. In 3 years I want to be ___."). Every
   draft turns this into the one specific question you ask. Skip it and messages come
   out generic.
2. Optional, in `helper/.env`: `OUTREACH_MODEL=gemini-2.5-flash` (default) — do **not**
   use `flash-lite` here, it drops the "one numeric achievement" rule.
   `FOLLOWUP_DAYS=35` sets when a contact shows up as due.

### First real test on a fresh machine (checklist)

```
[ ] git clone https://github.com/eynmim/eynmim.github.io.git  (or git pull)
[ ] cd job-scraper/helper && python -m venv .venv && .\.venv\Scripts\Activate.ps1
[ ] pip install -r requirements.txt
[ ] copy .env.example .env  -> paste GOOGLE_API_KEY (aistudio.google.com/apikey)
[ ] python server.py        -> http://127.0.0.1:5577/health shows has_api_key: true
[ ] chrome://extensions -> Developer mode -> Load unpacked -> job-scraper/extension
[ ] icon -> Options -> Load CV from helper -> fill "career fork" -> Save
[ ] open a real linkedin.com/in/<name> page, scroll once
[ ] icon -> Draft message
      name + headline filled?   if blank -> DevTools console, look for
                                [JobMatch:linkedin-profile] ... raw N chars
                                (raw > 0 means the model still has the text)
      fit score + reason sane?
      DM has ONE number from the CV, ONE fact from their profile, ONE question?
[ ] Copy -> paste in LinkedIn -> send yourself (never automated)
[ ] Mark as sent -> helper/outreach.csv has one row with followup_due = +35 days
[ ] reopen popup on another profile: no "due" banner yet (correct, it's day 0)
```

If the DOM selectors miss (blank name/headline), note which and fix
`extension/adapters/linkedin-profile.js`; the raw-text fallback keeps drafts
working meanwhile.

### Per person (~1 minute)

1. Open the person's profile (`linkedin.com/in/...`), scroll once so it loads.
2. Click the extension → pick a type or leave **auto-detect** → **Draft message**.
3. Read the **fit score** first. Below ~40 the reason will say why to skip — skip.
4. Edit the text if you want, then **Copy** the note (not yet connected) or the DM
   (already connected), paste into LinkedIn, send. For professors / alumni with a
   known address, **Open in Gmail** opens a prefilled compose window.
5. **Mark as sent** → appends a row to `helper/outreach.csv` with a follow-up date.

When you reopen the popup on any profile, contacts whose follow-up date has passed are
listed at the top. The **Follow-up** box gives you the text. After they reply, edit the
`status` column in the CSV by hand (`replied` / `done` / `dead`) to drop them from the list.

### The three mentor types the drafts target

| type | who | what the message asks |
|---|---|---|
| `career` | senior/staff/lead with a visible transition | how they made *that* transition |
| `technical` | hands-on expert in your stack, OSS maintainer, FAE | one technical decision + offers to send a design |
| `industry` | professor, alumni, ex-manager, local founder | coffee / office hour, what the market hires for |

Rules baked into the prompt: one numeric achievement from the CV, one specific anchor from
*their* profile, one question, a 20-minute bounded ask, never the word "mentor", never a
referral request in the first message. The prompt lives in
`helper/server.py → OUTREACH_INSTRUCTIONS`.

`outreach.csv` contains real people's names — it is gitignored on purpose.

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
│   ├── background.js              # service worker
│   └── adapters/
│       ├── careerdays.js
│       ├── linkedin.js            # stub (jobs)
│       ├── linkedin-profile.js    # MentorMatch: one person
│       └── generic.js             # fallback
└── helper/
    ├── server.py                  # Flask + Claude
    ├── requirements.txt
    ├── .env.example
    ├── cache/                     # per-job result cache
    └── outreach.csv               # MentorMatch tracker (gitignored)
```

Local-only state (`.env`, `cache/`, `.venv/`) is gitignored.

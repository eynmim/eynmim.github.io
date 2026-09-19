# job-scraper — instructions for Claude Code

Read `README.md` first; the MentorMatch section (A–H) is the operating manual.

Hard rules for this folder:

- **Never automate sending on LinkedIn** (no scripted clicks, no bulk paste, no
  headless session against the real site). The tool drafts; Ali sends by hand.
  Auto-sending gets the account restricted. This covers the Batch page too: it may
  draft many people at once, but it must never click, send, or open LinkedIn's
  own compose UI. If a change would make a message leave the machine without Ali
  reading it first, it is the wrong change.
- `helper/outreach.csv` holds real people's names. It is gitignored — never
  commit it, never paste its rows into a public artifact.
- `helper/.env` holds the Gemini key — never commit, never print it.
- Keep `OUTREACH_MODEL` on `gemini-2.5-flash`; `flash-lite` drops the
  "one numeric achievement" rule (verified).
- Drafts must contain only facts from `public/Ali_Mansouri_CV.md` or the
  recipient's profile. If a draft invents a project/number, that is a bug in
  `OUTREACH_INSTRUCTIONS` — fix the prompt, do not hand-edit the fabrication in.
- Drafts must not read as machine-written. Voice rules in `OUTREACH_INSTRUCTIONS`
  STEP 4 follow the `humanize-writing` skill; `draft_problems()` is the lint.
  When adding a rule, add it to both, and check it against a real draft.

Typical tasks and where to look:

| task | file |
|---|---|
| LinkedIn changed its DOM, fields come back blank | `extension/adapters/linkedin-profile.js`. Ask Ali for the **Check DOM** report from the popup first — it names the empty fields and costs no quota |
| tone / structure of the messages | `helper/server.py → OUTREACH_INSTRUCTIONS` |
| follow-up interval, CSV path, model | `helper/.env` (`FOLLOWUP_DAYS`, `OUTREACH_CSV`, `OUTREACH_MODEL`) |
| popup UI | `extension/popup.html` / `popup.js` / `popup.css` |
| a Boolean search string is wrong or missing | `extension/search.js` **and** `TITLES.md` — same data in two places, change both |
| coverage / daily counter is wrong | `helper/server.py → /outreach/coverage` |
| batch run misbehaves (stops early, skips a tab) | `extension/batch.js` |
| results ranking calls the wrong people worth opening | `helper/server.py → TRIAGE_INSTRUCTIONS` |
| result cards come back blank or duplicated | `extension/adapters/linkedin-people.js` |

Verify helper changes with a synthetic profile against `POST /outreach`
(see README §H), never against a real person's data.

Before and after touching `extension/` or the tracker endpoints, run the headless
checks — they need no browser, no LinkedIn and no Gemini quota:

```bash
cd job-scraper/test && npm install && npm test
cd ../helper && ./.venv/bin/python ../test/helper_test.py
```

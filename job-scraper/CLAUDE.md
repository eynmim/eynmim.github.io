# job-scraper — instructions for Claude Code

Read `README.md` first; the MentorMatch section (A–H) is the operating manual.

Hard rules for this folder:

- **Never automate sending on LinkedIn** (no scripted clicks, no bulk paste, no
  headless session against the real site). The tool drafts; Ali sends by hand.
  Auto-sending gets the account restricted.
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
| LinkedIn changed its DOM, fields come back blank | `extension/adapters/linkedin-profile.js` |
| tone / structure of the messages | `helper/server.py → OUTREACH_INSTRUCTIONS` |
| follow-up interval, CSV path, model | `helper/.env` (`FOLLOWUP_DAYS`, `OUTREACH_CSV`, `OUTREACH_MODEL`) |
| popup UI | `extension/popup.html` / `popup.js` / `popup.css` |

Verify helper changes with a synthetic profile against `POST /outreach`
(see README §H), never against a real person's data.

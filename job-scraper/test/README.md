# test

Headless checks. Nothing here touches LinkedIn, the real tracker, or the Gemini API —
the extension pages run in jsdom against stubbed `chrome.*` and `fetch`, and the helper
tests point `OUTREACH_CSV` at a temp file.

```bash
cd job-scraper/test
npm install          # jsdom only, no browser download
npm test             # the two extension pages

cd ../helper
./.venv/bin/python ../test/helper_test.py     # lint + tracker endpoints
```

`search.test.js` checks the coverage badges, the daily counter, the LinkedIn URLs each
button builds, and the ~15-term truncation warning from TITLES.md.

`batch.test.js` runs a three-tab batch where the third hits a 429, and checks that the
run stops there, the failure is shown rather than swallowed, and that **drafting alone
writes nothing to the tracker** — only Mark as sent does.

`helper_test.py` checks `draft_problems()` against a clean draft and a deliberately bad
one, then `/outreach/log`, `/outreach/due` and `/outreach/coverage` against a temp CSV.

What these do *not* cover: LinkedIn's live DOM (see README §G) and the Gemini call itself.

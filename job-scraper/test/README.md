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

`adapter.test.js` runs the profile adapter against two synthetic pages: the DOM it was
written for, and the shape LinkedIn moved to (no `<h1>`, old class names gone, entries
that are not `<li>`). It asserts `name` comes back non-empty on both, because that is
what `Mark as sent` writes into the tracker.

`popup.test.js` checks that every element the popup toggles actually hides. It exists
because `#mentor-row { display: flex }` outranked the UA stylesheet's `[hidden]`, so
"Draft message" showed on the LinkedIn feed, where reading a profile cannot work.

`search.test.js` checks the coverage badges, the daily counter, the LinkedIn URLs each
button builds, and the ~15-term truncation warning from TITLES.md.

`batch.test.js` runs a three-tab batch where the third hits a 429, and checks that the
run stops there, the failure is shown rather than swallowed, and that **drafting alone
writes nothing to the tracker** — only Mark as sent does.

`helper_test.py` checks `draft_problems()` against a clean draft and a deliberately bad
one, then `/outreach/log`, `/outreach/due` and `/outreach/coverage` against a temp CSV.

What these do *not* cover: LinkedIn's live DOM (see README §G) and the Gemini call itself.

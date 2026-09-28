# eynmim.github.io — instructions for Claude Code

Ali Mansouri's personal portfolio. Vite + React 19 + Tailwind 4 + Framer Motion + Lenis,
deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.
`npm ci` · `npm run dev` · `npm run build` · `npm run lint`.

**This repo is public and is the first thing a recruiter opens.** Everything below follows
from that.

## Publishing rules

- **No employer hardware detail.** Board files, layouts, 3D models (`.glb`), renders,
  schematics, part numbers, component values — none of it goes on the site or in the repo
  without written approval from the employer. When in doubt, describe the work
  ("Li-ion charging station for a camera product: PCB design and firmware") and stop there.
- **No personal contact data beyond email and profile links.** No phone number anywhere in
  the site, the CV files, or the repo — scrapers harvest GitHub Pages.
- **Deleting a file does not unpublish it.** Anything that was committed stays in git
  history. Removing published-by-mistake data means `git filter-repo` + a force-push, and
  that is Ali's call, never something to run unprompted.
- **Nothing auto-publishes.** No workflow may add projects or push to `main` on its own.
  New projects go in by hand, or behind an explicit allowlist and a pull request.
- Facts shown on the site (employer legal name, role titles, dates) must match his
  LinkedIn. Recruiters cross-check.
- No CV file is served from `public/`. The last one carried a phone number and client
  part numbers, and nothing on the site linked it. If a downloadable CV comes back, it
  is a sanitised copy added on purpose, not the master from `F:\ALI_CV`.

## Open review

An external technical review lives in `.review/` (gitignored — it quotes the confidential
details it asks to remove, so it must never be committed). `.review/CHECKLIST.md` is the
working list: P0 first, then P1, then P2. Update it as items land, with the commit sha.

## Layout

| what | where |
|---|---|
| sections rendered on the page | `src/components/` (only the ones imported by `App.jsx` are live) |
| project and experience content | `src/data/projectsData.js`, `src/components/Experience.jsx` |
| i18n strings | `src/i18n/translations.js`, `src/context/LanguageContext.jsx` |
| head tags, fonts | `index.html` |
| MentorMatch outreach tool | moved out on 2026-09-28 to the private repo `eynmim/mentormatch` |

Keep changes surgical: this is a design-led site, so don't reformat or "improve" components
that the task didn't ask about.

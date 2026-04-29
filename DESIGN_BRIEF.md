# Ali Mansouri Portfolio — Design Brief

> Working document. Each section is self-contained so I can paste any single
> section into Claude (claude.ai) without dragging the rest along.

---

## How to use this brief

1. Pick the section you want help with (e.g. "1. Logo").
2. Copy that section **plus** the "Project snapshot" and "Visual identity"
   blocks below — they are the shared context Claude needs every time.
3. Paste into a fresh Claude conversation.

---

## Project snapshot

- **Owner:** Ali Mansouri — Embedded Systems Engineer, based in Turin, Italy.
- **Site type:** Single-page personal portfolio.
- **Stack:** React 19, Vite, Tailwind v4, Framer Motion, Three.js (PCB viewer),
  Lenis (smooth scroll).
- **Audience:** hiring managers, technical recruiters, fellow engineers.
- **Tone of voice:** technical, dry, confident, lightly playful — never corporate.
- **Sections currently on the site:** Hero → Projects → Skills → Experience →
  Contact, plus a navbar, footer, and a CV modal.

---

## Visual identity (current)

**Aesthetic:** cyberpunk / PCB / IC-chip / oscilloscope. Dark, technical,
"engineer's workshop" — not "agency landing page".

**Palette**

| Role | Hex | Notes |
|---|---|---|
| Background base | `#050a0e` | near-black, slight blue cast |
| Background secondary | `#0a1018` | navbar, cards |
| Background card | `#0c1622` | raised surfaces |
| **Primary accent — "signal cyan"** | `#00f0ff` | the hero color |
| LED green | `#39ff14` | "online" indicators |
| LED amber | `#ffbe0b` | "active" indicators |
| Magenta | `#ff2d6b` | error / hot accent |
| Blue neon | `#4895ef` | secondary accent |
| Purple neon | `#b537f2` | tertiary accent |
| Text primary | `#e2e8f0` | body copy |
| Text secondary | `#8892a4` | captions, labels |
| Text muted | `#3e4a5c` | hints |

**Typography**
- `JetBrains Mono` — labels, numbers, code, anything technical.
- `Space Grotesk` — headings and body.

**Recurring visual motifs**
- Circuit traces and IC pin headers.
- Glowing LEDs and neon flicker animations.
- Oscilloscope / schematic grid backgrounds.
- Monospaced section numbering with `0X.` prefixes.
- Subtle scanlines and CRT vibes.

---

## What I want help with

I'm rebuilding the design section by section. **Start with #1 — the logo.**
The other sections are stubs I'll fill in as I work through them.

---

# 1. LOGO — Redesign

## Current logo

A 32×32 SVG of an IC chip:
- Rounded-rectangle outline, cyan stroke on near-black fill.
- Six pin lines on each of the four sides.
- A small pulsing LED dot in the top-left corner.
- The letters **"AM"** centered in monospace cyan.

Used in two places:
- [src/components/AMChipLogo.jsx](src/components/AMChipLogo.jsx) — in the navbar.
- [public/favicon.svg](public/favicon.svg) — browser tab.

```
+--+----+----+----+--+
|  |    |    |    |  |
+--+----+----+----+--+
|     ┌──────────┐    |
|     │   AM     │    |
|     └──────────┘    |
+--+----+----+----+--+
|  |    |    |    |  |
+--+----+----+----+--+
```

## Why I'm not happy with it

> _TODO — fill in before sending to Claude. Some candidates to pick from
> or rewrite in your own words:_
> - Too generic — "a chip with letters in it" reads as a stock embedded cliché.
> - The "AM" letterforms in monospace feel weak / forgettable.
> - Too busy at 32×32; the pin lines turn into noise instead of detail.
> - Doesn't survive at 16×16 (favicon) — the AM becomes unreadable.
> - Doesn't say anything specific about *me*; any embedded engineer could use it.

## What the logo must do

- Read clearly at **32×32** (navbar) and at **16×16** (favicon).
- Work on a near-black background as the primary case.
- Survive on a light/white background — needed for the printed CV cover and
  for any LinkedIn/email signature use.
- Pair with the wordmark "Ali Mansouri / Embedded Systems" sitting to its right
  in the navbar without fighting it.
- Communicate **embedded systems / hardware + firmware** — not generic
  web-developer or SaaS.

## Hard constraints

- **Format:** SVG, hand-authored, no raster.
- **Animation:** optional and subtle. A single slow LED-style pulse is fine; no
  spinning, no morphing.
- **Palette:** stay within the site palette unless you propose a swap and
  justify it. Cyan `#00f0ff` is the default ink.
- **Mark vs. wordmark:** must include or imply the initials **AM**, OR propose
  a wordmark-only direction if you think the mark isn't carrying weight.
- **No generic clichés** I want to avoid: a literal microcontroller silhouette,
  a literal soldering iron, a generic "</>" code bracket, a power button glyph.

## What I want from Claude

1. **3–5 distinct logo directions.** For each:
   - One-line concept ("what it is, why it fits Ali").
   - Inline SVG, 32×32 viewBox, ready to drop into the React component.
   - One line on what it communicates and what it deliberately avoids.
2. **For your strongest direction:**
   - A 16×16 favicon variant (simplified for that size).
   - A horizontal wordmark lockup with "Ali Mansouri / Embedded Systems".
   - The light-background variant.
3. **A short verdict** — which direction is the most defensible long-term vs.
   which is the most "of-the-moment" trendy, and why.

## Paste-ready prompt for Claude Design

> Fill the four context slots first:
> - **Design System:** paste [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) _(I'll generate this on request)_
> - **Screenshots:** navbar, browser-tab favicon at actual size, hero, one project card
> - **Codebase:** [AMChipLogo.jsx](src/components/AMChipLogo.jsx), [favicon.svg](public/favicon.svg), [Navbar.jsx](src/components/Navbar.jsx), [index.css](src/index.css)
>
> Then paste the block below.

```
I need help redesigning the personal logo for my portfolio site. The full
context — palette, type, motifs, the current mark — is in the attached
design system, screenshots, and code files. Read those first, then deliver
the work below.

## Who this is for
Ali Mansouri — embedded systems engineer based in Turin, Italy. One-page
personal portfolio. Audience is hiring managers, recruiters, and other
engineers. The site is a dark cyberpunk / PCB / oscilloscope aesthetic
anchored on signal cyan #00f0ff over near-black. Tone is technical, dry,
confident, lightly playful — never corporate.

## What's wrong with the current mark
The current "AM-inside-a-chip" reads as stock embedded — it could belong
to any embedded engineer. The AM letterforms in monospace feel weak, the
pin-line detail turns into noise at 32px and disappears at 16px (favicon),
and the mark is doing zero work to differentiate me. I want something that
still feels native to the PCB world the site lives in, but earns its
place — a mark, not a placeholder.

## Hard constraints
- SVG only, hand-authored, 32×32 viewBox as the primary canvas.
- Must read clearly at 16×16 favicon size.
- Must work on near-black (primary case) AND on white (CV cover, LinkedIn,
  email signature).
- Default ink: cyan #00f0ff. You may propose a swap, but justify it.
- Must include or imply the initials AM — OR propose a wordmark-only
  direction if you think the mark isn't earning its keep.
- Sits next to the wordmark "Ali Mansouri / Embedded Systems" in the
  navbar; it must not fight that lockup.
- Animation is optional and must be subtle — one slow LED-style pulse,
  nothing spinning, nothing morphing.
- Avoid: literal MCU silhouette, soldering iron, "</>" code bracket,
  power-button glyph, generic "circuit-board texture" wash.

## Deliverables
1. **3–5 distinct directions.** For each:
   - One-line concept — what it is, and why it's Ali specifically (not
     generic-embedded).
   - Inline SVG, 32×32 viewBox, drop-in ready for a React component.
   - One line on what it communicates and what it deliberately rejects.

2. **For your strongest direction, the full system:**
   - 16×16 favicon variant, simplified for that size — call out the
     simplifications you made and why.
   - Horizontal wordmark lockup: mark on the left, "Ali Mansouri" as the
     primary line, "Embedded Systems" as the secondary line.
   - Light-background variant (white bg) — show the ink/contrast swaps.
   - Optional motion variant: one slow pulse, ~2–3s loop, as inline SVG
     with SMIL or as a CSS animation snippet.

3. **Verdict.** One short paragraph: which direction is the most
   defensible long-term, which is the most "of-the-moment" trendy,
   and why I should care.

## What I'm watching for as I review
- Does the mark say something specific about *embedded systems*
  (signals, state, I/O, timing) — not just generic "tech"?
- Does it survive the 16×16 squint test?
- Does it read on white without looking like a screenshot of itself?
- Does it have one strong idea, or is it a collage of cool details?
- Does it pair with the wordmark, or compete with it?
```

---

# 2. HERO — _TBD_

> Stub. Will be filled in when we get to the hero section.

---

# 3. NAVIGATION — _TBD_

---

# 4. PROJECT CARDS — _TBD_

---

# 5. SKILLS SECTION — _TBD_

---

# 6. EXPERIENCE / TIMELINE — _TBD_

---

# 7. CONTACT — _TBD_

---

# 8. FOOTER — _TBD_

---

# 9. MICRO-INTERACTIONS & MOTION — _TBD_

> Cursor, scroll, hover states, page-load sequence, etc.

---

# 10. RESPONSIVE / MOBILE — _TBD_

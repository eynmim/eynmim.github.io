// LinkedIn *profile* adapter (linkedin.com/in/<slug>). Collects one person,
// not a job list. LinkedIn's DOM changes constantly, so every field is
// best-effort and the raw page text is always included — the helper's model
// falls back to it when the structured fields come up empty.

(function () {
  const text = (el) => (el?.innerText || el?.textContent || "").replace(/\s+/g, " ").trim();

  function sectionByHeading(re) {
    // Profile sections are <section> blocks whose first heading names them.
    for (const sec of document.querySelectorAll("main section")) {
      const h = sec.querySelector("h2, h3, div[id] > span");
      if (h && re.test(text(h))) return sec;
    }
    return null;
  }

  function listItems(sec, max) {
    if (!sec) return [];
    const out = [];
    for (const li of sec.querySelectorAll("li")) {
      // Skip nested sub-items; keep top-level entries only.
      if (li.parentElement?.closest("li")) continue;
      // LinkedIn duplicates every string in an aria-hidden twin; drop the twins.
      const clone = li.cloneNode(true);
      clone.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
      const t = text(clone).slice(0, 300);
      if (t) out.push(t);
      if (out.length >= max) break;
    }
    return out;
  }

  function collectProfile() {
    const main = document.querySelector("main") || document.body;
    const name = text(main.querySelector("h1"));
    const headline = text(
      main.querySelector(".text-body-medium.break-words, div.text-body-medium")
    );
    const location = text(
      main.querySelector(".text-body-small.inline.t-black--light.break-words, span.text-body-small.inline")
    );
    const aboutSec = sectionByHeading(/^about$/i);
    const about = aboutSec ? text(aboutSec).replace(/^About\s*/i, "").slice(0, 1500) : "";
    const experience = listItems(sectionByHeading(/^experience$/i), 10);
    const education = listItems(sectionByHeading(/^education$/i), 5);

    const rawClone = main.cloneNode(true);
    rawClone.querySelectorAll('script, style, noscript, [aria-hidden="true"]').forEach((n) => n.remove());
    const raw = (rawClone.innerText || "").replace(/\n{3,}/g, "\n\n").trim().slice(0, 8000);

    const profile = {
      name,
      headline,
      location,
      about,
      experience,
      education,
      url: window.location.href.split("?")[0],
      raw,
    };
    console.log(`[JobMatch:linkedin-profile] ${name || "(no name)"} — ${experience.length} roles, raw ${raw.length} chars`);
    return profile;
  }

  window.__JOBMATCH_PROFILE_ADAPTER = { name: "linkedin-profile", collectProfile };
})();

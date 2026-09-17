// LinkedIn *profile* adapter (linkedin.com/in/<slug>). Collects one person,
// not a job list. LinkedIn's DOM changes constantly, so every field is
// best-effort and the raw page text is always included — the helper's model
// falls back to it when the structured fields come up empty.

(function () {
  // LinkedIn renders most strings twice: <span aria-hidden="true">X</span>
  // (the visible one) followed by <span class="visually-hidden">X</span> for
  // screen readers. Drop only the screen-reader twin so text isn't doubled.
  function text(el) {
    if (!el) return "";
    const clone = el.cloneNode(true);
    clone.querySelectorAll(".visually-hidden").forEach((n) => n.remove());
    return (clone.innerText || clone.textContent || "").replace(/\s+/g, " ").trim();
  }

  function section(anchorId, headingRe) {
    // Preferred: each profile card carries an empty anchor <div id="experience">.
    const anchor = document.getElementById(anchorId);
    const byAnchor = anchor?.closest("section");
    if (byAnchor) return byAnchor;
    // Fallback: first section whose heading text matches.
    for (const sec of document.querySelectorAll("main section")) {
      const h = sec.querySelector("h2, h3");
      if (h && headingRe.test(text(h))) return sec;
    }
    return null;
  }

  function listItems(sec, max) {
    if (!sec) return [];
    const out = [];
    for (const li of sec.querySelectorAll("li")) {
      // Skip nested sub-items (multiple roles at one company); keep top-level entries.
      if (li.parentElement?.closest("li")) continue;
      const t = text(li).slice(0, 300);
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
    const aboutSec = section("about", /^about$/i);
    const about = aboutSec ? text(aboutSec).replace(/^About\s*/i, "").slice(0, 1500) : "";
    const experience = listItems(section("experience", /^experience$/i), 10);
    const education = listItems(section("education", /^education$/i), 5);

    const rawClone = main.cloneNode(true);
    rawClone.querySelectorAll("script, style, noscript, .visually-hidden").forEach((n) => n.remove());
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

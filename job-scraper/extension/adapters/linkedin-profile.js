// LinkedIn *profile* adapter (linkedin.com/in/<slug>). Collects one person,
// not a job list. LinkedIn's DOM changes constantly, so every field is
// best-effort and the raw page text is always included — the helper's model
// falls back to it when the structured fields come up empty.
//
// Every field tries the structured DOM first and then something LinkedIn is
// unlikely to move: the tab title, the anchor ids, the order of the top card's
// own lines. When a class name changes, that second layer keeps working.

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

  function lines(el) {
    if (!el) return [];
    const clone = el.cloneNode(true);
    clone.querySelectorAll("script, style, noscript, .visually-hidden").forEach((n) => n.remove());
    return (clone.innerText || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }

  // The top card renders inline, so innerText runs name, connection degree and
  // headline together on one line. The DOM still keeps them as separate text
  // nodes, and node order survives LinkedIn's class renames.
  function textParts(root) {
    if (!root) return [];
    const out = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n.parentElement?.closest(".visually-hidden")) continue;
      const t = (n.nodeValue || "").replace(/\s+/g, " ").replace(/^[·•|\s]+/, "").trim();
      if (t) out.push(t);
    }
    return out;
  }

  // Connection degrees, counts and the action buttons that sit between the
  // name and the headline.
  function isChrome(t) {
    return (
      t.length < 3 ||
      /^\d+(st|nd|rd|th)\+?$/i.test(t) ||
      /^[\d,.]+\s*(followers?|connections?|mutual)/i.test(t) ||
      /^(message|follow|following|connect|more|contact info|save to pdf|show all|pending|open to|add profile section|enhance profile)/i.test(t)
    );
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

  // Entries used to be <li>. When they are not, fall back to the direct
  // children of the deepest list-ish container in the card.
  function listItems(sec, max) {
    if (!sec) return [];
    const out = [];
    const push = (t) => {
      const s = (t || "").slice(0, 300);
      if (s && !out.includes(s)) out.push(s);
    };

    for (const li of sec.querySelectorAll("li")) {
      // Skip nested sub-items (multiple roles at one company); keep top-level entries.
      if (li.parentElement?.closest("li")) continue;
      push(text(li));
      if (out.length >= max) return out;
    }
    if (out.length) return out;

    // No <li> at all: take the widest set of sibling blocks under the card and
    // treat each as one entry. Skips the heading and the "Show all" footer.
    const heading = sec.querySelector("h2, h3");
    const headingText = text(heading).toLowerCase();
    let best = [];
    for (const container of sec.querySelectorAll("div, ul, ol")) {
      const kids = [...container.children].filter((el) => {
        const t = text(el);
        return t.length > 20 && !t.toLowerCase().startsWith(headingText) && !/^show all/i.test(t);
      });
      if (kids.length > best.length) best = kids;
    }
    for (const el of best) {
      push(text(el));
      if (out.length >= max) break;
    }
    return out;
  }

  // The name is the one field the drafts cannot do without: it is what the
  // tracker rows are keyed on. Three independent sources, cheapest first.
  function profileName(topCard) {
    for (const h of document.querySelectorAll("h1")) {
      const t = text(h);
      if (t && t.length <= 100) return t;
    }
    // "Callum Allen | LinkedIn", sometimes prefixed with an unread count.
    const title = document.title.replace(/^\(\d+\)\s*/, "");
    const m = title.match(/^(.+?)\s*\|\s*LinkedIn/i);
    if (m && m[1] && !/^linkedin$/i.test(m[1].trim())) return m[1].trim();
    // Last resort: the first line of the top card, before the degree badge.
    const first = lines(topCard)[0] || "";
    return first.split("·")[0].trim();
  }

  function topCardOf(main) {
    // The name sits in the first card of the profile, above the About anchor.
    const about = document.getElementById("about")?.closest("section");
    for (const sec of main.querySelectorAll("section")) {
      if (sec === about) break;
      if (text(sec)) return sec;
    }
    return main.querySelector("section") || main;
  }

  function collectProfile() {
    const main = document.querySelector("main") || document.body;
    const topCard = topCardOf(main);
    const name = profileName(topCard);

    let headline = text(
      main.querySelector(".text-body-medium.break-words, div.text-body-medium")
    );
    let location = text(
      main.querySelector(".text-body-small.inline.t-black--light.break-words, span.text-body-small.inline")
    );

    // Fall back to the top card's text-node order: name, headline, location.
    if (!headline || !location) {
      const parts = textParts(topCard).filter((t) => !isChrome(t));
      const at = parts.findIndex((t) => t === name || t.startsWith(name));
      const rest = parts.slice(at >= 0 ? at + 1 : 0).filter((t) => t !== name);
      if (!headline) headline = rest[0] || "";
      if (!location) {
        location = rest.slice(1).find((t) => t !== headline && t.length <= 90) || "";
      }
    }

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

  // Structural facts about the page, for when a field still comes back empty
  // and the class names need looking at again. Read by the popup's Check DOM.
  function probeDom() {
    const main = document.querySelector("main") || document.body;
    const topCard = topCardOf(main);
    const sec = (id, re) => section(id, re);
    const describe = (s) => {
      if (!s) return "not found";
      const li = s.querySelectorAll("li").length;
      const top = [...s.querySelectorAll("li")].filter((l) => !l.parentElement?.closest("li")).length;
      return `found, ${li} li (${top} top-level), heading "${text(s.querySelector("h2, h3")).slice(0, 24)}"`;
    };
    return {
      hasMain: !!document.querySelector("main"),
      title: document.title.slice(0, 80),
      h1Count: document.querySelectorAll("h1").length,
      h1Texts: [...document.querySelectorAll("h1")].map((h) => text(h).slice(0, 40)),
      sectionsInMain: main.querySelectorAll("section").length,
      anchors: {
        about: !!document.getElementById("about"),
        experience: !!document.getElementById("experience"),
        education: !!document.getElementById("education"),
      },
      topCardLines: lines(topCard).slice(0, 4).map((l) => l.slice(0, 60)),
      topCardParts: textParts(topCard)
        .filter((t) => !isChrome(t))
        .slice(0, 10)
        .map((t) => t.slice(0, 60)),
      experienceCard: describe(sec("experience", /^experience$/i)),
      educationCard: describe(sec("education", /^education$/i)),
      oldSelectors: {
        headline: !!main.querySelector(".text-body-medium.break-words, div.text-body-medium"),
        location: !!main.querySelector(".text-body-small.inline.t-black--light.break-words, span.text-body-small.inline"),
      },
    };
  }

  window.__JOBMATCH_PROFILE_ADAPTER = { name: "linkedin-profile", collectProfile, probeDom };
})();

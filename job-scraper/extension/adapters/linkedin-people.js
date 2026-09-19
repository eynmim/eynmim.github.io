// LinkedIn *people search results* adapter (/search/results/people/).
// Collects the cards already on screen so the helper can sort them before you
// open anything. Read-only: it never clicks, never paginates, never opens a
// profile. You still choose who to look at.
//
// Same lesson as the profile adapter: class names churn, structure and text
// node order do not. Cards are found by the one thing a result card must have,
// a link to /in/<slug>, and read by walking their text nodes in order.

(function () {
  function text(el) {
    if (!el) return "";
    const clone = el.cloneNode(true);
    clone.querySelectorAll(".visually-hidden").forEach((n) => n.remove());
    return (clone.innerText || clone.textContent || "").replace(/\s+/g, " ").trim();
  }

  // The card footer lists mutual connections by name and a follower count.
  // Those names are comma-separated and read exactly like a location, so cut
  // the whole block rather than trying to tell them apart afterwards.
  const FOOTER = /mutual connections?|followers?\b/i;

  function inFooter(node, card) {
    let el = node.parentElement;
    for (let i = 0; i < 4 && el && el !== card; i++) {
      if (FOOTER.test(el.textContent || "")) return true;
      el = el.parentElement;
    }
    return false;
  }

  function textParts(root) {
    if (!root) return [];
    const out = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n.parentElement?.closest(".visually-hidden")) continue;
      if (inFooter(n, root)) continue;
      const t = (n.nodeValue || "").replace(/\s+/g, " ").replace(/^[·•|\s]+/, "").trim();
      if (t) out.push(t);
    }
    return out;
  }

  const DEGREE = /^(1st|2nd|3rd\+?)$/i;

  function isChrome(t) {
    return (
      t.length < 3 ||
      DEGREE.test(t) ||
      /^[\d,.]+\s*(followers?|connections?|mutual)/i.test(t) ||
      /^and \d+ other/i.test(t) ||
      /mutual connections?$/i.test(t) ||
      /^(connect|follow|message|view|pending|save|status is|open to work)/i.test(t)
    );
  }

  function looksLikePlace(t) {
    return /^[^,]{2,60}(,\s*[^,]{2,60}){1,3}$/.test(t) && !/\d/.test(t);
  }

  function slugOf(href) {
    const m = (href || "").split("?")[0].match(/\/in\/([^/]+)/);
    return m ? m[1] : null;
  }

  // Climb from the profile link until the block would swallow a second person.
  function cardFor(link, slug) {
    let el = link;
    let best = link;
    for (let i = 0; i < 8 && el.parentElement; i++) {
      el = el.parentElement;
      const slugs = new Set(
        [...el.querySelectorAll('a[href*="/in/"]')].map((a) => slugOf(a.getAttribute("href"))).filter(Boolean)
      );
      if (slugs.size > 1) break;
      best = el;
    }
    return best;
  }

  function collectPeople() {
    const main = document.querySelector("main") || document.body;
    const seen = new Set();
    const people = [];

    for (const link of main.querySelectorAll('a[href*="/in/"]')) {
      const slug = slugOf(link.getAttribute("href"));
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);

      const card = cardFor(link, slug);
      const cardText = text(card);
      const parts = textParts(card);

      // On some result layouts the /in/ link wraps the whole card rather than
      // just the name, so its text is the entire row. The first text node of
      // the card is the name in both layouts; the link is only preferred when
      // it is short enough to actually be one.
      const linkText = text(link)
        .replace(/^View\s+/i, "")
        .replace(/[’']s profile$/i, "")
        .split("·")[0]
        .trim();
      const name = linkText && linkText.length <= 60 ? linkText : parts[0] || "";
      const degree = parts.find((t) => DEGREE.test(t)) || "";
      const at = parts.findIndex((t) => t === name || t.startsWith(name));
      const rest = parts.slice(at >= 0 ? at + 1 : 0).filter((t) => t !== name && !isChrome(t));
      // Card order is reliably name, degree, headline, location, then extras.
      // Prefer something written like a place, but plenty of LinkedIn locations
      // have no comma at all ("Greater Turin Metropolitan Area"), so fall back
      // to position rather than leaving the field empty.
      const headline = rest[0] || "";
      const afterHeadline = rest.slice(1);
      const location = afterHeadline.find(looksLikePlace) || afterHeadline[0] || "";
      const snippet =
        afterHeadline.find((t) => /^(current|summary|past):/i.test(t)) ||
        afterHeadline.find((t) => t !== headline && t !== location && t.length > 30) ||
        "";

      people.push({
        name,
        headline,
        location,
        snippet,
        degree,
        open_to_work: /open to work|#open_to_work/i.test(cardText),
        url: `https://www.linkedin.com/in/${slug}`,
      });
    }

    console.log(`[JobMatch:linkedin-people] ${people.length} cards on this page`);
    return people;
  }

  window.__JOBMATCH_PEOPLE_ADAPTER = { name: "linkedin-people", collectPeople };
})();

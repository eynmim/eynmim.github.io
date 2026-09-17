// Generic fallback: looks for repeated sibling elements that each contain a
// single outbound link with a "job-ish" word in the URL or text.

(function () {
  const KEYWORDS = /job|career|offerta|annunc|posizion|vacancy|employment/i;

  function collectJobs() {
    const buckets = new Map();
    document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      const txt = a.textContent.trim();
      if (!KEYWORDS.test(href) && !KEYWORDS.test(txt) && txt.length < 8) return;
      // Skip nav / footer / very short anchors.
      if (txt.length < 4) return;
      const container =
        a.closest("article, li, .card, [class*='card'], [class*='job'], [class*='listing']") ||
        a.parentElement;
      if (!container) return;
      const parent = container.parentElement;
      if (!parent) return;
      if (!buckets.has(parent)) buckets.set(parent, new Set());
      buckets.get(parent).add(container);
    });

    let bestParent = null;
    let bestSize = 0;
    for (const [p, set] of buckets) {
      if (set.size > bestSize) {
        bestSize = set.size;
        bestParent = p;
      }
    }
    if (!bestParent) return [];

    const cards = Array.from(buckets.get(bestParent));
    const jobs = cards.map((card) => {
      const link = card.querySelector("a[href]");
      const url = link ? new URL(link.getAttribute("href"), location.href).href : "";
      const title =
        card.querySelector("h1, h2, h3, .title")?.textContent.trim() ||
        link?.textContent.trim() ||
        "";
      return {
        title,
        company: "",
        location: "",
        deadline: "",
        url,
        description: (card.innerText || "").trim().slice(0, 1000),
      };
    }).filter((j) => j.title && j.url);

    const seen = new Set();
    const out = [];
    for (const j of jobs) {
      if (seen.has(j.url)) continue;
      seen.add(j.url);
      out.push(j);
    }
    console.log(`[JobMatch:generic] collected ${out.length} jobs`);
    return out;
  }

  window.__JOBMATCH_ADAPTER = { name: "generic", collectJobs };
})();

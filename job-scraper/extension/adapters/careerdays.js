// Adapter for careerdays.polito.it/offerte-di-lavoro/
// Job cards on this site use:
//   - <span style="font-weight: bold; font-size: 20px;">Job Title</span>
//   - <img alt="Logo CompanyName" ...>  (company logo)
//   - A link/button "Visualizza offerta" pointing to the job detail page
//
// Strategy: find every "Visualizza offerta" link, walk up to the smallest
// ancestor that ALSO contains a bold-large title span — that's the card.
//
// Pagination: this listings index can be N pages deep. We discover all
// pagination URLs from the current page, then fetch each one in the
// background (using your logged-in cookies via credentials: 'include').

(function () {
  const VIEW_RE = /visualizza\s+offerta|view\s+offer/i;
  const PAGE_HREF_RE = /\/page\/\d+\/?(?:[?#]|$)|[?&]paged=\d+/i;
  const MAX_PAGES = 60;

  function isTitleSpan(el) {
    if (!el || el.tagName !== "SPAN") return false;
    const s = el.getAttribute("style") || "";
    const bold = /font-weight\s*:\s*(bold|[6-9]\d\d)/i.test(s) || el.style.fontWeight === "bold";
    const big = /font-size\s*:\s*(1[6-9]|[2-9]\d)px/i.test(s);
    return bold && big && el.textContent.trim().length >= 4;
  }

  function isJobDetailHref(href) {
    if (!href) return false;
    const low = href.toLowerCase();
    if (low.startsWith("javascript:") || low.startsWith("mailto:")) return false;
    if (/offerte-di-lavoro\/?$/i.test(low)) return false;
    if (PAGE_HREF_RE.test(low)) return false; // pagination, not a job detail
    return /offerta|offerte-di-lavoro\/[^\/]+|job|annunc|posizion/i.test(low);
  }

  function findCardForLink(linkEl, root) {
    let el = linkEl.parentElement;
    const stop = root || document.body;
    while (el && el !== stop) {
      const titleSpan = Array.from(el.querySelectorAll("span")).find(isTitleSpan);
      if (titleSpan) return { card: el, titleSpan };
      el = el.parentElement;
    }
    return null;
  }

  function companyFromCard(card) {
    const img = card.querySelector("img[alt], img[title]");
    if (!img) return "";
    const raw = (img.getAttribute("alt") || img.getAttribute("title") || "").trim();
    return raw.replace(/^logo\s+/i, "").trim();
  }

  // Pure per-document scraping (works for both the live document and a parsed
  // off-screen document returned by fetch()).
  function collectJobsFromDoc(doc, baseUrl) {
    const candidates = Array.from(doc.querySelectorAll("a[href]")).filter((a) => {
      const href = a.getAttribute("href") || "";
      const txt = (a.textContent || "").trim();
      return isJobDetailHref(href) || VIEW_RE.test(txt);
    });

    const seenUrl = new Set();
    const seenCard = new Set();
    const jobs = [];

    for (const link of candidates) {
      const href = link.getAttribute("href") || "";
      let url;
      try {
        url = href ? new URL(href, baseUrl).href.split("#")[0] : "";
      } catch {
        continue;
      }
      if (!url || seenUrl.has(url)) continue;

      const found = findCardForLink(link, doc.body);
      if (!found) continue;
      const { card, titleSpan } = found;
      if (seenCard.has(card)) continue;
      seenCard.add(card);
      seenUrl.add(url);

      jobs.push({
        title: titleSpan.textContent.trim(),
        company: companyFromCard(card),
        location: "",
        deadline: "",
        url,
        description: (card.textContent || "").trim().slice(0, 1500),
      });
    }
    return jobs;
  }

  function discoverPaginationUrls(doc, baseUrl) {
    const urls = new Set();
    doc.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (!PAGE_HREF_RE.test(href)) return;
      try {
        urls.add(new URL(href, baseUrl).href.split("#")[0]);
      } catch {}
    });
    // Sort by extracted page number so progress logs are sensible.
    return Array.from(urls).sort((a, b) => {
      const na = parseInt((a.match(/\/page\/(\d+)|paged=(\d+)/) || [])[1] || "0", 10);
      const nb = parseInt((b.match(/\/page\/(\d+)|paged=(\d+)/) || [])[1] || "0", 10);
      return na - nb;
    });
  }

  async function fetchDoc(url) {
    const r = await fetch(url, { credentials: "include" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const html = await r.text();
    return new DOMParser().parseFromString(html, "text/html");
  }

  async function collectJobs() {
    const baseUrl = window.location.href.split("#")[0];
    const allJobs = [];
    const seen = new Set();

    // Page 1: the document we're already on.
    const page1Jobs = collectJobsFromDoc(document, baseUrl);
    for (const j of page1Jobs) {
      if (seen.has(j.url)) continue;
      seen.add(j.url);
      allJobs.push(j);
    }
    console.log(`[JobMatch:careerdays] page 1 -> ${page1Jobs.length} jobs (total ${allJobs.length})`);

    const pages = discoverPaginationUrls(document, baseUrl).filter((u) => u !== baseUrl);
    console.log(`[JobMatch:careerdays] discovered ${pages.length} additional pages`);

    const toFetch = pages.slice(0, MAX_PAGES - 1);
    for (let i = 0; i < toFetch.length; i++) {
      const pageUrl = toFetch[i];
      try {
        const doc = await fetchDoc(pageUrl);
        const pageJobs = collectJobsFromDoc(doc, pageUrl);
        let added = 0;
        for (const j of pageJobs) {
          if (seen.has(j.url)) continue;
          seen.add(j.url);
          allJobs.push(j);
          added++;
        }
        console.log(
          `[JobMatch:careerdays] [${i + 2}/${pages.length + 1}] +${added} jobs from ${pageUrl} (total ${allJobs.length})`
        );
      } catch (e) {
        console.warn(`[JobMatch:careerdays] failed to fetch ${pageUrl}: ${e.message}`);
      }
    }

    console.log(`[JobMatch:careerdays] DONE. total unique jobs across all pages: ${allJobs.length}`);
    return allJobs;
  }

  window.__JOBMATCH_ADAPTER = { name: "careerdays", collectJobs };
})();

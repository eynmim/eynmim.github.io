// LinkedIn jobs adapter — stub. Tune selectors against linkedin.com/jobs/search
// once you're ready to use it.

(function () {
  function collectJobs() {
    const cards = document.querySelectorAll(
      "li.jobs-search-results__list-item, div.job-card-container, [data-job-id]"
    );
    const jobs = Array.from(cards).map((card) => {
      const link = card.querySelector("a.job-card-list__title, a[href*='/jobs/view/']");
      const url = link ? new URL(link.getAttribute("href"), window.location.href).href : "";
      const title = link?.textContent.trim() || card.querySelector("h3")?.textContent.trim() || "";
      const company =
        card.querySelector(".job-card-container__company-name, .artdeco-entity-lockup__subtitle")
          ?.textContent.trim() || "";
      const loc =
        card.querySelector(".job-card-container__metadata-item, .artdeco-entity-lockup__caption")
          ?.textContent.trim() || "";
      return {
        title,
        company,
        location: loc,
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
    console.log(`[JobMatch:linkedin] collected ${out.length} jobs`);
    return out;
  }

  window.__JOBMATCH_ADAPTER = { name: "linkedin", collectJobs };
})();

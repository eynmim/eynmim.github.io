// Background service worker. Coordinates: inject scraper into the active
// tab, collect job records, POST to local helper for classification.
// Also drafts mentor-outreach messages from a LinkedIn profile page.

const HELPER_DEFAULT = "http://127.0.0.1:5577";

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  // Run async work; keep the channel open by returning true.
  if (msg?.type === "scanAndClassify") {
    scanAndClassify(msg.tabId, msg.url)
      .then((results) => sendResponse({ ok: true, results }))
      .catch((err) => sendResponse({ ok: false, error: err.message || String(err) }));
    return true;
  }
  if (msg?.type === "triagePeople") {
    triagePeople(msg.tabId)
      .then((data) => sendResponse({ ok: true, ...data }))
      .catch((err) => sendResponse({ ok: false, error: err.message || String(err) }));
    return true;
  }
  if (msg?.type === "diagnoseProfile") {
    readProfile(msg.tabId, true)
      .then((data) => sendResponse({ ok: true, ...data }))
      .catch((err) => sendResponse({ ok: false, error: err.message || String(err) }));
    return true;
  }
  if (msg?.type === "draftOutreach") {
    draftOutreach(msg.tabId, msg.mentorType)
      .then((data) => sendResponse({ ok: true, ...data }))
      .catch((err) => sendResponse({ ok: false, error: err.message || String(err) }));
    return true;
  }
  return false;
});

async function scanAndClassify(tabId, url) {
  const adapterName = pickAdapter(url);

  // Inject the adapter, then the runner. Adapter sets window.__JOBMATCH_ADAPTER.
  await chrome.scripting.executeScript({
    target: { tabId, allFrames: false },
    files: [`adapters/${adapterName}.js`],
  });
  const [{ result: scrape }] = await chrome.scripting.executeScript({
    target: { tabId, allFrames: false },
    func: async () => {
      const a = window.__JOBMATCH_ADAPTER;
      if (!a) return { error: "Adapter did not load." };
      try {
        const jobs = await Promise.resolve(a.collectJobs());
        return { jobs };
      } catch (e) {
        return { error: e.message || String(e) };
      }
    },
  });

  if (scrape?.error) throw new Error(`Scrape failed: ${scrape.error}`);
  const jobs = scrape?.jobs || [];
  if (!jobs.length) throw new Error("No jobs found on this page. Check console for adapter errors.");

  // Optionally enrich each job by fetching its detail page (uses logged-in cookies).
  const enriched = await enrichJobs(jobs, tabId);

  // Send to local helper for classification.
  const { helperUrl, helperBase, cvText } = await loadHelperAndCv();

  const resp = await fetch(`${helperBase}/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cv: cvText, jobs: enriched }),
  }).catch((e) => {
    throw new Error(
      `Helper unreachable at ${helperUrl}. Is it running? (python helper/server.py)\n${e.message}`
    );
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Helper error ${resp.status}: ${t.slice(0, 300)}`);
  }
  const data = await resp.json();
  return data.results || [];
}

async function loadHelperAndCv() {
  const { helperUrl = HELPER_DEFAULT, cvText: storedCv = "" } = await chrome.storage.local.get([
    "helperUrl",
    "cvText",
  ]);
  const helperBase = helperUrl.replace(/\/$/, "");

  // Fall back to fetching CV from helper if storage is empty.
  let cvText = storedCv.trim();
  if (!cvText) {
    try {
      const cvResp = await fetch(`${helperBase}/cv`);
      if (cvResp.ok) {
        const cvData = await cvResp.json();
        cvText = (cvData.cv || "").trim();
        if (cvText) {
          await chrome.storage.local.set({ cvText });
          console.log(`[JobMatch] auto-loaded CV from helper (${cvText.length} chars)`);
        }
      }
    } catch (e) {
      // Will surface a clearer error below.
    }
  }
  if (!cvText) {
    throw new Error(
      "CV not set. Start the helper (python server.py) so the extension can auto-load it, " +
        "or paste your CV in Settings."
    );
  }
  return { helperUrl, helperBase, cvText };
}

// Inject the profile adapter and run it. Shared by draftOutreach and by the
// popup's DOM check, which reports what came back without calling anything —
// LinkedIn changes its DOM often enough that finding out should be free.
async function readProfile(tabId, withProbe) {
  await chrome.scripting.executeScript({
    target: { tabId, allFrames: false },
    files: ["adapters/linkedin-profile.js"],
  });
  const [{ result: scrape }] = await chrome.scripting.executeScript({
    target: { tabId, allFrames: false },
    func: (probeToo) => {
      const a = window.__JOBMATCH_PROFILE_ADAPTER;
      if (!a) return { error: "Profile adapter did not load." };
      try {
        const out = { profile: a.collectProfile() };
        if (probeToo && a.probeDom) out.probe = a.probeDom();
        return out;
      } catch (e) {
        return { error: e.message || String(e) };
      }
    },
    args: [!!withProbe],
  });
  if (scrape?.error) throw new Error(`Scrape failed: ${scrape.error}`);
  const profile = scrape?.profile;
  if (!profile || (!profile.name && !profile.raw)) {
    throw new Error("Could not read a profile from this page. Open a linkedin.com/in/<name> page and scroll once so it loads.");
  }
  return withProbe ? { profile, probe: scrape.probe } : profile;
}

// Read the search results already on screen and have the helper sort them.
// No profile is opened and nothing is clicked: this is the step that decides
// which profiles are worth opening by hand.
async function triagePeople(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId, allFrames: false },
    files: ["adapters/linkedin-people.js"],
  });
  const [{ result: scrape }] = await chrome.scripting.executeScript({
    target: { tabId, allFrames: false },
    func: () => {
      const a = window.__JOBMATCH_PEOPLE_ADAPTER;
      if (!a) return { error: "People adapter did not load." };
      try {
        return { people: a.collectPeople() };
      } catch (e) {
        return { error: e.message || String(e) };
      }
    },
  });
  if (scrape?.error) throw new Error(`Scrape failed: ${scrape.error}`);
  const people = scrape?.people || [];
  if (!people.length) {
    throw new Error(
      "No result cards on this page. Open a linkedin.com/search/results/people/ page and let it load."
    );
  }

  const { helperUrl, helperBase, cvText } = await loadHelperAndCv();
  const { careerFork = "" } = await chrome.storage.local.get(["careerFork"]);

  const resp = await fetch(`${helperBase}/triage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cv: cvText, fork: careerFork, people }),
  }).catch((e) => {
    throw new Error(
      `Helper unreachable at ${helperUrl}. Is it running? (python helper/server.py)\n${e.message}`
    );
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Helper error ${resp.status}: ${t.slice(0, 300)}`);
  }
  const data = await resp.json();
  return { results: data.results || [] };
}

async function draftOutreach(tabId, mentorType) {
  const profile = await readProfile(tabId);

  const { helperUrl, helperBase, cvText } = await loadHelperAndCv();
  const { careerFork = "" } = await chrome.storage.local.get(["careerFork"]);

  const resp = await fetch(`${helperBase}/outreach`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cv: cvText, fork: careerFork, profile, mentorType: mentorType || "auto" }),
  }).catch((e) => {
    throw new Error(
      `Helper unreachable at ${helperUrl}. Is it running? (python helper/server.py)\n${e.message}`
    );
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Helper error ${resp.status}: ${t.slice(0, 300)}`);
  }
  const draft = await resp.json();
  return { profile, draft };
}

function pickAdapter(url) {
  try {
    const host = new URL(url).hostname;
    if (host.endsWith("careerdays.polito.it")) return "careerdays";
    if (host.endsWith("linkedin.com")) return "linkedin";
  } catch {}
  return "generic";
}

async function enrichJobs(jobs, tabId) {
  // Decide which jobs need a detail-page fetch (card text was too thin).
  const ENRICH_THRESHOLD = 600;
  const tasks = jobs.map((j, i) => ({
    i,
    j,
    needs: !!j.url && (j.description || "").length < ENRICH_THRESHOLD,
  }));
  const out = jobs.map((j) => j);

  // Run enrichment fetches inside the tab (cookies + DOMParser available there).
  // One executeScript call handles a batch of URLs in parallel via Promise.all.
  const toEnrich = tasks.filter((t) => t.needs);
  if (!toEnrich.length) return out;

  const CHUNK = 8; // jobs per executeScript call (each call internally parallel)
  for (let start = 0; start < toEnrich.length; start += CHUNK) {
    const batch = toEnrich.slice(start, start + CHUNK);
    const urls = batch.map((t) => t.j.url);
    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId },
        func: async (detailUrls) => {
          const fetchOne = async (u) => {
            try {
              const r = await fetch(u, { credentials: "include" });
              if (!r.ok) return "";
              const html = await r.text();
              const doc = new DOMParser().parseFromString(html, "text/html");
              doc.querySelectorAll("script, style, noscript").forEach((n) => n.remove());
              const root = doc.querySelector("main") || doc.body;
              return (root?.innerText || "").trim().slice(0, 12000);
            } catch {
              return "";
            }
          };
          return await Promise.all(detailUrls.map(fetchOne));
        },
        args: [urls],
      });
      result.forEach((text, k) => {
        if (text) out[batch[k].i] = { ...out[batch[k].i], description: text };
      });
      console.log(`[JobMatch] enriched ${start + batch.length}/${toEnrich.length}`);
    } catch (e) {
      console.warn(`[JobMatch] enrichment batch failed: ${e.message}`);
    }
  }
  return out;
}

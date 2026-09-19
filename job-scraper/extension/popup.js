// Popup UI for JobMatch. Triggers scraping on the active tab,
// then sends results to the local helper for classification.
// On a LinkedIn profile page it switches to MentorMatch: draft an
// outreach message for that person and log it to the helper's CSV.

const HELPER_DEFAULT = "http://127.0.0.1:5577";

const els = {
  adapter: document.getElementById("adapter"),
  scanBtn: document.getElementById("scan-btn"),
  progress: document.getElementById("progress"),
  error: document.getElementById("error"),
  results: document.getElementById("results"),
  jobList: document.getElementById("job-list"),
  sort: document.getElementById("sort"),
  minScore: document.getElementById("min-score"),
  exportBtn: document.getElementById("export-btn"),
  settingsLink: document.getElementById("settings-link"),
  searchLink: document.getElementById("search-link"),
  batchLink: document.getElementById("batch-link"),
  // MentorMatch
  scanRow: document.getElementById("scan-row"),
  mentorRow: document.getElementById("mentor-row"),
  mentorType: document.getElementById("mentor-type"),
  draftBtn: document.getElementById("draft-btn"),
  diagBtn: document.getElementById("diag-btn"),
  diag: document.getElementById("diag"),
  diagBody: document.getElementById("diag-body"),
  diagCopy: document.getElementById("diag-copy"),
  peopleRow: document.getElementById("people-row"),
  triageBtn: document.getElementById("triage-btn"),
  triage: document.getElementById("triage"),
  triageSummary: document.getElementById("triage-summary"),
  peopleList: document.getElementById("people-list"),
  hideSkip: document.getElementById("hide-skip"),
  due: document.getElementById("due"),
  outreach: document.getElementById("outreach"),
  fitScore: document.getElementById("fit-score"),
  fitName: document.getElementById("fit-name"),
  fitMeta: document.getElementById("fit-meta"),
  fitReason: document.getElementById("fit-reason"),
  whyYou: document.getElementById("why-you"),
  note: document.getElementById("note"),
  noteLen: document.getElementById("note-len"),
  dm: document.getElementById("dm"),
  emailSubject: document.getElementById("email-subject"),
  email: document.getElementById("email"),
  followup: document.getElementById("followup"),
  gmailBtn: document.getElementById("gmail-btn"),
  sentChannel: document.getElementById("sent-channel"),
  markSentBtn: document.getElementById("mark-sent-btn"),
  sentStatus: document.getElementById("sent-status"),
};

let lastResults = [];
let lastOutreach = null; // { profile, draft }
let lastDiag = "";
let lastTriage = [];

document.addEventListener("DOMContentLoaded", async () => {
  els.settingsLink.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  els.searchLink.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL("search.html") });
  });
  els.batchLink.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL("batch.html") });
  });
  els.scanBtn.addEventListener("click", onScan);
  els.sort.addEventListener("change", render);
  els.minScore.addEventListener("input", render);
  els.exportBtn.addEventListener("click", onExport);

  els.draftBtn.addEventListener("click", onDraft);
  els.diagBtn.addEventListener("click", onDiagnose);
  els.diagCopy.addEventListener("click", onCopyDiag);
  els.triageBtn.addEventListener("click", onTriage);
  els.hideSkip.addEventListener("change", renderTriage);
  els.note.addEventListener("input", updateNoteLen);
  els.gmailBtn.addEventListener("click", onOpenGmail);
  els.markSentBtn.addEventListener("click", onMarkSent);
  for (const b of document.querySelectorAll(".copy-btn")) {
    b.addEventListener("click", () => copyDraft(b.dataset.src, b));
  }

  const tab = await getActiveTab();
  els.adapter.textContent = adapterLabelForUrl(tab?.url || "");
  if (isProfileUrl(tab?.url || "")) {
    els.scanRow.hidden = true;
    els.mentorRow.hidden = false;
    showDueFollowups();
  } else if (isPeopleSearchUrl(tab?.url || "")) {
    els.scanRow.hidden = true;
    els.peopleRow.hidden = false;
    showDueFollowups();
  }
});

function isProfileUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.endsWith("linkedin.com") && /^\/in\/[^/]+/.test(u.pathname);
  } catch {
    return false;
  }
}

function isPeopleSearchUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.endsWith("linkedin.com") && /^\/search\/results\/people\//.test(u.pathname);
  } catch {
    return false;
  }
}

async function helperBase() {
  const { helperUrl = HELPER_DEFAULT } = await chrome.storage.local.get(["helperUrl"]);
  return helperUrl.replace(/\/$/, "");
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function adapterLabelForUrl(url) {
  if (!url) return "—";
  if (isProfileUrl(url)) return "LinkedIn profile (MentorMatch)";
  if (isPeopleSearchUrl(url)) return "LinkedIn people search";
  try {
    const host = new URL(url).hostname;
    if (host.endsWith("careerdays.polito.it")) return "careerdays.polito.it";
    if (host.endsWith("linkedin.com")) return "linkedin.com (stub)";
    return `${host} (generic)`;
  } catch {
    return "—";
  }
}

// An undefined response means no listener matched: the service worker is
// running older code than this popup, which is what a half-applied reload
// looks like. Say that instead of "unknown error".
function backgroundError(resp) {
  if (resp?.error) return resp.error;
  return (
    "The background service worker did not answer. It is probably still running " +
    "the previous version: open the extensions page, toggle JobMatch off and on, " +
    "then refresh this tab."
  );
}

function setError(msg) {
  if (!msg) {
    els.error.hidden = true;
    els.error.textContent = "";
  } else {
    els.error.hidden = false;
    els.error.textContent = msg;
  }
}

function setProgress(msg) {
  if (!msg) {
    els.progress.hidden = true;
    els.progress.textContent = "";
  } else {
    els.progress.hidden = false;
    els.progress.textContent = msg;
  }
}

async function onScan() {
  setError("");
  setProgress("Scraping current page...");
  els.scanBtn.disabled = true;
  els.results.hidden = true;

  try {
    const tab = await getActiveTab();
    if (!tab?.id) throw new Error("No active tab.");

    // Ask background to coordinate the full pipeline.
    const resp = await chrome.runtime.sendMessage({
      type: "scanAndClassify",
      tabId: tab.id,
      url: tab.url,
    });

    if (!resp?.ok) throw new Error(backgroundError(resp));

    lastResults = resp.results || [];
    setProgress(`Got ${lastResults.length} jobs.`);
    render();
  } catch (e) {
    setError(e.message || String(e));
    setProgress("");
  } finally {
    els.scanBtn.disabled = false;
  }
}

function scoreClass(score) {
  if (score >= 75) return "s-high";
  if (score >= 50) return "s-mid";
  return "s-low";
}

function render() {
  const minScore = parseInt(els.minScore.value || "0", 10);
  const sortBy = els.sort.value;

  let rows = lastResults.filter((r) => (r.score ?? 0) >= minScore);
  rows.sort((a, b) => {
    if (sortBy === "score") return (b.score ?? 0) - (a.score ?? 0);
    if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
    if (sortBy === "company") return (a.company || "").localeCompare(b.company || "");
    return 0;
  });

  els.results.hidden = rows.length === 0;
  els.jobList.innerHTML = "";

  for (const r of rows) {
    const li = document.createElement("li");

    const head = document.createElement("div");
    head.className = "job-head";
    const scoreEl = document.createElement("span");
    scoreEl.className = `score ${scoreClass(r.score ?? 0)}`;
    scoreEl.textContent = r.score ?? "?";
    head.appendChild(scoreEl);
    const title = document.createElement("div");
    title.className = "job-title";
    const a = document.createElement("a");
    a.href = r.url || "#";
    a.target = "_blank";
    a.textContent = r.title || "(no title)";
    title.appendChild(a);
    head.appendChild(title);
    li.appendChild(head);

    const meta = document.createElement("div");
    meta.className = "job-meta";
    meta.textContent = [r.company, r.location, r.deadline].filter(Boolean).join(" • ");
    li.appendChild(meta);

    if (r.reason) {
      const reason = document.createElement("div");
      reason.className = "job-reason";
      reason.textContent = r.reason;
      li.appendChild(reason);
    }

    if (Array.isArray(r.matched_skills) && r.matched_skills.length) {
      const tags = document.createElement("div");
      tags.className = "job-tags";
      tags.append("Match: ");
      for (const s of r.matched_skills.slice(0, 8)) {
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = s;
        tags.appendChild(span);
      }
      li.appendChild(tags);
    }
    if (Array.isArray(r.missing_skills) && r.missing_skills.length) {
      const tags = document.createElement("div");
      tags.className = "job-tags";
      tags.append("Gap: ");
      for (const s of r.missing_skills.slice(0, 6)) {
        const span = document.createElement("span");
        span.className = "tag missing";
        span.textContent = s;
        tags.appendChild(span);
      }
      li.appendChild(tags);
    }

    els.jobList.appendChild(li);
  }

  setProgress(`Showing ${rows.length} of ${lastResults.length} jobs.`);
}

function onExport() {
  const blob = new Blob([JSON.stringify(lastResults, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `jobmatch-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------- MentorMatch ----------------

async function onDraft() {
  setError("");
  setProgress("Reading profile and drafting...");
  els.draftBtn.disabled = true;
  els.outreach.hidden = true;
  els.sentStatus.textContent = "";

  try {
    const tab = await getActiveTab();
    if (!tab?.id) throw new Error("No active tab.");
    const resp = await chrome.runtime.sendMessage({
      type: "draftOutreach",
      tabId: tab.id,
      mentorType: els.mentorType.value,
    });
    if (!resp?.ok) throw new Error(backgroundError(resp));
    lastOutreach = { profile: resp.profile, draft: resp.draft };
    renderOutreach();
    setProgress("");
  } catch (e) {
    setError(e.message || String(e));
    setProgress("");
  } finally {
    els.draftBtn.disabled = false;
  }
}

function renderOutreach() {
  const { profile, draft } = lastOutreach;
  els.fitScore.textContent = draft.fit_score ?? "?";
  els.fitScore.className = `score ${scoreClass(draft.fit_score ?? 0)}`;
  els.fitName.textContent = profile.name || "(no name)";
  els.fitMeta.textContent = [draft.mentor_type, draft.area, profile.headline].filter(Boolean).join(" • ");
  els.fitReason.textContent = draft.fit_reason || "";
  els.whyYou.textContent = draft.why_you ? `Anchor: ${draft.why_you}` : "";
  els.note.value = draft.connection_note || "";
  els.dm.value = draft.message || "";
  els.emailSubject.value = draft.email_subject || "";
  els.email.value = draft.email_body || "";
  els.followup.value = draft.follow_up || "";
  els.markSentBtn.disabled = false;
  updateNoteLen();
  els.outreach.hidden = false;
}

// ---------------- triage of a results page ----------------

const VERDICT_ORDER = { draft: 0, maybe: 1, skip: 2 };

async function onTriage() {
  setError("");
  setProgress("Reading the cards on this page...");
  els.triageBtn.disabled = true;
  els.triage.hidden = true;
  try {
    const tab = await getActiveTab();
    if (!tab?.id) throw new Error("No active tab.");
    const resp = await chrome.runtime.sendMessage({ type: "triagePeople", tabId: tab.id });
    if (!resp?.ok) throw new Error(backgroundError(resp));
    lastTriage = resp.results || [];
    renderTriage();
    setProgress("");
  } catch (e) {
    setError(e.message || String(e));
    setProgress("");
  } finally {
    els.triageBtn.disabled = false;
  }
}

function renderTriage() {
  if (!lastTriage.length) return;
  const counts = { draft: 0, maybe: 0, skip: 0 };
  for (const p of lastTriage) counts[p.verdict] = (counts[p.verdict] || 0) + 1;
  els.triageSummary.textContent =
    `${counts.draft} worth opening · ${counts.maybe} unclear · ${counts.skip} skip`;

  const rows = [...lastTriage]
    .filter((p) => !(els.hideSkip.checked && p.verdict === "skip"))
    .sort((a, b) =>
      (VERDICT_ORDER[a.verdict] ?? 3) - (VERDICT_ORDER[b.verdict] ?? 3) ||
      (b.score ?? 0) - (a.score ?? 0)
    );

  els.peopleList.innerHTML = "";
  for (const p of rows) {
    const li = document.createElement("li");
    li.className = `person v-${p.verdict}`;

    const head = document.createElement("div");
    head.className = "job-head";
    const badge = document.createElement("span");
    badge.className = `verdict v-${p.verdict}`;
    badge.textContent = p.verdict;
    const title = document.createElement("div");
    title.className = "job-title";
    const a = document.createElement("a");
    a.href = p.url || "#";
    a.textContent = p.name || "(no name)";
    // Open in a tab rather than inside the popup, which would close it.
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (p.url) chrome.tabs.create({ url: p.url });
    });
    title.appendChild(a);
    const score = document.createElement("span");
    score.className = `score ${scoreClass(p.score ?? 0)}`;
    score.textContent = p.score ?? "?";
    head.append(badge, title, score);
    li.appendChild(head);

    const meta = document.createElement("div");
    meta.className = "job-meta";
    meta.textContent = [p.headline, p.location, p.degree].filter(Boolean).join(" • ");
    li.appendChild(meta);

    if (p.reason) {
      const reason = document.createElement("div");
      reason.className = "job-reason";
      reason.textContent = p.reason;
      li.appendChild(reason);
    }
    if (p.area) {
      const tags = document.createElement("div");
      tags.className = "job-tags";
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = p.area;
      tags.appendChild(tag);
      if (p.open_to_work) {
        const otw = document.createElement("span");
        otw.className = "tag missing";
        otw.textContent = "open to work";
        tags.appendChild(otw);
      }
      li.appendChild(tags);
    }
    els.peopleList.appendChild(li);
  }
  els.triage.hidden = false;
}

// LinkedIn changes its DOM often enough that "which field came back empty"
// needs to be a one-click answer. No helper call, no model call, no quota.
const DIAG_FIELDS = ["name", "headline", "location", "about", "experience", "education", "raw"];

async function onDiagnose() {
  setError("");
  setProgress("Reading this page...");
  els.diagBtn.disabled = true;
  els.diag.hidden = true;
  try {
    const tab = await getActiveTab();
    if (!tab?.id) throw new Error("No active tab.");
    const resp = await chrome.runtime.sendMessage({ type: "diagnoseProfile", tabId: tab.id });
    if (!resp?.ok) throw new Error(backgroundError(resp));
    lastDiag = diagReport(resp.profile, resp.probe);
    els.diagBody.textContent = lastDiag;
    els.diag.hidden = false;
    setProgress("");
  } catch (e) {
    setError(e.message || String(e));
    setProgress("");
  } finally {
    els.diagBtn.disabled = false;
  }
}

function diagReport(profile, probe) {
  const lines = [`url ${profile.url || "(none)"}`];
  for (const key of DIAG_FIELDS) {
    const v = profile[key];
    const isList = Array.isArray(v);
    const size = isList ? `${v.length} items` : `${(v || "").length} chars`;
    const sample = String((isList ? v[0] : v) || "").replace(/\s+/g, " ");
    const filled = isList ? v.length > 0 : !!String(v || "").trim();
    lines.push(`${filled ? "ok   " : "EMPTY"} ${key.padEnd(10)} ${size.padEnd(9)} ${sample.slice(0, 48)}`);
  }
  if (!probe) return lines.join("\n");

  // Structure, for when a field is still empty and the selectors need redoing.
  lines.push("", "PROBE");
  lines.push(`  title        ${probe.title}`);
  lines.push(`  main         ${probe.hasMain ? "yes" : "NO"}   sections ${probe.sectionsInMain}`);
  lines.push(`  h1           ${probe.h1Count}${probe.h1Texts?.length ? ` -> ${probe.h1Texts.join(" | ")}` : ""}`);
  const a = probe.anchors || {};
  lines.push(`  anchors      about ${a.about ? "y" : "n"}  experience ${a.experience ? "y" : "n"}  education ${a.education ? "y" : "n"}`);
  const o = probe.oldSelectors || {};
  lines.push(`  old classes  headline ${o.headline ? "match" : "GONE"}  location ${o.location ? "match" : "GONE"}`);
  lines.push(`  experience   ${probe.experienceCard}`);
  lines.push(`  education    ${probe.educationCard}`);
  lines.push("  top card text nodes:");
  for (const t of probe.topCardParts || []) lines.push(`    | ${t}`);
  return lines.join("\n");
}

async function onCopyDiag() {
  try {
    await navigator.clipboard.writeText(lastDiag);
    els.diagCopy.textContent = "Copied";
    setTimeout(() => (els.diagCopy.textContent = "Copy report"), 1200);
  } catch (e) {
    setError(`Copy failed: ${e.message}`);
  }
}

function updateNoteLen() {
  const n = els.note.value.length;
  els.noteLen.textContent = `${n}/300`;
  els.noteLen.classList.toggle("over", n > 300);
}

function draftSource(key) {
  if (key === "note") return els.note.value;
  if (key === "dm") return els.dm.value;
  if (key === "email") return `Subject: ${els.emailSubject.value}\n\n${els.email.value}`;
  if (key === "followup") return els.followup.value;
  return "";
}

async function copyDraft(key, btn) {
  try {
    await navigator.clipboard.writeText(draftSource(key));
    const label = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(() => (btn.textContent = label), 1200);
  } catch (e) {
    setError(`Copy failed: ${e.message}`);
  }
}

function onOpenGmail() {
  // Gmail compose URL prefilled with subject + body. Recipient left blank on
  // purpose: LinkedIn rarely shows the email, you fill it in Gmail.
  const u = new URL("https://mail.google.com/mail/");
  u.searchParams.set("view", "cm");
  u.searchParams.set("su", els.emailSubject.value);
  u.searchParams.set("body", els.email.value);
  chrome.tabs.create({ url: u.toString() });
}

async function onMarkSent() {
  if (!lastOutreach) return;
  const { profile, draft } = lastOutreach;
  els.markSentBtn.disabled = true;
  try {
    const r = await fetch(`${await helperBase()}/outreach/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: profile.name,
        url: profile.url,
        company: profile.headline,
        mentor_type: draft.mentor_type,
        area: draft.area,
        channel: els.sentChannel.value,
        notes: draft.why_you,
      }),
    });
    if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
    const data = await r.json();
    els.sentStatus.textContent = `Logged. Follow up on ${data.row.followup_due}.`;
  } catch (e) {
    setError(`Log failed: ${e.message}`);
    els.markSentBtn.disabled = false;
  }
}

async function showDueFollowups() {
  try {
    const r = await fetch(`${await helperBase()}/outreach/due`);
    if (!r.ok) return;
    const { due } = await r.json();
    if (!due?.length) return;
    els.due.hidden = false;
    els.due.textContent =
      `${due.length} follow-up${due.length > 1 ? "s" : ""} due: ` +
      due.slice(0, 4).map((d) => d.name).join(", ") +
      (due.length > 4 ? ", …" : "") +
      " (see helper/outreach.csv)";
  } catch {
    // helper not running; the draft button will surface that.
  }
}

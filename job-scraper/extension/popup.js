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
  // MentorMatch
  scanRow: document.getElementById("scan-row"),
  mentorRow: document.getElementById("mentor-row"),
  mentorType: document.getElementById("mentor-type"),
  draftBtn: document.getElementById("draft-btn"),
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

document.addEventListener("DOMContentLoaded", async () => {
  els.settingsLink.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  els.scanBtn.addEventListener("click", onScan);
  els.sort.addEventListener("change", render);
  els.minScore.addEventListener("input", render);
  els.exportBtn.addEventListener("click", onExport);

  els.draftBtn.addEventListener("click", onDraft);
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
  try {
    const host = new URL(url).hostname;
    if (host.endsWith("careerdays.polito.it")) return "careerdays.polito.it";
    if (host.endsWith("linkedin.com")) return "linkedin.com (stub)";
    return `${host} (generic)`;
  } catch {
    return "—";
  }
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

    if (!resp?.ok) throw new Error(resp?.error || "Unknown error from background.");

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
    if (!resp?.ok) throw new Error(resp?.error || "Unknown error from background.");
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

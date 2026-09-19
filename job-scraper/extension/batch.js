// Batch drafting. Takes the LinkedIn profile tabs you already have open and
// drafts one message per person, one after another, so the model's latency
// stops being your waiting time.
//
// It does not click anything on LinkedIn and it never sends. Every draft still
// has to be read and pasted by hand — that is the whole point of the tool.

const HELPER_DEFAULT = "http://127.0.0.1:5577";
const DAILY_CAP = 8;        // README D: 5-8 messages a day, no more
const GAP_MS = 1500;        // breathing room between helper calls

const els = {
  tabs: document.getElementById("tabs"),
  results: document.getElementById("results"),
  refreshBtn: document.getElementById("refresh-btn"),
  draftBtn: document.getElementById("draft-btn"),
  mentorType: document.getElementById("mentor-type"),
  progress: document.getElementById("progress"),
  quota: document.getElementById("quota"),
  banner: document.getElementById("banner"),
};

let profileTabs = [];
let drafted = 0;

async function helperBase() {
  const { helperUrl = HELPER_DEFAULT } = await chrome.storage.local.get(["helperUrl"]);
  return helperUrl.replace(/\/$/, "");
}

function setBanner(msg, bad) {
  if (!msg) {
    els.banner.hidden = true;
    els.banner.textContent = "";
    return;
  }
  els.banner.hidden = false;
  els.banner.textContent = msg;
  els.banner.className = bad ? "banner bad" : "banner";
}

function scoreClass(score) {
  if (score >= 75) return "s-high";
  if (score >= 50) return "s-mid";
  return "s-low";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------- tab list ----------------

async function listTabs() {
  profileTabs = await chrome.tabs.query({ url: ["*://*.linkedin.com/in/*"] });
  els.tabs.innerHTML = "";
  if (!profileTabs.length) {
    const d = document.createElement("div");
    d.className = "empty";
    d.textContent =
      "No linkedin.com/in/ tabs open. Open the profiles you want in normal tabs " +
      "(middle-click the search results), scroll each once, then hit Refresh tab list.";
    els.tabs.appendChild(d);
    els.draftBtn.disabled = true;
    return;
  }
  els.draftBtn.disabled = false;
  for (const t of profileTabs) {
    const li = document.createElement("li");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;
    cb.dataset.tabId = String(t.id);
    const title = document.createElement("span");
    title.className = "t-title";
    title.textContent = (t.title || "").replace(/ \| LinkedIn$/, "");
    const url = document.createElement("span");
    url.className = "t-url";
    try {
      url.textContent = new URL(t.url).pathname;
    } catch {
      url.textContent = "";
    }
    li.append(cb, title, url);
    els.tabs.appendChild(li);
  }
  updateWarning();
  for (const cb of els.tabs.querySelectorAll("input[type=checkbox]")) {
    cb.addEventListener("change", updateWarning);
  }
}

function selectedTabIds() {
  return [...els.tabs.querySelectorAll("input[type=checkbox]:checked")].map((cb) =>
    Number(cb.dataset.tabId)
  );
}

function updateWarning() {
  const n = selectedTabIds().length;
  if (n > DAILY_CAP) {
    setBanner(
      `${n} profiles selected. README D says 5-8 messages a day — LinkedIn flags bulk notes ` +
        `to strangers, and quality beats volume anyway. Drafting more than that is fine; ` +
        `sending them all today is not.`
    );
  } else {
    setBanner("");
  }
}

// ---------------- drafting ----------------

async function draftSelected() {
  const ids = selectedTabIds();
  if (!ids.length) return;
  els.draftBtn.disabled = true;
  els.refreshBtn.disabled = true;
  if (drafted === 0) els.results.innerHTML = "";

  let done = 0;
  for (const tabId of ids) {
    const tab = profileTabs.find((t) => t.id === tabId);
    const label = (tab?.title || "").replace(/ \| LinkedIn$/, "") || `tab ${tabId}`;
    els.progress.textContent = `Drafting ${done + 1} of ${ids.length}: ${label}...`;
    try {
      const resp = await chrome.runtime.sendMessage({
        type: "draftOutreach",
        tabId,
        mentorType: els.mentorType.value,
      });
      if (!resp?.ok) {
        throw new Error(
          resp?.error ||
            "The background service worker did not answer. It is probably still running " +
              "the previous version: toggle JobMatch off and on in the extensions page, " +
              "then refresh these tabs."
        );
      }
      addCard(resp.profile, resp.draft);
      drafted += 1;
    } catch (e) {
      const msg = e.message || String(e);
      addFailedCard(label, tab?.url || "", msg);
      // The free Gemini tier is the usual wall. Stopping beats burning the rest
      // of the list on errors.
      if (/429|quota|RESOURCE_EXHAUSTED/i.test(msg)) {
        setBanner(
          "Gemini quota is exhausted, so the run stopped here. The free tier's daily cap on " +
            "gemini-2.5-flash resets at midnight Pacific. The profiles already drafted above " +
            "are still usable.",
          true
        );
        break;
      }
    }
    done += 1;
    if (done < ids.length) await sleep(GAP_MS);
  }

  els.progress.textContent = `Done. ${drafted} draft${drafted === 1 ? "" : "s"} ready to read.`;
  els.draftBtn.disabled = false;
  els.refreshBtn.disabled = false;
  loadQuota();
}

function field(labelText, value, rows, extraBtn) {
  const wrap = document.createElement("div");
  wrap.className = "draft";
  const head = document.createElement("div");
  head.className = "draft-head";
  const left = document.createElement("span");
  left.textContent = labelText;
  const right = document.createElement("span");
  const ta = document.createElement("textarea");
  ta.rows = rows;
  ta.value = value || "";

  const copy = document.createElement("button");
  copy.className = "secondary";
  copy.textContent = "Copy";
  copy.addEventListener("click", async () => {
    await navigator.clipboard.writeText(ta.value);
    copy.textContent = "Copied";
    setTimeout(() => (copy.textContent = "Copy"), 1200);
  });
  if (extraBtn) right.appendChild(extraBtn);
  right.appendChild(copy);
  head.append(left, right);
  wrap.append(head, ta);
  return { wrap, ta, head, left };
}

function addCard(profile, draft) {
  const card = document.createElement("div");
  card.className = "card";

  const head = document.createElement("div");
  head.className = "fit-head";
  const score = document.createElement("span");
  score.className = `score ${scoreClass(draft.fit_score ?? 0)}`;
  score.textContent = draft.fit_score ?? "?";
  const name = document.createElement("div");
  name.className = "name";
  const a = document.createElement("a");
  a.href = profile.url || "#";
  a.target = "_blank";
  a.textContent = profile.name || "(no name)";
  name.appendChild(a);
  const meta = document.createElement("span");
  meta.className = "meta";
  meta.textContent = [draft.mentor_type, draft.area].filter(Boolean).join(" • ");
  head.append(score, name, meta);
  card.appendChild(head);

  const headline = document.createElement("div");
  headline.className = "meta";
  headline.textContent = profile.headline || "";
  card.appendChild(headline);

  const reason = document.createElement("div");
  reason.className = "reason";
  reason.textContent = draft.fit_reason || "";
  card.appendChild(reason);

  if (draft.why_you) {
    const anchor = document.createElement("div");
    anchor.className = "anchor";
    anchor.textContent = `Anchor: ${draft.why_you}`;
    card.appendChild(anchor);
  }

  const note = field("Connection note", draft.connection_note, 3);
  const len = document.createElement("em");
  const updateLen = () => {
    len.textContent = `${note.ta.value.length}/300`;
    len.classList.toggle("over", note.ta.value.length > 300);
  };
  note.left.appendChild(len);
  note.ta.addEventListener("input", updateLen);
  updateLen();
  card.appendChild(note.wrap);

  const dm = field("LinkedIn message", draft.message, 7);
  card.appendChild(dm.wrap);

  const subject = document.createElement("input");
  subject.type = "text";
  subject.value = draft.email_subject || "";
  const gmail = document.createElement("button");
  gmail.className = "secondary";
  gmail.textContent = "Open in Gmail";
  const email = field("Email", draft.email_body, 8, gmail);
  gmail.addEventListener("click", () => {
    const u = new URL("https://mail.google.com/mail/");
    u.searchParams.set("view", "cm");
    u.searchParams.set("su", subject.value);
    u.searchParams.set("body", email.ta.value);
    chrome.tabs.create({ url: u.toString() });
  });
  email.wrap.insertBefore(subject, email.ta);
  card.appendChild(email.wrap);

  const followup = field("Follow-up (5 weeks, no reply)", draft.follow_up, 3);
  card.appendChild(followup.wrap);

  // Mark as sent - writes the row the follow-up list reads later.
  const controls = document.createElement("div");
  controls.className = "controls";
  const chLabel = document.createElement("label");
  chLabel.textContent = "Sent via: ";
  const channel = document.createElement("select");
  for (const [v, t] of [
    ["linkedin-note", "connection note"],
    ["linkedin-dm", "LinkedIn DM"],
    ["email", "email"],
  ]) {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = t;
    channel.appendChild(o);
  }
  chLabel.appendChild(channel);
  const markBtn = document.createElement("button");
  markBtn.textContent = "Mark as sent";
  const status = document.createElement("span");
  status.className = "sent-status";
  markBtn.addEventListener("click", async () => {
    markBtn.disabled = true;
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
          channel: channel.value,
          notes: draft.why_you,
        }),
      });
      if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
      const data = await r.json();
      status.textContent = `Logged. Follow up on ${data.row.followup_due}.`;
      loadQuota();
    } catch (e) {
      status.className = "err";
      status.textContent = `Log failed: ${e.message}`;
      markBtn.disabled = false;
    }
  });
  controls.append(chLabel, markBtn, status);
  card.appendChild(controls);

  els.results.appendChild(card);
}

function addFailedCard(label, url, msg) {
  const card = document.createElement("div");
  card.className = "card failed";
  const head = document.createElement("div");
  head.className = "fit-head";
  const name = document.createElement("div");
  name.className = "name";
  name.textContent = label;
  head.appendChild(name);
  card.appendChild(head);
  const err = document.createElement("div");
  err.className = "err";
  err.textContent = msg;
  card.appendChild(err);
  if (url) {
    const hint = document.createElement("div");
    hint.className = "meta";
    hint.textContent = "Open that tab, scroll once so Experience loads, then run it again.";
    card.appendChild(hint);
  }
  els.results.appendChild(card);
}

// ---------------- daily counter ----------------

async function loadQuota() {
  try {
    const r = await fetch(`${await helperBase()}/outreach/coverage`);
    if (!r.ok) throw new Error(String(r.status));
    const c = await r.json();
    const n = c.sent_today ?? 0;
    els.quota.textContent = `sent today: ${n} / ${DAILY_CAP}`;
    els.quota.className = `quota ${n >= DAILY_CAP ? "over" : n >= DAILY_CAP - 2 ? "near" : "ok"}`;
  } catch {
    els.quota.className = "quota";
    els.quota.textContent = "helper not running";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  els.refreshBtn.addEventListener("click", listTabs);
  els.draftBtn.addEventListener("click", draftSelected);
  await listTabs();
  loadQuota();
});

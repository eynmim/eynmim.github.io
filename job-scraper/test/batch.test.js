// Runs extension/batch.html + batch.js in jsdom. chrome.tabs and the helper are
// stubbed, so no browser, no LinkedIn, no Gemini, no tracker writes.

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const EXT = path.join(__dirname, "..", "extension");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ok   " + m); } else { fail++; console.log("  FAIL " + m); } };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const draftFor = (n) => ({
  fit_score: 80, mentor_type: "career", area: "firmware-platform",
  fit_reason: `reason ${n}`, why_you: `anchor ${n}`,
  connection_note: `note ${n}`, message: `dm ${n}`,
  email_subject: `subject ${n}`, email_body: `body ${n}`,
  follow_up: `follow ${n} [one concrete thing you did since - fill in]`,
});

async function openPage(tabs, sendMessage, logged) {
  const dom = new JSDOM(fs.readFileSync(path.join(EXT, "batch.html"), "utf8"), { runScripts: "outside-only" });
  const { window } = dom;
  const opened = [];
  window.chrome = {
    storage: { local: { get: async () => ({ helperUrl: "http://127.0.0.1:5577" }) } },
    tabs: { query: async () => tabs, create: (o) => opened.push(o.url) },
    runtime: { sendMessage },
  };
  window.fetch = async (url, opts) => {
    if (String(url).endsWith("/outreach/coverage"))
      return { ok: true, json: async () => ({ by_area: {}, target: 2, total: 0, sent_today: 1 }) };
    if (String(url).endsWith("/outreach/log")) {
      logged.push(JSON.parse(opts.body));
      return { ok: true, json: async () => ({ ok: true, row: { followup_due: "2026-10-23" } }) };
    }
    throw new Error(`unexpected fetch: ${url}`);
  };
  Object.defineProperty(window.navigator, "clipboard", { value: { writeText: async () => {} }, configurable: true });
  window.eval(fs.readFileSync(path.join(EXT, "batch.js"), "utf8"));
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  await wait(20);
  return { window, doc: window.document, opened };
}

(async () => {
  console.log("batch page — three tabs, the third hits the daily Gemini cap");
  const tabs = [1, 2, 3].map((i) => ({
    id: i, title: `Person ${i} | LinkedIn`, url: `https://www.linkedin.com/in/person-${i}/`,
  }));
  const calls = [];
  const logged = [];
  const { window, doc } = await openPage(tabs, async (msg) => {
    calls.push(msg.tabId);
    if (msg.tabId === 3) return { ok: false, error: "Helper error 502: Outreach draft failed: 429 RESOURCE_EXHAUSTED" };
    return {
      ok: true,
      profile: { name: `Person ${msg.tabId}`, headline: "Firmware Engineer", url: tabs[msg.tabId - 1].url },
      draft: draftFor(msg.tabId),
    };
  }, logged);

  ok(doc.querySelectorAll("#tabs li").length === 3, "lists the open profile tabs");
  ok([...doc.querySelectorAll("#tabs input")].every((c) => c.checked), "all ticked by default");
  ok(doc.querySelector("#tabs .t-title").textContent === "Person 1", "drops the ' | LinkedIn' suffix");
  ok(doc.getElementById("quota").textContent.includes("1 / 8"), "daily counter loads on open");

  doc.getElementById("draft-btn").dispatchEvent(new window.Event("click"));
  await wait(4000);

  ok(calls.join(",") === "1,2,3", `drafts each selected tab in order (${calls.join(",")})`);
  const cards = doc.querySelectorAll("#results .card");
  ok(cards.length === 3, `one card per tab (${cards.length})`);
  ok(doc.querySelectorAll("#results .card.failed").length === 1, "the 429 is shown, not swallowed");
  ok(doc.getElementById("banner").hidden === false, "a banner explains why the run stopped");
  ok(/quota/i.test(doc.getElementById("banner").textContent), "  and names the quota");
  ok(doc.getElementById("progress").textContent.includes("2 drafts"), "progress counts the usable drafts");

  const first = cards[0];
  ok(first.querySelector(".score").textContent === "80", "fit score comes first on the card");
  ok(first.querySelectorAll("textarea").length === 4, "note, DM, email and follow-up all present");
  ok(first.querySelector('input[type="text"]').value === "subject 1", "email subject carried over");
  ok(first.querySelector(".draft-head em").textContent === "6/300", "note length shown against the 300 limit");
  ok(/fill in/.test([...first.querySelectorAll("textarea")][3].value), "follow-up keeps the fill-in placeholder");

  // The rule the whole tool is built around: drafting is not sending, and not logging.
  ok(logged.length === 0, "drafting alone writes nothing to the tracker");

  first.querySelector(".controls button").dispatchEvent(new window.Event("click"));
  await wait(50);
  ok(logged.length === 1, "Mark as sent logs one row");
  ok(logged[0].name === "Person 1" && logged[0].area === "firmware-platform" && logged[0].mentor_type === "career",
     "  with the snake_case keys the helper reads");
  ok(first.querySelector(".sent-status").textContent.includes("2026-10-23"), "  and echoes the follow-up date");

  console.log("\nbatch page — nine tabs selected");
  const many = Array.from({ length: 9 }, (_, i) => ({
    id: i + 1, title: `P${i} | LinkedIn`, url: `https://www.linkedin.com/in/p${i}/`,
  }));
  const b = await openPage(many, async () => ({ ok: false, error: "not called" }), []);
  ok(b.doc.getElementById("banner").hidden === false, "selecting nine warns about the daily cap");
  ok(/5-8 messages a day/.test(b.doc.getElementById("banner").textContent), "  quoting README D");
  const cb = b.doc.querySelector("#tabs input");
  cb.checked = false;
  cb.dispatchEvent(new b.window.Event("change"));
  ok(b.doc.getElementById("banner").hidden === true, "back down to eight clears it");

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();

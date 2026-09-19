// Runs extension/popup.html + popup.css + popup.js in jsdom.
//
// The regression this exists for: `#mentor-row { display: flex }` outranked the
// UA stylesheet's [hidden], so "Draft message" showed on every LinkedIn page,
// including the feed, where reading a profile cannot work.

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const EXT = path.join(__dirname, "..", "extension");

// Deliberately out of order, and the best one last, so the sort is doing work.
const TRIAGE_RESULTS = [
  { name: "Recruiter Person", headline: "Embedded Software Recruitment", location: "Bracknell",
    url: "https://www.linkedin.com/in/rec", verdict: "skip", score: 10, area: "other",
    reason: "recruiter, not an engineer", open_to_work: false, degree: "1st" },
  { name: "Vague Person", headline: "Engineer at Acme", location: "Turin",
    url: "https://www.linkedin.com/in/vague", verdict: "maybe", score: 45, area: "other",
    reason: "headline does not say which area", open_to_work: false, degree: "2nd" },
  { name: "Graduate Person", headline: "Embedded Systems Engineer", location: "Milan",
    url: "https://www.linkedin.com/in/grad", verdict: "skip", score: 15, area: "firmware-platform",
    reason: "open to work and one year out of university", open_to_work: true, degree: "2nd" },
  { name: "Staff Person", headline: "Staff Firmware Engineer at ST", location: "Turin",
    url: "https://www.linkedin.com/in/staff", verdict: "draft", score: 88, area: "firmware-platform",
    reason: "staff firmware in Turin, five to eight years ahead", open_to_work: false, degree: "2nd" },
];
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ok   " + m); } else { fail++; console.log("  FAIL " + m); } };
const tick = () => new Promise((r) => setTimeout(r, 0));

async function openPopup(tabUrl, sendOverride) {
  const dom = new JSDOM(fs.readFileSync(path.join(EXT, "popup.html"), "utf8"), { runScripts: "outside-only" });
  const { window } = dom;
  // Let jsdom's own DOMContentLoaded pass before the script is evaluated, so
  // its listeners are registered once rather than twice.
  await tick();
  const style = window.document.createElement("style");
  style.textContent = fs.readFileSync(path.join(EXT, "popup.css"), "utf8");
  window.document.head.appendChild(style);
  const opened = [];
  const copied = [];
  // A profile shaped like the real failure: LinkedIn stopped giving up the
  // name, everything else still came through, raw carried the page.
  const BLANK_NAME_PROFILE = {
    url: "https://www.linkedin.com/in/someone/",
    name: "",
    headline: "CTO at Example",
    location: "Paris, France",
    about: "The AI community building the future.",
    experience: ["Co-founder, Example, Jul 2016 - Present"],
    education: [],
    raw: "x".repeat(5000),
  };
  window.chrome = {
    storage: { local: { get: async () => ({ helperUrl: "http://127.0.0.1:5577" }) } },
    tabs: { query: async () => [{ id: 1, url: tabUrl }], create: (o) => opened.push(o.url) },
    runtime: {
      sendMessage: async (msg) => {
        if (sendOverride) return sendOverride(msg);
        if (msg?.type === "diagnoseProfile") return { ok: true, profile: BLANK_NAME_PROFILE };
        if (msg?.type === "triagePeople") return { ok: true, results: TRIAGE_RESULTS };
        return { ok: false, error: "not called" };
      },
      openOptionsPage: () => opened.push("options"),
      getURL: (p) => `chrome-extension://testid/${p}`,
    },
  };
  window.fetch = async () => ({ ok: true, json: async () => ({ due: [] }) });
  Object.defineProperty(window.navigator, "clipboard", {
    value: { writeText: async (t) => copied.push(t) }, configurable: true,
  });
  window.eval(fs.readFileSync(path.join(EXT, "popup.js"), "utf8"));
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  await tick(); await tick();
  const shown = (id) => window.getComputedStyle(window.document.getElementById(id)).display !== "none";
  return { window, doc: window.document, shown, opened, copied };
}

(async () => {
  console.log("popup — every element the code toggles must actually hide");
  const feed = await openPopup("https://www.linkedin.com/feed/");
  for (const el of feed.doc.querySelectorAll("[hidden]")) {
    ok(feed.window.getComputedStyle(el).display === "none",
       `#${el.id || el.className} with [hidden] computes to display:none`);
  }

  console.log("\npopup on the LinkedIn feed (not a profile)");
  ok(feed.shown("scan-row"), "Scan this page is offered");
  ok(!feed.shown("mentor-row"), "Draft message is NOT offered — reading a profile cannot work here");
  ok(feed.doc.getElementById("adapter").textContent.includes("stub"), "the site label says linkedin.com (stub)");

  console.log("\npopup on a profile page");
  const prof = await openPopup("https://www.linkedin.com/in/someone/");
  ok(!prof.shown("scan-row"), "Scan this page is withdrawn");
  ok(prof.shown("mentor-row"), "Draft message is offered");
  ok(prof.doc.getElementById("adapter").textContent.includes("MentorMatch"), "the site label switches to MentorMatch");

  console.log("\nCheck DOM — says which field the adapter failed to read, with no model call");
  ok(prof.shown("diag-btn"), "the button is offered on a profile page");
  ok(!prof.shown("diag"), "no report until it is asked for");
  prof.doc.getElementById("diag-btn").dispatchEvent(new prof.window.Event("click"));
  await tick(); await tick();
  ok(prof.shown("diag"), "the report appears");
  const report = prof.doc.getElementById("diag-body").textContent;
  ok(/EMPTY name/.test(report), "a blank name is called out as EMPTY");
  ok(/ok +headline/.test(report), "a field that did come through reads ok");
  ok(/ok +raw +5000 chars/.test(report), "raw shows its size, so the fallback is visible");
  ok(/EMPTY education/.test(report), "an empty list counts as empty too");
  ok(report.includes("linkedin.com/in/someone"), "the report names the page it read");
  prof.doc.getElementById("diag-copy").dispatchEvent(new prof.window.Event("click"));
  await tick();
  ok(prof.copied.length === 1 && prof.copied[0] === report, "Copy report puts the whole thing on the clipboard");

  // A reload that updated the popup but left the old service worker running
  // makes sendMessage resolve to undefined. That must read as an instruction,
  // not as "unknown error".
  console.log("\nstale service worker");
  const stale = await openPopup("https://www.linkedin.com/in/someone/", async () => undefined);
  stale.doc.getElementById("diag-btn").dispatchEvent(new stale.window.Event("click"));
  await tick(); await tick();
  const errText = stale.doc.getElementById("error").textContent;
  ok(stale.shown("error"), "the error is shown");
  ok(/service worker/.test(errText), "it names the service worker as the cause");
  ok(/toggle JobMatch off and on/.test(errText), "and says exactly what to do");
  ok(!/Unknown error/.test(errText), "no 'unknown error' left anywhere");

  console.log("\npopup on a people-search results page");
  const search = await openPopup("https://www.linkedin.com/search/results/people/?keywords=STM32");
  ok(!search.shown("scan-row"), "Scan this page is withdrawn");
  ok(!search.shown("mentor-row"), "Draft message is not offered — there is no profile here");
  ok(search.shown("people-row"), "Rank these results is offered instead");
  ok(search.doc.getElementById("adapter").textContent.includes("people search"), "the site label says so");
  ok(!search.shown("triage"), "no list until it is asked for");

  search.doc.getElementById("triage-btn").dispatchEvent(new search.window.Event("click"));
  await tick(); await tick();
  ok(search.shown("triage"), "the ranked list appears");
  ok(/1 worth opening/.test(search.doc.getElementById("triage-summary").textContent),
     `the summary counts the verdicts (${search.doc.getElementById("triage-summary").textContent})`);

  const names = () => [...search.doc.querySelectorAll("#people-list li .job-title")].map((e) => e.textContent);
  ok(names()[0] === "Staff Person", `the one worth opening is first (${names()[0]})`);
  ok(names().length === 2, `the two skips are hidden by default (${names().length} shown)`);
  ok(!names().includes("Graduate Person"), "  including the open-to-work graduate");

  const first = search.doc.querySelector("#people-list li");
  ok(first.querySelector(".verdict").textContent === "draft", "each row carries its verdict");
  ok(first.querySelector(".score").textContent === "88", "and its score");
  ok(/five to eight years ahead/.test(first.textContent), "and the reason, so the call is checkable");

  search.doc.getElementById("hide-skip").checked = false;
  search.doc.getElementById("hide-skip").dispatchEvent(new search.window.Event("change"));
  ok(names().length === 4, "unticking shows the skips too");
  ok(names()[names().length - 1] !== "Staff Person", "  and they sort below");
  const gradRow = [...search.doc.querySelectorAll("#people-list li")]
    .find((li) => li.textContent.includes("Graduate Person"));
  ok(/open to work/.test(gradRow.textContent), "the open-to-work badge is shown on the row");

  console.log("\npopup header");
  const links = [...prof.doc.querySelectorAll("header nav a")].map((a) => a.textContent);
  ok(links.join(",") === "Search,Batch,Settings", `three links in the header (${links.join(", ")})`);
  prof.doc.getElementById("search-link").dispatchEvent(new prof.window.Event("click"));
  prof.doc.getElementById("batch-link").dispatchEvent(new prof.window.Event("click"));
  ok(prof.opened.some((u) => u.endsWith("search.html")), "Search opens search.html");
  ok(prof.opened.some((u) => u.endsWith("batch.html")), "Batch opens batch.html");

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();

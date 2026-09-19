// Runs extension/popup.html + popup.css + popup.js in jsdom.
//
// The regression this exists for: `#mentor-row { display: flex }` outranked the
// UA stylesheet's [hidden], so "Draft message" showed on every LinkedIn page,
// including the feed, where reading a profile cannot work.

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const EXT = path.join(__dirname, "..", "extension");
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
      sendMessage: async (msg) =>
        sendOverride
          ? sendOverride(msg)
          : msg?.type === "diagnoseProfile"
            ? { ok: true, profile: BLANK_NAME_PROFILE }
            : { ok: false, error: "not called" },
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

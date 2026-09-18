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

async function openPopup(tabUrl) {
  const dom = new JSDOM(fs.readFileSync(path.join(EXT, "popup.html"), "utf8"), { runScripts: "outside-only" });
  const { window } = dom;
  const style = window.document.createElement("style");
  style.textContent = fs.readFileSync(path.join(EXT, "popup.css"), "utf8");
  window.document.head.appendChild(style);
  const opened = [];
  window.chrome = {
    storage: { local: { get: async () => ({ helperUrl: "http://127.0.0.1:5577" }) } },
    tabs: { query: async () => [{ id: 1, url: tabUrl }], create: (o) => opened.push(o.url) },
    runtime: {
      sendMessage: async () => ({ ok: false, error: "not called" }),
      openOptionsPage: () => opened.push("options"),
      getURL: (p) => `chrome-extension://testid/${p}`,
    },
  };
  window.fetch = async () => ({ ok: true, json: async () => ({ due: [] }) });
  window.eval(fs.readFileSync(path.join(EXT, "popup.js"), "utf8"));
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  await tick(); await tick();
  const shown = (id) => window.getComputedStyle(window.document.getElementById(id)).display !== "none";
  return { window, doc: window.document, shown, opened };
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

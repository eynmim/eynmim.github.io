// Runs extension/search.html + search.js in jsdom against a stubbed chrome.* and
// fetch. No network, no browser, no LinkedIn.

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const EXT = path.join(__dirname, "..", "extension");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ok   " + m); } else { fail++; console.log("  FAIL " + m); } };
const tick = () => new Promise((r) => setTimeout(r, 0));

// Mirrors AREAS in helper/server.py. If these drift apart the coverage badges
// silently stop matching the tracker, so assert on it.
const SERVER_AREAS = [
  "firmware-platform", "embedded-security", "low-power-wireless", "embedded-linux",
  "hardware-pcb-power", "silicon-soc-fpga", "automotive-safety", "edge-ai-dsp",
  "robotics-control", "other",
];

(async () => {
  const dom = new JSDOM(fs.readFileSync(path.join(EXT, "search.html"), "utf8"), { runScripts: "outside-only" });
  const { window } = dom;
  // jsdom fires its own DOMContentLoaded just after construction. Let that pass
  // before the script is evaluated, so the listeners below are registered once
  // and a single click toggles once.
  await tick();
  const opened = [];
  const copied = [];

  const stored = {
    helperUrl: "http://127.0.0.1:5577",
    savedGeos: [{ label: "Italy", id: "103350119" }],
    savedSchools: [{ label: "PoliTo", id: "15122" }],
    lastGeo: "103350119",
    lastSchool: "15122",
    lastNetwork: "S",
  };
  window.chrome = {
    storage: {
      local: {
        get: async () => stored,
        set: async (o) => Object.assign(stored, o),
      },
    },
    tabs: { create: (o) => opened.push(o.url) },
  };
  // Two contacted in firmware-platform (target met), one in embedded-linux,
  // every other area absent from the response on purpose.
  window.fetch = async () => ({
    ok: true,
    json: async () => ({
      by_area: {
        "firmware-platform": { contacted: 2, replied: 1 },
        "embedded-linux": { contacted: 1, replied: 0 },
      },
      target: 2, total: 3, sent_today: 3,
    }),
  });
  Object.defineProperty(window.navigator, "clipboard", {
    value: { writeText: async (t) => copied.push(t) }, configurable: true,
  });

  window.eval(fs.readFileSync(path.join(EXT, "search.js"), "utf8"));
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  await tick(); await tick();

  const doc = window.document;
  const cards = () => [...doc.querySelectorAll(".area")];
  const card = (id) => cards().find((c) => c.querySelector(".tag").textContent === id);

  console.log("search page");
  ok(cards().length === SERVER_AREAS.length, `renders every area (${cards().length})`);
  const tags = cards().map((c) => c.querySelector(".tag").textContent);
  ok(SERVER_AREAS.every((a) => tags.includes(a)), "area tags match the helper's AREAS tuple");

  ok(card("firmware-platform").querySelector(".cov").textContent === "2/2", "target met shows 2/2");
  ok(card("firmware-platform").querySelector(".cov").className.includes("done"), "  marked done");
  ok(card("embedded-linux").querySelector(".cov").textContent === "1/2", "partial shows 1/2");
  ok(card("embedded-linux").querySelector(".cov").className.includes("part"), "  marked partial");
  // An area missing from the response means nobody contacted yet, NOT a dead helper.
  ok(card("silicon-soc-fpga").querySelector(".cov").textContent === "0/2", "area absent from the response reads 0/2");

  const quota = doc.getElementById("quota");
  ok(quota.textContent.includes("3 / 8"), `daily counter shows today's sends (${quota.textContent})`);
  ok(quota.className.includes("ok"), "  3 of 8 still green");

  card("firmware-platform").querySelectorAll("button")[0].dispatchEvent(new window.Event("click"));
  ok(opened.length === 1, "a search button opens one tab");
  const u = new window.URL(opened[0]);
  ok(u.hostname === "www.linkedin.com" && u.pathname === "/search/results/people/", "  LinkedIn people search");
  ok(u.searchParams.get("keywords").includes('"firmware engineer"'), "  carries the TITLES.md string");
  ok(!u.searchParams.get("keywords").includes("Politecnico"), "  the school is not a keyword");

  const toggle = (id, on) => {
    doc.getElementById(id).checked = on;
    doc.getElementById(id).dispatchEvent(new window.Event("change"));
  };

  // The school is a LinkedIn filter, never a keyword: as a keyword it ANDs
  // with the Boolean string and can empty an otherwise good search.
  ok(!new window.URL(opened[0]).searchParams.get("keywords").includes("Politecnico"),
     "the school never enters the keywords");
  ok(new window.URL(opened[0]).searchParams.get("schoolFilter") === '["15122"]',
     "it rides along as LinkedIn's own schoolFilter instead");

  const warnCount = () => [...doc.querySelectorAll(".area button")].filter((b) => b.textContent.includes("terms")).length;
  ok(warnCount() === 0, "curated strings alone stay under the ~15 term limit");
  toggle("senior", true);
  await tick();
  ok(warnCount() > 0, `the seniority toggle pushes the long strings over and warns (${warnCount()} buttons)`);
  toggle("senior", false);
  await tick();

  console.log("\nadding a location");
  const geoAdd = doc.getElementById("geo-add");
  ok(geoAdd.hidden === true, "the panel starts closed");
  doc.getElementById("geo-add-toggle").dispatchEvent(new window.Event("click"));
  ok(geoAdd.hidden === false, "Add a location opens it");
  doc.getElementById("geo-add-toggle").dispatchEvent(new window.Event("click"));
  ok(geoAdd.hidden === true, "  and closes it again");
  doc.getElementById("geo-add-toggle").dispatchEvent(new window.Event("click"));

  // Pressing Save with nothing pasted is the likely first attempt.
  doc.getElementById("geo-label").value = "Turin";
  doc.getElementById("geo-save").dispatchEvent(new window.Event("click"));
  await tick();
  const status = doc.getElementById("geo-status");
  ok(status.className === "bad", "saving with an empty URL is reported as a failure");
  ok(/Set one on LinkedIn first/.test(status.textContent),
     `  and says what was missing (${status.textContent.slice(0, 44)}...)`);

  doc.getElementById("geo-url").value =
    'https://www.linkedin.com/search/results/people/?keywords=x&geoUrn=%5B%22103644278%22%5D';
  doc.getElementById("geo-label").value = "Turin";
  doc.getElementById("geo-save").dispatchEvent(new window.Event("click"));
  await tick(); await tick();
  ok(status.className !== "bad", "a real URL saves");
  ok([...doc.getElementById("geo").options].some((o) => o.textContent === "Turin"),
     "  the new location appears in the dropdown");
  ok(doc.getElementById("geo").value === "103644278", "  and is selected straight away");
  ok(doc.getElementById("geo-url").value === "", "  the input is cleared for the next one");

  console.log("\nlocation and connection degree ride along on every search");
  doc.getElementById("geo").value = "103350119";
  ok(doc.getElementById("geo").value === "103350119", "the saved location is preselected");
  ok(doc.getElementById("network").value === "S", "the last connection filter is restored");
  ok(doc.getElementById("school").value === "15122", "so is the last school");
  card("firmware-platform").querySelectorAll("button")[0].dispatchEvent(new window.Event("click"));
  const filtered = new window.URL(opened[opened.length - 1]);
  ok(filtered.searchParams.get("geoUrn") === '["103350119"]', "geoUrn is applied, so no manual filter step");
  ok(filtered.searchParams.get("network") === '["S"]', "network is applied");

  // Ids are copied out of a URL the user already filtered — never guessed.
  const parse = window.eval("filterFromUrl");
  const geoHit = parse('https://www.linkedin.com/search/results/people/?keywords=x&geoUrn=%5B%22103644278%22%5D');
  ok(geoHit.kind === "location" && geoHit.id === "103644278", "a pasted URL yields its geoUrn as a location");
  const schoolHit = parse('https://www.linkedin.com/search/results/people/?keywords=x&schoolFilter=%5B%2215122%22%5D');
  ok(schoolHit.kind === "school" && schoolHit.id === "15122", "and a schoolFilter as a school");
  ok(parse("https://www.linkedin.com/search/results/people/?keywords=x") === null,
     "a URL with neither filter is rejected");
  ok(parse("https://example.com/?geoUrn=%5B%221%22%5D") === null, "a non-LinkedIn URL is rejected");
  ok(parse("not a url") === null, "junk is rejected");

  const postsBtn = [...doc.querySelectorAll("#graph button")].find((b) => b.textContent.includes("post"));
  postsBtn.dispatchEvent(new window.Event("click"));
  const postsUrl = new window.URL(opened[opened.length - 1]);
  ok(postsUrl.pathname === "/search/results/content/", "the posts row searches posts, not people");
  ok(!postsUrl.searchParams.get("geoUrn"), "  and does not carry a people-only location filter");

  card("firmware-platform").querySelector("button.secondary").dispatchEvent(new window.Event("click"));
  await tick();
  ok(copied.length === 1 && copied[0].includes("firmware engineer"), "Copy query reaches the clipboard");

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();

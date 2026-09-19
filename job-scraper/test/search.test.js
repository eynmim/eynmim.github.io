// Runs extension/search.html + search.js in jsdom against a stubbed chrome.*
// and fetch. No network, no browser, no LinkedIn.

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

// Measured on the live site: 5 terms return results, 7 return nothing at all.
const MAX_TERMS = 6;

(async () => {
  const dom = new JSDOM(fs.readFileSync(path.join(EXT, "search.html"), "utf8"), { runScripts: "outside-only" });
  const { window } = dom;
  // jsdom fires its own DOMContentLoaded just after construction. Let that pass
  // before the script is evaluated, so the listeners below are registered once.
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
    storage: { local: { get: async () => stored, set: async (o) => Object.assign(stored, o) } },
    tabs: { create: (o) => opened.push(o.url) },
  };
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
  const termButtons = (root) =>
    [...root.querySelectorAll(".btns button")].filter((b) => !b.classList.contains("secondary"));

  console.log("areas");
  ok(cards().length === SERVER_AREAS.length, `renders every area (${cards().length})`);
  const tags = cards().map((c) => c.querySelector(".tag").textContent);
  ok(SERVER_AREAS.every((a) => tags.includes(a)), "area tags match the helper's AREAS tuple");
  ok(card("firmware-platform").querySelector(".cov").textContent === "2/2", "target met shows 2/2");
  ok(card("firmware-platform").querySelector(".cov").className.includes("done"), "  marked done");
  ok(card("embedded-linux").querySelector(".cov").textContent === "1/2", "partial shows 1/2");
  ok(card("silicon-soc-fpga").querySelector(".cov").textContent === "0/2", "area absent from the response reads 0/2");

  const quota = doc.getElementById("quota");
  ok(quota.textContent.includes("3 / 8"), `daily counter shows today's sends (${quota.textContent})`);

  console.log("\nterm groups — the whole point of the rewrite");
  const parse = (q) => q.replace(/^\(|\)$/g, "").split(" OR ");
  const allGroups = [];
  for (const c of cards()) {
    for (const b of termButtons(c)) allGroups.push(parse(b.title));
  }
  ok(allGroups.length > 0, `every area splits into buttons (${allGroups.length} in total)`);
  ok(allGroups.every((g) => g.length <= MAX_TERMS),
     `no group exceeds ${MAX_TERMS} terms (largest is ${Math.max(...allGroups.map((g) => g.length))})`);
  ok(!termButtons(doc).some((b) => b.classList.contains("over")), "nothing is flagged as over the limit");

  // The firmware tools list is 10 terms, so it must become three buttons.
  const fwButtons = termButtons(card("firmware-platform"));
  ok(fwButtons.length >= 5, `firmware area offers several groups (${fwButtons.length})`);
  const fwTitles = fwButtons.map((b) => b.title).join(" ");
  ok(/STM32/.test(fwTitles) && /Zephyr/.test(fwTitles) && /Bluetooth Low Energy/.test(fwTitles),
     "  and between them still cover the whole TITLES.md list");

  console.log("\nquoting");
  const withSpaces = allGroups.flat().filter((t) => /^".*"$/.test(t));
  ok(withSpaces.length > 0, "multi-word terms are quoted");
  ok(withSpaces.every((t) => /\s/.test(t)), "  only those with a space");
  ok(allGroups.flat().some((t) => t === "STM32"), "single words are left unquoted");

  console.log("\nopening a search");
  fwButtons[0].dispatchEvent(new window.Event("click"));
  ok(opened.length === 1, "one tab per click");
  const u = new window.URL(opened[0]);
  ok(u.hostname === "www.linkedin.com" && u.pathname === "/search/results/people/", "LinkedIn people search");
  ok(parse(u.searchParams.get("keywords")).length <= MAX_TERMS, "  the query stays inside the limit");
  ok(!u.searchParams.get("keywords").includes("Politecnico"), "  the school is never a keyword");
  ok(u.searchParams.get("geoUrn") === '["103350119"]', "  location rides along as a filter");
  ok(u.searchParams.get("schoolFilter") === '["15122"]', "  so does the school");
  ok(u.searchParams.get("network") === '["S"]', "  and the connection degree");

  console.log("\nseniority adds exactly one term");
  const before = parse(fwButtons[0].title).length;
  const senior = doc.getElementById("senior");
  senior.value = "staff";
  senior.dispatchEvent(new window.Event("change"));
  await tick();
  const after = parse(termButtons(card("firmware-platform"))[0].title).length;
  ok(after === before + 1, `one more term, not five (${before} -> ${after})`);
  ok(termButtons(card("firmware-platform"))[0].title.includes("staff"), "  and it is the one chosen");
  senior.value = "";
  senior.dispatchEvent(new window.Event("change"));
  await tick();

  console.log("\nposts row");
  const postsBtn = [...doc.querySelectorAll("#graph button")].find((b) => b.textContent.includes("post"));
  postsBtn.dispatchEvent(new window.Event("click"));
  const postsUrl = new window.URL(opened[opened.length - 1]);
  ok(postsUrl.pathname === "/search/results/content/", "searches posts, not people");
  ok(!postsUrl.searchParams.get("geoUrn"), "  carries no people-only filters");

  console.log("\nsaved filters");
  const geoAdd = doc.getElementById("geo-add");
  ok(geoAdd.hidden === true, "the add panel starts closed");
  doc.getElementById("geo-add-toggle").dispatchEvent(new window.Event("click"));
  ok(geoAdd.hidden === false, "Add a filter opens it");

  doc.getElementById("geo-label").value = "Turin";
  doc.getElementById("geo-save").dispatchEvent(new window.Event("click"));
  await tick();
  const status = doc.getElementById("geo-status");
  ok(status.className === "bad", "saving with an empty URL is reported as a failure");
  ok(/Set one on LinkedIn first/.test(status.textContent), "  and says what was missing");

  doc.getElementById("geo-url").value =
    'https://www.linkedin.com/search/results/people/?keywords=x&geoUrn=%5B%22103644278%22%5D';
  doc.getElementById("geo-label").value = "Turin";
  doc.getElementById("geo-save").dispatchEvent(new window.Event("click"));
  await tick(); await tick();
  ok(status.className !== "bad", "a real URL saves");
  ok([...doc.getElementById("geo").options].some((o) => o.textContent === "Turin"), "  it joins the dropdown");
  ok(doc.getElementById("geo").value === "103644278", "  and is selected");

  const parseUrl = window.eval("filterFromUrl");
  const geoHit = parseUrl('https://www.linkedin.com/search/results/people/?geoUrn=%5B%22103644278%22%5D');
  ok(geoHit.kind === "location" && geoHit.id === "103644278", "a geoUrn is read as a location");
  const schoolHit = parseUrl('https://www.linkedin.com/search/results/people/?schoolFilter=%5B%2215122%22%5D');
  ok(schoolHit.kind === "school" && schoolHit.id === "15122", "a schoolFilter as a school");
  ok(parseUrl("https://www.linkedin.com/search/results/people/?keywords=x") === null, "neither filter is rejected");
  ok(parseUrl("https://example.com/?geoUrn=%5B%221%22%5D") === null, "a non-LinkedIn URL is rejected");
  ok(parseUrl("not a url") === null, "junk is rejected");

  console.log("\ncopy");
  const copyBtn = card("firmware-platform").querySelector(".btns button.secondary");
  copyBtn.dispatchEvent(new window.Event("click"));
  await tick();
  ok(copied.length === 1 && /STM32|firmware/.test(copied[0]), "Copy puts the group's query on the clipboard");

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();

// Every page in the extension, checked for one thing: does `hidden` actually
// hide. A rule that sets `display` outranks the UA stylesheet's [hidden], so
// an element the code toggles can stay on screen with no error anywhere. It
// has happened twice — #mentor-row showed "Draft message" on the LinkedIn
// feed, and #geo-add made "Add a location" look like a dead button.

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const EXT = path.join(__dirname, "..", "extension");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ok   " + m); } else { fail++; console.log("  FAIL " + m); } };

// Inline <style> blocks are not applied by jsdom unless the page is parsed with
// scripting; lift them into a real stylesheet so the cascade runs.
function load(file) {
  const html = fs.readFileSync(path.join(EXT, file), "utf8");
  const dom = new JSDOM(html);
  const { window } = dom;
  for (const link of window.document.querySelectorAll('link[rel="stylesheet"]')) {
    const href = link.getAttribute("href");
    const style = window.document.createElement("style");
    style.textContent = fs.readFileSync(path.join(EXT, href), "utf8");
    window.document.head.appendChild(style);
  }
  return window;
}

const PAGES = ["popup.html", "search.html", "batch.html", "options.html"];

for (const page of PAGES) {
  const window = load(page);
  const hiddenEls = [...window.document.querySelectorAll("[hidden]")];
  console.log(`${page} — ${hiddenEls.length} element(s) start hidden`);
  if (!hiddenEls.length) {
    ok(true, "  nothing to check");
    continue;
  }
  for (const el of hiddenEls) {
    const id = el.id || el.className || el.tagName.toLowerCase();
    ok(window.getComputedStyle(el).display === "none", `  ${id} is really hidden`);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

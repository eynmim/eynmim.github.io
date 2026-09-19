// Shared jsdom scaffolding for the adapter tests.
//
// jsdom implements no innerText at all, and both adapters depend on it: the
// profile adapter for the raw page text, the people adapter for card text. The
// shim below breaks on block elements, which is enough to exercise the ordering
// logic. Browsers provide the real thing.

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const EXT = path.join(__dirname, "..", "extension");

const BLOCK = new Set([
  "DIV", "SECTION", "MAIN", "P", "LI", "UL", "OL",
  "H1", "H2", "H3", "H4", "HEADER", "FOOTER", "ARTICLE",
]);

function shimInnerText(window) {
  Object.defineProperty(window.HTMLElement.prototype, "innerText", {
    configurable: true,
    get() {
      const walk = (node) => {
        let out = "";
        for (const child of node.childNodes) {
          if (child.nodeType === 3) out += child.textContent;
          else if (child.nodeType === 1) {
            const block = BLOCK.has(child.tagName);
            if (block && out && !out.endsWith("\n")) out += "\n";
            out += walk(child);
            if (block && !out.endsWith("\n")) out += "\n";
          }
        }
        return out;
      };
      return walk(this).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n");
    },
  });
}

// Load one adapter file into a page built from `html`, and hand back whatever
// it hung on window.
function runAdapter(file, html, url, globalName) {
  const dom = new JSDOM(html, { url, runScripts: "outside-only" });
  shimInnerText(dom.window);
  dom.window.eval(fs.readFileSync(path.join(EXT, "adapters", file), "utf8"));
  return { window: dom.window, api: dom.window[globalName] };
}

function reporter() {
  const state = { pass: 0, fail: 0 };
  const ok = (cond, msg) => {
    if (cond) {
      state.pass++;
      console.log("  ok   " + msg);
    } else {
      state.fail++;
      console.log("  FAIL " + msg);
    }
  };
  const done = () => {
    console.log(`\n${state.pass} passed, ${state.fail} failed`);
    process.exit(state.fail ? 1 : 0);
  };
  return { ok, done };
}

module.exports = { EXT, shimInnerText, runAdapter, reporter };

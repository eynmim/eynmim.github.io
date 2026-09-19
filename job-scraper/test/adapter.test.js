// Runs adapters/linkedin-profile.js against two synthetic profile pages: the
// DOM the adapter was written for, and the shape LinkedIn moved to (no <h1>,
// none of the old class names, entries that are not <li>).
//
// jsdom has no innerText, so the harness shims one that breaks on block
// elements. That is only needed here; browsers provide the real thing.

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ADAPTER = path.join(__dirname, "..", "extension", "adapters", "linkedin-profile.js");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ok   " + m); } else { fail++; console.log("  FAIL " + m); } };

const BLOCK = new Set(["DIV", "SECTION", "MAIN", "P", "LI", "UL", "OL", "H1", "H2", "H3", "H4", "HEADER", "FOOTER", "ARTICLE"]);

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

function run(html, url) {
  const dom = new JSDOM(html, { url, runScripts: "outside-only" });
  shimInnerText(dom.window);
  const src = fs.readFileSync(ADAPTER, "utf8");
  dom.window.eval(src);
  const api = dom.window.__JOBMATCH_PROFILE_ADAPTER;
  return { profile: api.collectProfile(), probe: api.probeDom(), window: dom.window };
}

// ---------- the DOM the adapter was originally written for ----------
const OLD_DOM = `
<title>Marco Rossi | LinkedIn</title>
<main>
  <section>
    <h1>Marco Rossi</h1>
    <div class="text-body-medium break-words">Senior Firmware Engineer at Nordic</div>
    <span class="text-body-small inline t-black--light break-words">Turin, Piedmont, Italy</span>
  </section>
  <section><div id="about"></div><h2>About</h2><p>I work on the BLE controller stack.</p></section>
  <section><div id="experience"></div><h2>Experience</h2>
    <ul>
      <li>Senior Firmware Engineer, Nordic Semiconductor, 2021 - Present</li>
      <li>Firmware Engineer, Espressif, 2018 - 2021</li>
    </ul>
  </section>
  <section><div id="education"></div><h2>Education</h2>
    <ul><li>Politecnico di Torino, MSc Electronic Engineering</li></ul>
  </section>
</main>`;

// ---------- the shape the real page moved to ----------
// No <h1>, old class names gone, entries are <div>s. Matches the Check DOM
// report from a live profile: only about and raw came back filled.
const NEW_DOM = `
<title>(3) Callum Allen | LinkedIn</title>
<main>
  <section>
    <div><span>Callum Allen</span><span>· 1st</span></div>
    <div>Embedded Software Recruitment Specialist</div>
    <div>Manchester, England, United Kingdom</div>
    <div>4,512 followers</div>
    <div>Message</div>
  </section>
  <section><div id="about"></div><h2>About</h2><p>With 65+ personal recommendations from Embedded engineers.</p></section>
  <section><div id="experience"></div><h2>Experience</h2>
    <div>
      <div>Principal Consultant at IC Resources, Jan 2021 - Present, Manchester</div>
      <div>Recruitment Consultant at Redline Group, 2018 - 2021, Hertfordshire</div>
    </div>
    <div>Show all 4 experiences</div>
  </section>
  <section><div id="education"></div><h2>Education</h2>
    <div><div>University of Manchester, BA Economics, 2014 - 2017</div></div>
  </section>
</main>`;

(async () => {
  console.log("adapter on the original DOM");
  const a = run(OLD_DOM, "https://www.linkedin.com/in/marco-rossi/?trk=x");
  ok(a.profile.name === "Marco Rossi", `name from the h1 (${a.profile.name})`);
  ok(/Senior Firmware Engineer/.test(a.profile.headline), "headline from the old class");
  ok(/Turin/.test(a.profile.location), "location from the old class");
  ok(/BLE controller/.test(a.profile.about), "about from the anchor");
  ok(a.profile.experience.length === 2, `both roles (${a.profile.experience.length})`);
  ok(a.profile.education.length === 1, "education read");
  ok(a.profile.url === "https://www.linkedin.com/in/marco-rossi/", "query string dropped from the url");
  ok(a.probe.oldSelectors.headline === true, "probe reports the old classes as present");

  console.log("\nadapter on the DOM LinkedIn moved to");
  const b = run(NEW_DOM, "https://www.linkedin.com/in/callum-allen-44-/");
  ok(b.probe.h1Count === 0, "there is no h1 at all on this page");
  ok(b.probe.oldSelectors.headline === false, "probe reports the old headline class gone");
  ok(b.profile.name === "Callum Allen", `name recovered anyway (${b.profile.name})`);
  ok(!b.profile.name.includes("(3)"), "  the unread-count prefix is stripped from the title");
  ok(!b.profile.name.includes("LinkedIn"), "  and the ' | LinkedIn' suffix");
  ok(/Embedded Software Recruitment/.test(b.profile.headline), `headline from the top card (${b.profile.headline})`);
  ok(/Manchester/.test(b.profile.location), `location from the top card (${b.profile.location})`);
  ok(!/followers/.test(b.profile.headline + b.profile.location), "follower counts kept out of both");
  ok(/65\+ personal recommendations/.test(b.profile.about), "about still read from the anchor");
  ok(b.profile.experience.length === 2, `roles found with no <li> present (${b.profile.experience.length})`);
  ok(/IC Resources/.test(b.profile.experience[0]), "  first role is the real one");
  ok(!b.profile.experience.some((e) => /^Show all/i.test(e)), "  the 'Show all' footer is not an entry");
  ok(b.profile.education.length === 1, "education found the same way");
  ok(b.profile.raw.includes("Callum Allen"), "raw still carries the page as the last-resort fallback");

  console.log("\nthe field the tracker depends on");
  // Mark as sent writes profile.name into outreach.csv. A blank one silently
  // breaks follow-ups and duplicate avoidance, so it gets its own assertion.
  for (const [label, res] of [["original", a], ["moved", b]]) {
    ok(!!res.profile.name.trim(), `name is non-empty on the ${label} DOM`);
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();

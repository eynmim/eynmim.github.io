// Runs adapters/linkedin-profile.js against two synthetic profile pages: the
// DOM the adapter was written for, and the shape LinkedIn moved to (no <h1>,
// none of the old class names, entries that are not <li>).
//
// jsdom has no innerText, so the harness shims one that breaks on block
// elements. That is only needed here; browsers provide the real thing.

const { runAdapter, reporter } = require("./dom-helpers");
const { ok, done } = reporter();

function run(html, url) {
  const { window, api } = runAdapter("linkedin-profile.js", html, url, "__JOBMATCH_PROFILE_ADAPTER");
  return { profile: api.collectProfile(), probe: api.probeDom(), window };
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
// Reconstructed from a live Check DOM report: no <h1>, no anchor ids, old
// class names gone, the whole top card rendered inline so innerText returns a
// single run-together line, experience still in <li> but education not.
const NEW_DOM = `
<title>(3) Callum Allen | LinkedIn</title>
<main>
  <section>
    <div><span>Callum Allen</span><span>·&nbsp;</span><span>1st</span><span>·&nbsp;</span><span>2nd</span><span>Embedded Software Recruitment | Assisting Embedded Software engineers across the UK</span><span>IC Resources</span><span>Bracknell, England, United Kingdom</span><span>Contact info</span><span>4,512 followers</span></div>
    <div><span>IC Resources</span><span>Antonio</span><span>Ali</span><span>and 2 other mutual connections</span><span>Visit my website</span></div>
    <div><button>Message</button><button>More</button></div>
  </section>
  <section><h2>About</h2><p>With 65+ personal recommendations from Embedded engineers.</p></section>
  <section><h2>Experience</h2>
    <ul>
      <li>Team Principal - Embedded Software, IC Resources, Jan 2026 - Present</li>
      <li>Principal Consultant, IC Resources, Jan 2021 - Dec 2025</li>
      <li>Senior Consultant, IC Resources, 2019 - 2021</li>
      <li>Consultant, Redline Group, 2018 - 2019</li>
      <li>Trainee, Redline Group, 2017 - 2018</li>
    </ul>
  </section>
  <section><h2>Education</h2>
    <div>
      <div>Key Training, Level 3 NVQ, Team Leadership, 2018 - 2019</div>
      <div>Ashton Sixth Form College, A Levels, 2014 - 2016</div>
    </div>
    <div>Show all 3 educations</div>
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
  ok(Object.values(b.probe.anchors).every((v) => v === false), "the anchor ids are gone too");
  // The condition the text-node fallback exists for: innerText glues the name,
  // the degree badge and the headline into a single line, so splitting on
  // newlines cannot separate them.
  ok(
    b.probe.topCardLines.some((l) => l.includes("Callum Allen") && /Embedded Software/.test(l)),
    "innerText runs the name and the headline together on one line"
  );
  ok(b.probe.topCardParts[0] === "Callum Allen", "but the text nodes keep them apart");
  ok(/^Embedded Software/.test(b.probe.topCardParts[1]), "  headline is the next node after the name");

  ok(b.profile.name === "Callum Allen", `name recovered from the tab title (${b.profile.name})`);
  ok(!b.profile.name.includes("(3)"), "  the unread-count prefix is stripped");
  ok(!b.profile.name.includes("LinkedIn"), "  and the ' | LinkedIn' suffix");
  ok(/^Embedded Software Recruitment/.test(b.profile.headline), `headline from the text nodes (${b.profile.headline})`);
  // The current employer sits between the headline and the location in the
  // node order, so "first thing after the headline" picks the company.
  ok(b.profile.location === "Bracknell, England, United Kingdom", `location is the place (${b.profile.location})`);
  ok(b.profile.location !== "IC Resources", "  not the employer that precedes it");
  const both = b.profile.headline + " " + b.profile.location;
  ok(!/followers/.test(both), "  follower counts kept out");
  ok(!/Contact info|Message|More/.test(both), "  so are the action buttons");
  ok(!/\b(1st|2nd|3rd)\b/.test(both), "  and the connection degree badges");
  ok(!/mutual connections|Visit my website/.test(b.probe.topCardParts.join(" ")),
     "  mutual-connection and website rows are filtered before the fields are picked");
  ok(/65\+ personal recommendations/.test(b.profile.about), "about found by heading text, with no anchor");
  ok(b.profile.experience.length === 5, `all five roles (${b.profile.experience.length})`);
  ok(/Team Principal/.test(b.profile.experience[0]), "  newest role first");
  ok(b.profile.education.length === 2, `education found with no <li> present (${b.profile.education.length})`);
  ok(!b.profile.education.some((e) => /^Show all/i.test(e)), "  the 'Show all' footer is not an entry");
  ok(b.profile.raw.includes("Callum Allen"), "raw still carries the page as the last-resort fallback");

  // A live run read "During the project, I was also able to work with my
  // brother" as the location: one comma, no digits, so the old rule accepted it.
  console.log("\na sentence is not a location");
  const PROSE_IN_TOP_CARD = `
<title>Silas Perry | LinkedIn</title>
<main>
  <section>
    <div><span>Silas Perry</span><span>·&nbsp;</span><span>3rd</span><span>Senior Embedded Software/Firmware Engineer</span><span>During the project, I was also able to work with my brother</span><span>Omaha, Nebraska, United States</span></div>
  </section>
  <section><h2>About</h2><p>I build embedded systems.</p></section>
</main>`;
  const c = run(PROSE_IN_TOP_CARD, "https://www.linkedin.com/in/silas-r-perry/");
  ok(c.profile.headline === "Senior Embedded Software/Firmware Engineer", `headline still right (${c.profile.headline})`);
  ok(c.profile.location === "Omaha, Nebraska, United States", `location skips the prose (${c.profile.location})`);
  ok(!/brother/.test(c.profile.location), "  the About sentence is not mistaken for a place");

  console.log("\nthe field the tracker depends on");
  // Mark as sent writes profile.name into outreach.csv. A blank one silently
  // breaks follow-ups and duplicate avoidance, so it gets its own assertion.
  for (const [label, res] of [["original", a], ["moved", b]]) {
    ok(!!res.profile.name.trim(), `name is non-empty on the ${label} DOM`);
  }

  done();
})();

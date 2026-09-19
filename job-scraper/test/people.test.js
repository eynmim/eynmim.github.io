// Runs adapters/linkedin-people.js against a synthetic people-search results
// page, shaped like the live one: cards rendered inline, the profile link
// carrying the name, connection degree and mutual-connection rows mixed in.

const { runAdapter, reporter } = require("./dom-helpers");
const { ok, done } = reporter();

const URL = "https://www.linkedin.com/search/results/people/?keywords=STM32";

const RESULTS = `
<title>Search | LinkedIn</title>
<main>
  <ul>
    <li>
      <a href="/in/jeffrey-grange/"><span>Jeffrey Grange</span></a>
      <div><span>·&nbsp;</span><span>2nd</span><span>Embedded Systems Engineer</span><span>Temecula, California, United States</span><span>Current: Engineer at Opto 22</span></div>
      <div><span>Naren Subburaj is a mutual connection</span></div>
      <button>Connect</button>
    </li>
    <li>
      <a href="/in/venkata-yuva/"><span>Venkata Yuva Kishore</span></a>
      <div><span>·&nbsp;</span><span>2nd</span><span>Embedded Systems Engineer | Firmware | RTOS | ARM Cortex, STM32</span><span>United States</span><span>Open to work</span></div>
      <div><span>Summary: I am an Embedded Systems Engineer with a strong foundation in real-time systems.</span></div>
      <button>Connect</button>
    </li>
    <li>
      <a href="/in/alessandro-salvato/"><span>Alessandro Salvato</span></a>
      <div><span>·&nbsp;</span><span>2nd</span><span>Embedded Software Engineer - Quant Trader</span><span>Greater Turin Metropolitan Area</span></div>
      <div><span>Alessandro Savino, Luca Gullone</span><span>and 9 other mutual connections</span><span>726 followers</span></div>
      <button>Connect</button>
    </li>
    <li>
      <a href="/in/callum-allen-44-/"><span>Callum Allen</span></a>
      <div><span>·&nbsp;</span><span>1st</span><span>Embedded Software Recruitment</span><span>Bracknell, England, United Kingdom</span></div>
      <button>Message</button>
    </li>
    <!-- Second layout, seen live: the /in/ link wraps the entire row, so its
         own text is the whole card rather than the name. -->
    <li>
      <a href="/in/luca-carlone/">
        <span>Luca Carlone</span><span>·&nbsp;</span><span>2nd</span>
        <span>Mechanical Designer - Electronic BU - R&amp;D at MTA</span>
        <span>Lodi, Lombardy, Italy</span><span>Connect</span>
        <span>Summary: Our products are Instrument Clusters, Electronic Control units.</span>
      </a>
    </li>
  </ul>
  <div>
    <a href="/in/jeffrey-grange/">View Jeffrey Grange’s profile</a>
  </div>
</main>`;

const { api } = runAdapter("linkedin-people.js", RESULTS, URL, "__JOBMATCH_PEOPLE_ADAPTER");
const people = api.collectPeople();
const by = (slug) => people.find((p) => p.url.endsWith(slug));

console.log("people search results");
ok(people.length === 5, `one entry per person (${people.length})`);
ok(new Set(people.map((p) => p.url)).size === people.length,
   "the same person linked twice on the page is not counted twice");

console.log("\nfields off each card");
const jeff = by("jeffrey-grange");
ok(jeff.name === "Jeffrey Grange", `name from the profile link (${jeff.name})`);
ok(jeff.headline === "Embedded Systems Engineer", `headline (${jeff.headline})`);
ok(jeff.location === "Temecula, California, United States", `location (${jeff.location})`);
ok(jeff.degree === "2nd", "connection degree kept as its own field");
ok(/Opto 22/.test(jeff.snippet), `the Current: line becomes the snippet (${jeff.snippet})`);
ok(jeff.url === "https://www.linkedin.com/in/jeffrey-grange", "url normalised to the profile");

console.log("\nthings that must not leak into the fields");
const ale = by("alessandro-salvato");
ok(ale.headline === "Embedded Software Engineer - Quant Trader", `headline is clean (${ale.headline})`);
ok(ale.location === "Greater Turin Metropolitan Area", `location is the place (${ale.location})`);
const joined = people.map((p) => `${p.headline} ${p.location}`).join(" ");
ok(!/mutual connection/i.test(joined), "no mutual-connection rows");
ok(!/followers/i.test(joined), "no follower counts");
ok(!/^(Connect|Message)$/m.test(joined), "no action buttons");
ok(!/\b(1st|2nd|3rd)\b/.test(joined), "no degree badges");

console.log("\nthe layout where the link wraps the whole card");
const luca = by("luca-carlone");
ok(luca.name === "Luca Carlone", `name is the name, not the whole row (${luca.name.slice(0, 40)})`);
ok(luca.name.length < 30, "  and is not the card text");
ok(luca.headline === "Mechanical Designer - Electronic BU - R&D at MTA", `headline (${luca.headline})`);
ok(luca.location === "Lodi, Lombardy, Italy", `location (${luca.location})`);
ok(/Instrument Clusters/.test(luca.snippet), "the summary becomes the snippet");
ok(!/Connect/.test(`${luca.headline} ${luca.location}`), "the Connect button stays out");

console.log("\nthe open-to-work badge");
ok(by("venkata-yuva").open_to_work === true, "flagged on the card that shows it");
ok(by("jeffrey-grange").open_to_work === false, "and not on the others");

console.log("\nwhat the helper receives");
// The triage prompt reads these keys; a missing one silently weakens the sort.
for (const p of people) {
  ok(typeof p.name === "string" && p.name.length > 0, `  ${p.url.split("/in/")[1]} has a name`);
}
ok(people.every((p) => "headline" in p && "location" in p && "snippet" in p && "degree" in p),
   "every entry carries the full shape");

done();

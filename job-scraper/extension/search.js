// Search launcher. Turns TITLES.md into one-click LinkedIn people searches and
// shows how many people you have already contacted per area (helper's CSV).
// It only builds URLs — no scraping, no automated clicking, no sending.
//
// Term groups, not one long Boolean string. Measured against the live site:
// 2, 3 and 5 terms all return results; 7 returns nothing at all, silently.
// TITLES.md's "keep it under ~15 terms" was written against an older LinkedIn
// and is now wrong in the direction that looks like an empty market.

const HELPER_DEFAULT = "http://127.0.0.1:5577";
const GROUP = 4; // terms per button, leaving headroom under the limit
const MAX_TERMS = 6; // past this LinkedIn returns zero rather than truncating

// Terms come from TITLES.md. `question` is the area-specific opener from
// README D2; areas D2 does not cover have none, so use the four common ones.
const AREAS = [
  {
    id: "firmware-platform",
    name: "Firmware / embedded software",
    who: "Senior/Staff Firmware @ Nordic, Espressif, Silicon Labs, ST",
    question: "how much of your week is new code vs debugging someone else's",
    sets: [
      { label: "titles", terms: ["firmware engineer", "embedded software", "embedded systems engineer", "embedded developer", "IoT engineer", "sviluppatore firmware", "ingegnere firmware", "sviluppatore embedded"] },
      { label: "tools", terms: ["STM32", "ESP32", "nRF52", "nRF5340", "FreeRTOS", "Zephyr", "ESP-IDF", "bare metal", "BLE", "Bluetooth Low Energy"] },
    ],
  },
  {
    id: "hardware-pcb-power",
    name: "Hardware / PCB / power",
    who: "Hardware engineer @ Leonardo, Marelli, Turin startups",
    question: "in the first 3 years how much is design vs BOM and suppliers",
    sets: [
      { label: "titles", terms: ["electronics engineer", "electronic design", "hardware engineer", "hardware design", "PCB design", "power electronics", "ingegnere elettronico", "progettista elettronico", "progettista hardware", "progettista PCB"] },
      { label: "tools", terms: ["KiCad", "Altium", "OrCAD", "Eagle", "schematic capture", "PCB layout", "LTspice", "EMC", "DC-DC"] },
    ],
  },
  {
    id: "embedded-security",
    name: "Embedded security",
    who: "Product/Firmware Security @ ST secure MCU, NXP, Infineon; automotive cyber @ Stellantis, Marelli",
    question: "how much is engineering vs compliance and paperwork",
    sets: [
      { label: "terms", terms: ["product security", "embedded security", "firmware security", "hardware security", "IoT security", "automotive cybersecurity", "ISO 21434", "secure boot", "TrustZone", "side channel", "fault injection"] },
    ],
  },
  {
    id: "embedded-linux",
    name: "Embedded Linux / platform",
    who: "BSP/platform engineer at camera, gateway, robotics companies; Bootlin, Toradex",
    question: "what made you leave bare-metal for Linux, any regrets",
    sets: [
      { label: "terms", terms: ["embedded linux", "BSP", "Yocto", "Buildroot", "kernel driver", "device driver", "U-Boot", "linux kernel"] },
    ],
  },
  {
    id: "silicon-soc-fpga",
    name: "Silicon / SoC / FPGA",
    who: "Design/Verification @ ST Agrate, Infineon Villach",
    question: "what does someone with product-firmware background lose and gain going into silicon",
    sets: [
      { label: "terms", terms: ["FPGA", "RTL design", "ASIC", "SoC", "digital design engineer", "verification engineer", "UVM", "SystemVerilog", "VHDL", "progettista FPGA", "microelettronica"] },
    ],
  },
  {
    id: "automotive-safety",
    name: "Automotive / functional safety",
    who: "@ Stellantis/CRF, Marelli, Italdesign, Bosch Italia",
    question: "what do outsiders get wrong about automotive work",
    sets: [
      { label: "terms", terms: ["AUTOSAR", "functional safety", "ISO 26262", "ECU software", "battery management", "BMS", "ADAS", "model-based design", "sicurezza funzionale", "centraline"] },
    ],
  },
  {
    id: "edge-ai-dsp",
    name: "Edge AI / DSP",
    who: "ML-on-edge @ Arduino, ST (STM32 AI), vision startups",
    question: "how much ML vs embedded do you need, which is harder to learn late",
    sets: [
      { label: "terms", terms: ["edge AI", "TinyML", "DSP engineer", "signal processing", "sensor fusion", "TensorFlow Lite", "embedded machine learning"] },
    ],
  },
  {
    id: "robotics-control",
    name: "Robotics / control / motion",
    who: "@ Comau, PoliTo spin-offs",
    question: "where's the line between robotics engineer and embedded engineer in your team",
    sets: [
      { label: "terms", terms: ["robotics engineer", "control systems", "motor control", "motion control", "mechatronics", "ROS", "UAV", "drone", "avionics", "ingegnere robotica", "ingegnere controlli", "meccatronico"] },
    ],
  },
  {
    id: "low-power-wireless",
    name: "Low power / wireless / RF",
    who: "RF and wireless hardware engineers; anyone whose product runs on a battery",
    question: null,
    sets: [
      { label: "titles", terms: ["RF engineer", "RF design", "antenna", "wireless systems", "radiofrequenza", "progettista RF"] },
      { label: "tools", terms: ["BLE", "Bluetooth Low Energy", "LoRa", "LoRaWAN", "Zigbee", "nRF52", "low power", "battery life"] },
    ],
  },
  {
    id: "other",
    name: "Bridging roles, test and validation",
    who: "TITLES.md §3 and §4 — highest-value for an exploration: they have seen several areas from inside, and nobody messages the test people so they answer",
    question: null,
    sets: [
      { label: "hardware + firmware", terms: ["embedded systems architect", "field application engineer", "applications engineer", "hardware and firmware", "ingegnere di sistema", "ingegnere meccatronico"] },
      { label: "test / validation", terms: ["validation engineer", "EMC engineer", "NPI engineer", "bring-up", "ingegnere di validazione", "collaudo"] },
    ],
  },
];

const GRAPH = [
  {
    label: "Alumni",
    terms: ["firmware", "embedded", "PCB", "FPGA"],
    why: "use with the School filter set to PoliTo — alumni answer, title irrelevant",
  },
  {
    label: "Turin employers",
    terms: ["STMicroelectronics", "Leonardo", "Marelli", "Comau"],
    why: "company defines the work better than the title",
  },
  {
    label: "More Turin employers",
    terms: ["Stellantis", "Italdesign", "Reply", "Bosch"],
    why: "the rest of the local list",
  },
  {
    label: "Part makers",
    terms: ["Infineon", "Nordic Semiconductor", "Espressif", "Silicon Labs"],
    why: "the people who build the chips you already use",
  },
  {
    label: "Small Turin firms",
    terms: ["progettazione elettronica", "elettronica industriale"],
    why: "under 50 people: the CTO personally did the board and the firmware",
  },
  {
    label: "People who post about it",
    terms: ["STM32", "KiCad", "Zephyr", "low power"],
    why: "posts, not titles — they do it whatever they are called",
    posts: true,
  },
];

const DAILY_CAP = 8; // README D: max 5-8 messages a day

const els = {
  areas: document.getElementById("areas"),
  graph: document.getElementById("graph"),
  senior: document.getElementById("senior"),
  quota: document.getElementById("quota"),
  geo: document.getElementById("geo"),
  school: document.getElementById("school"),
  network: document.getElementById("network"),
  geoAddToggle: document.getElementById("geo-add-toggle"),
  geoAdd: document.getElementById("geo-add"),
  geoUrl: document.getElementById("geo-url"),
  geoLabel: document.getElementById("geo-label"),
  geoSave: document.getElementById("geo-save"),
  geoRemove: document.getElementById("geo-remove"),
  geoStatus: document.getElementById("geo-status"),
};

// Location and school are LinkedIn's own filters, stored as the ids copied out
// of a search URL the user has already filtered. They are not keywords: a
// keyword ANDs with the search terms and can empty a good search, which is
// what putting "Politecnico di Torino" in the query used to do. Nothing is
// hardcoded — a guessed id would filter silently to the wrong place.
let savedGeos = [];
let savedSchools = [];

async function helperBase() {
  const { helperUrl = HELPER_DEFAULT } = await chrome.storage.local.get(["helperUrl"]);
  return helperUrl.replace(/\/$/, "");
}

async function loadFilters() {
  const {
    savedGeos: geos = [],
    savedSchools: schools = [],
    lastGeo = "",
    lastSchool = "",
    lastNetwork = "",
  } = await chrome.storage.local.get([
    "savedGeos", "savedSchools", "lastGeo", "lastSchool", "lastNetwork",
  ]);
  savedGeos = geos;
  savedSchools = schools;
  renderFilters(lastGeo, lastSchool);
  els.network.value = lastNetwork;
}

function fillSelect(select, items, anyLabel, selected) {
  select.innerHTML = "";
  const any = document.createElement("option");
  any.value = "";
  any.textContent = anyLabel;
  select.appendChild(any);
  for (const it of items) {
    const o = document.createElement("option");
    o.value = it.id;
    o.textContent = it.label;
    select.appendChild(o);
  }
  if (selected && items.some((it) => it.id === selected)) select.value = selected;
}

function renderFilters(geo, school) {
  fillSelect(els.geo, savedGeos, "anywhere", geo);
  fillSelect(els.school, savedSchools, "any", school);
}

// LinkedIn writes these as geoUrn=["103350119"] / schoolFilter=["12345"],
// percent-encoded. Take whichever the pasted URL carries.
function filterFromUrl(raw) {
  try {
    const u = new URL(raw.trim());
    if (!/linkedin\.com$/.test(u.hostname.replace(/^www\./, ""))) return null;
    for (const [param, kind] of [["geoUrn", "location"], ["schoolFilter", "school"]]) {
      const v = u.searchParams.get(param);
      if (!v) continue;
      const ids = JSON.parse(v);
      const id = String(Array.isArray(ids) ? ids[0] : ids);
      if (/^\d+$/.test(id)) return { kind, id };
    }
    return null;
  } catch {
    return null;
  }
}

function setGeoStatus(msg, bad) {
  els.geoStatus.textContent = msg;
  els.geoStatus.className = bad ? "bad" : "";
}

async function onSaveFilter() {
  const found = filterFromUrl(els.geoUrl.value);
  if (!found) {
    setGeoStatus(
      "No Location or School filter in that URL. Set one on LinkedIn first, then copy the address bar.",
      true
    );
    return;
  }
  const label = els.geoLabel.value.trim() || `${found.kind} ${found.id}`;
  const entry = { label, id: found.id };
  if (found.kind === "location") {
    savedGeos = [...savedGeos.filter((g) => g.id !== found.id), entry];
    await chrome.storage.local.set({ savedGeos, lastGeo: found.id });
    renderFilters(found.id, els.school.value);
  } else {
    savedSchools = [...savedSchools.filter((s) => s.id !== found.id), entry];
    await chrome.storage.local.set({ savedSchools, lastSchool: found.id });
    renderFilters(els.geo.value, found.id);
  }
  els.geoUrl.value = "";
  els.geoLabel.value = "";
  setGeoStatus(`Saved ${label} as a ${found.kind} filter. Every button uses it now.`);
}

async function onRemoveFilter() {
  if (els.geo.value) {
    savedGeos = savedGeos.filter((g) => g.id !== els.geo.value);
    await chrome.storage.local.set({ savedGeos, lastGeo: "" });
    renderFilters("", els.school.value);
    setGeoStatus("Location removed.");
    return;
  }
  if (els.school.value) {
    savedSchools = savedSchools.filter((s) => s.id !== els.school.value);
    await chrome.storage.local.set({ savedSchools, lastSchool: "" });
    renderFilters(els.geo.value, "");
    setGeoStatus("School removed.");
    return;
  }
  setGeoStatus("Pick a saved filter first.", true);
}

// ---------------- queries ----------------

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

// Multi-word terms need quoting; single words must not be quoted or LinkedIn
// treats them as exact-match and drops the inflections.
function quote(term) {
  return /\s/.test(term) ? `"${term}"` : term;
}

function buildQuery(terms) {
  const all = [...terms];
  if (els.senior.value) all.push(els.senior.value);
  const quoted = all.map(quote);
  return quoted.length === 1 ? quoted[0] : `(${quoted.join(" OR ")})`;
}

function termCount(terms) {
  return terms.length + (els.senior.value ? 1 : 0);
}

function openSearch(terms, posts) {
  const kind = posts ? "content" : "people";
  const u = new URL(`https://www.linkedin.com/search/results/${kind}/`);
  u.searchParams.set("keywords", buildQuery(terms));
  // These filters only mean anything in a people search.
  if (!posts) {
    if (els.geo.value) u.searchParams.set("geoUrn", JSON.stringify([els.geo.value]));
    if (els.school.value) u.searchParams.set("schoolFilter", JSON.stringify([els.school.value]));
    if (els.network.value) u.searchParams.set("network", JSON.stringify([els.network.value]));
  }
  chrome.storage.local.set({
    lastGeo: els.geo.value,
    lastSchool: els.school.value,
    lastNetwork: els.network.value,
  });
  chrome.tabs.create({ url: u.toString() });
}

function searchButton(terms, posts) {
  const b = document.createElement("button");
  const n = termCount(terms);
  const label = terms.join(" · ");
  b.textContent = n > MAX_TERMS ? `${label} (${n} terms — too many)` : label;
  b.title = buildQuery(terms);
  if (n > MAX_TERMS) b.className = "over";
  b.addEventListener("click", () => openSearch(terms, posts));
  return b;
}

function copyButton(terms) {
  const b = document.createElement("button");
  b.className = "secondary";
  b.textContent = "Copy";
  b.addEventListener("click", async () => {
    await navigator.clipboard.writeText(buildQuery(terms));
    b.textContent = "Copied";
    setTimeout(() => (b.textContent = "Copy"), 1200);
  });
  return b;
}

// ---------------- rendering ----------------

function renderAreas(coverage) {
  els.areas.innerHTML = "";
  const target = coverage?.target ?? 2;
  for (const area of AREAS) {
    const card = document.createElement("div");
    card.className = "area";

    const head = document.createElement("div");
    head.className = "area-head";
    const nm = document.createElement("span");
    nm.className = "area-name";
    nm.textContent = area.name;
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = area.id;
    const cov = document.createElement("span");
    const done = coverage ? coverage.by_area?.[area.id]?.contacted ?? 0 : null;
    if (done === null) {
      cov.className = "cov none";
      cov.textContent = "helper off";
    } else {
      cov.className = `cov ${done >= target ? "done" : done > 0 ? "part" : "none"}`;
      cov.textContent = `${done}/${target}`;
    }
    head.append(nm, tag, cov);
    card.appendChild(head);

    const who = document.createElement("div");
    who.className = "who";
    who.textContent = area.who;
    card.appendChild(who);

    if (area.question) {
      const q = document.createElement("div");
      q.className = "q";
      const b = document.createElement("b");
      b.textContent = "Ask: ";
      q.append(b, area.question);
      card.appendChild(q);
    }

    for (const set of area.sets) {
      const row = document.createElement("div");
      row.className = "set";
      const lbl = document.createElement("span");
      lbl.className = "set-label";
      lbl.textContent = set.label;
      row.appendChild(lbl);
      const btns = document.createElement("div");
      btns.className = "btns";
      for (const group of chunk(set.terms, GROUP)) {
        btns.appendChild(searchButton(group));
        btns.appendChild(copyButton(group));
      }
      row.appendChild(btns);
      card.appendChild(row);
    }

    els.areas.appendChild(card);
  }
}

function renderGraph() {
  els.graph.innerHTML = "";
  for (const g of GRAPH) {
    const row = document.createElement("div");
    row.className = "row";
    const b = searchButton(g.terms, g.posts);
    b.textContent = g.label;
    b.title = buildQuery(g.terms);
    row.appendChild(b);
    const why = document.createElement("span");
    why.className = "why";
    why.textContent = g.why;
    row.appendChild(why);
    row.appendChild(copyButton(g.terms));
    els.graph.appendChild(row);
  }
}

async function loadCoverage() {
  try {
    const r = await fetch(`${await helperBase()}/outreach/coverage`);
    if (!r.ok) throw new Error(String(r.status));
    return await r.json();
  } catch {
    return null;
  }
}

function renderQuota(coverage) {
  if (!coverage) {
    els.quota.className = "quota";
    els.quota.textContent = "helper not running — coverage unknown";
    return;
  }
  const n = coverage.sent_today ?? 0;
  els.quota.textContent = `sent today: ${n} / ${DAILY_CAP}`;
  els.quota.className = `quota ${n >= DAILY_CAP ? "over" : n >= DAILY_CAP - 2 ? "near" : "ok"}`;
  if (n >= DAILY_CAP) els.quota.textContent += " — stop for today";
}

document.addEventListener("DOMContentLoaded", async () => {
  els.geoAddToggle.addEventListener("click", () => {
    els.geoAdd.hidden = !els.geoAdd.hidden;
  });
  els.geoSave.addEventListener("click", onSaveFilter);
  els.geoRemove.addEventListener("click", onRemoveFilter);
  await loadFilters();
  renderGraph();
  renderAreas(null);
  const coverage = await loadCoverage();
  renderAreas(coverage);
  renderQuota(coverage);
  // Seniority adds a term, so the button labels and warnings change with it.
  els.senior.addEventListener("change", () => {
    renderAreas(coverage);
    renderGraph();
  });
});

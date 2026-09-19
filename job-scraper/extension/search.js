// Search launcher. Turns TITLES.md into one-click LinkedIn people searches and
// shows how many people you have already contacted per area (helper's CSV).
// It only builds URLs — no scraping, no automated clicking, no sending.

const HELPER_DEFAULT = "http://127.0.0.1:5577";

// Boolean strings are copied from TITLES.md. `question` is the area-specific
// opener from README D2; areas D2 does not cover have none, so use the four
// common questions for those.
const AREAS = [
  {
    id: "firmware-platform",
    name: "Firmware / embedded software",
    who: "Senior/Staff Firmware @ Nordic, Espressif, Silicon Labs, ST",
    question: "how much of your week is new code vs debugging someone else's",
    searches: [
      { label: "by title", q: '("firmware engineer" OR "embedded software" OR "embedded systems engineer" OR "embedded developer" OR "IoT engineer" OR "sviluppatore firmware" OR "ingegnere firmware" OR "sviluppatore embedded")' },
      { label: "by tools", q: '(STM32 OR ESP32 OR nRF52 OR nRF5340 OR FreeRTOS OR Zephyr OR "ESP-IDF" OR "bare metal" OR BLE OR "Bluetooth Low Energy")' },
    ],
  },
  {
    id: "hardware-pcb-power",
    name: "Hardware / PCB / power",
    who: "Hardware engineer @ Leonardo, Marelli, Turin startups",
    question: "in the first 3 years how much is design vs BOM and suppliers",
    searches: [
      { label: "by title", q: '("electronics engineer" OR "electronic design" OR "hardware engineer" OR "hardware design" OR "PCB design" OR "power electronics" OR "ingegnere elettronico" OR "progettista elettronico" OR "progettista hardware" OR "progettista PCB")' },
      { label: "by tools", q: '(KiCad OR Altium OR "Altium Designer" OR OrCAD OR Eagle OR "schematic capture" OR "PCB layout" OR LTspice OR EMC OR "DC-DC")' },
    ],
  },
  {
    id: "embedded-security",
    name: "Embedded security",
    who: "Product/Firmware Security @ ST secure MCU, NXP, Infineon; automotive cyber @ Stellantis, Marelli",
    question: "how much is engineering vs compliance and paperwork",
    searches: [
      { label: "search", q: '("product security" OR "embedded security" OR "firmware security" OR "hardware security" OR "IoT security" OR "automotive cybersecurity" OR "ISO 21434" OR "secure boot" OR TrustZone OR "side channel" OR "fault injection")' },
    ],
  },
  {
    id: "embedded-linux",
    name: "Embedded Linux / platform",
    who: "BSP/platform engineer at camera, gateway, robotics companies; Bootlin, Toradex",
    question: "what made you leave bare-metal for Linux, any regrets",
    searches: [
      { label: "search", q: '("embedded linux" OR BSP OR Yocto OR Buildroot OR "kernel driver" OR "device driver" OR "U-Boot" OR "linux kernel")' },
    ],
  },
  {
    id: "silicon-soc-fpga",
    name: "Silicon / SoC / FPGA",
    who: "Design/Verification @ ST Agrate, Infineon Villach",
    question: "what does someone with product-firmware background lose and gain going into silicon",
    searches: [
      { label: "search", q: '("FPGA" OR "RTL design" OR "ASIC" OR "SoC" OR "digital design engineer" OR "verification engineer" OR UVM OR SystemVerilog OR VHDL OR "progettista FPGA" OR microelettronica)' },
    ],
  },
  {
    id: "automotive-safety",
    name: "Automotive / functional safety",
    who: "@ Stellantis/CRF, Marelli, Italdesign, Bosch Italia",
    question: "what do outsiders get wrong about automotive work",
    searches: [
      { label: "search", q: '(AUTOSAR OR "functional safety" OR "ISO 26262" OR "ECU software" OR "battery management" OR BMS OR ADAS OR "model-based design" OR "sicurezza funzionale" OR centraline)' },
    ],
  },
  {
    id: "edge-ai-dsp",
    name: "Edge AI / DSP",
    who: "ML-on-edge @ Arduino, ST (STM32 AI), vision startups",
    question: "how much ML vs embedded do you need, which is harder to learn late",
    searches: [
      { label: "search", q: '("edge AI" OR TinyML OR "DSP engineer" OR "signal processing" OR "sensor fusion" OR "TensorFlow Lite" OR "embedded machine learning" OR "computer vision" embedded)' },
    ],
  },
  {
    id: "robotics-control",
    name: "Robotics / control / motion",
    who: "@ Comau, PoliTo spin-offs",
    question: "where's the line between robotics engineer and embedded engineer in your team",
    searches: [
      { label: "search", q: '("robotics engineer" OR "control systems" OR "motor control" OR "motion control" OR mechatronics OR ROS OR UAV OR drone OR avionics OR "ingegnere robotica" OR "ingegnere controlli" OR meccatronico)' },
    ],
  },
  {
    id: "low-power-wireless",
    name: "Low power / wireless / RF",
    who: "RF and wireless hardware engineers; anyone whose product runs on a battery",
    question: null,
    searches: [
      { label: "by title", q: '("RF engineer" OR "RF design" OR "antenna" OR "wireless systems" OR "radiofrequenza" OR "progettista RF")' },
      { label: "by tools", q: '(BLE OR "Bluetooth Low Energy" OR LoRa OR LoRaWAN OR Zigbee OR nRF52 OR "low power" OR "battery life")' },
    ],
  },
  {
    id: "other",
    name: "Bridging roles, test and validation",
    who: "TITLES.md §3 and §4 — highest-value for an exploration: they have seen several areas from inside, and nobody messages the test people so they answer",
    question: null,
    searches: [
      { label: "hardware + firmware both", q: '("systems engineer" embedded) OR "embedded systems architect" OR "field application engineer" OR "applications engineer" OR "hardware and firmware" OR "firmware and hardware" OR "ingegnere di sistema" OR "ingegnere meccatronico"' },
      { label: "test / validation", q: '("test engineer" (hardware OR embedded OR electronics)) OR "validation engineer" OR "EMC engineer" OR "NPI engineer" OR "bring-up" OR "ingegnere di validazione" OR "collaudo"' },
    ],
  },
];

const GRAPH = [
  {
    label: "PoliTo alumni",
    q: '"Politecnico di Torino" (firmware OR embedded OR PCB OR FPGA)',
    why: "alumni answer; title irrelevant",
  },
  {
    label: "Turin employers",
    q: '(STMicroelectronics OR Leonardo OR Marelli OR Comau OR Stellantis OR Italdesign) embedded',
    why: "company defines the work better than the title",
  },
  {
    label: "Part makers",
    q: '(Infineon OR "Nordic Semiconductor" OR Espressif OR "Silicon Labs" OR NXP OR Arduino) (firmware OR embedded)',
    why: "the people who build the chips you already use",
  },
  {
    label: "Small Turin firms",
    q: '("progettazione elettronica" OR "elettronica industriale") (Torino OR Piemonte)',
    why: "under 50 people: the CTO personally did the board and the firmware",
  },
  {
    label: "People who post about it",
    q: 'STM32 OR KiCad OR Zephyr OR "low power"',
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
// keyword ANDs with the Boolean string and can empty a good search, which is
// what putting "Politecnico di Torino" in the query used to do. Nothing is
// hardcoded — a guessed id would filter silently to the wrong place.
let savedGeos = [];
let savedSchools = [];

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

async function helperBase() {
  const { helperUrl = HELPER_DEFAULT } = await chrome.storage.local.get(["helperUrl"]);
  return helperUrl.replace(/\/$/, "");
}

function buildKeywords(q) {
  const extra = [];
  if (els.senior.checked) extra.push('(senior OR staff OR principal OR lead OR "head of")');
  return [q, ...extra].join(" ");
}

// TITLES.md: LinkedIn silently truncates strings past roughly 15 terms. A term is
// a quoted phrase or a bare word; operators and brackets are not terms.
function termCount(keywords) {
  const phrases = keywords.match(/"[^"]*"/g) || [];
  const bare = keywords
    .replace(/"[^"]*"/g, " ")
    .replace(/[()]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !/^(OR|AND|NOT)$/i.test(w));
  return phrases.length + bare.length;
}

function openSearch(q, posts) {
  const keywords = buildKeywords(q);
  const kind = posts ? "content" : "people";
  const u = new URL(`https://www.linkedin.com/search/results/${kind}/`);
  u.searchParams.set("keywords", keywords);
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

function searchButton(s, area) {
  const b = document.createElement("button");
  const n = termCount(buildKeywords(s.q));
  b.textContent = n > 15 ? `${s.label} (${n} terms — LinkedIn may truncate)` : s.label;
  b.title = buildKeywords(s.q);
  b.addEventListener("click", () => openSearch(s.q, s.posts));
  return b;
}

function copyButton(q) {
  const b = document.createElement("button");
  b.className = "secondary";
  b.textContent = "Copy query";
  b.addEventListener("click", async () => {
    await navigator.clipboard.writeText(buildKeywords(q));
    b.textContent = "Copied";
    setTimeout(() => (b.textContent = "Copy query"), 1200);
  });
  return b;
}

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

    const btns = document.createElement("div");
    btns.className = "btns";
    for (const s of area.searches) btns.appendChild(searchButton(s, area));
    btns.appendChild(copyButton(area.searches[0].q));
    card.appendChild(btns);

    els.areas.appendChild(card);
  }
}

function renderGraph() {
  els.graph.innerHTML = "";
  for (const g of GRAPH) {
    const row = document.createElement("div");
    row.className = "row";
    row.appendChild(searchButton({ label: g.label, q: g.q, posts: g.posts }));
    const why = document.createElement("span");
    why.className = "why";
    why.textContent = g.why;
    row.appendChild(why);
    row.appendChild(copyButton(g.q));
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
  // Re-label buttons when the toggle changes the term count.
  els.senior.addEventListener("change", () => {
    renderAreas(coverage);
    renderGraph();
  });
});

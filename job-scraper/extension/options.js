const HELPER_DEFAULT = "http://127.0.0.1:5577";

const els = {
  helperUrl: document.getElementById("helperUrl"),
  cvText: document.getElementById("cvText"),
  careerFork: document.getElementById("careerFork"),
  saveBtn: document.getElementById("save-btn"),
  loadCvBtn: document.getElementById("load-cv-btn"),
  status: document.getElementById("save-status"),
};

function setStatus(msg, ok = true) {
  els.status.textContent = msg;
  els.status.style.color = ok ? "var(--good)" : "var(--bad)";
  if (msg) setTimeout(() => (els.status.textContent = ""), 2500);
}

async function load() {
  const { helperUrl, cvText, careerFork } = await chrome.storage.local.get([
    "helperUrl",
    "cvText",
    "careerFork",
  ]);
  els.helperUrl.value = helperUrl || HELPER_DEFAULT;
  els.cvText.value = cvText || "";
  els.careerFork.value = careerFork || "";
}

async function save() {
  await chrome.storage.local.set({
    helperUrl: els.helperUrl.value.trim() || HELPER_DEFAULT,
    cvText: els.cvText.value,
    careerFork: els.careerFork.value.trim(),
  });
  setStatus("Saved.");
}

async function loadCvFromHelper() {
  const base = (els.helperUrl.value.trim() || HELPER_DEFAULT).replace(/\/$/, "");
  try {
    const r = await fetch(`${base}/cv`);
    if (!r.ok) throw new Error(`${r.status}`);
    const data = await r.json();
    els.cvText.value = data.cv || "";
    setStatus(`Loaded CV (${els.cvText.value.length} chars).`);
  } catch (e) {
    setStatus(`Failed: ${e.message}`, false);
  }
}

els.saveBtn.addEventListener("click", save);
els.loadCvBtn.addEventListener("click", loadCvFromHelper);
load();

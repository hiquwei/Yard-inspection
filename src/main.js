import "./styles.css";
import { PaddleOCR } from "@paddleocr/paddleocr-js";

const APP_VERSION = "2026.07.28-paddleocr-1";
const STORAGE_KEY = "texYardInspectionPaddleOCR_v1";
const RAL_3009 = "#5e2028";
const STATUS_VALUES = ["", "OK", "Repair", "Hold", "Reject"];
const LETTER_VALUES = {
  A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19,
  J: 20, K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29,
  S: 30, T: 31, U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38,
};
const DIGIT_SUBSTITUTIONS = {
  O: "0", Q: "0", D: "0", I: "1", L: "1", "|": "1", Z: "2",
  S: "5", G: "6", B: "8",
};

const app = document.querySelector("#app");
app.innerHTML = `
  <main class="app-shell">
    <header class="hero"><h1>Tex Yard Inspection</h1></header>

    <section class="card setup-card">
      <div class="card-head"><h2>Container Range</h2><span class="small">The check digit is calculated automatically.</span></div>
      <div class="grid setup-grid">
        <div class="field"><label for="prefixInput">Four-letter Prefix</label><input id="prefixInput" class="code-input" maxlength="4" placeholder="TEXU" autocomplete="off"></div>
        <div class="field"><label for="startInput">Start Serial Number</label><input id="startInput" class="code-input" inputmode="numeric" maxlength="6" placeholder="100000"></div>
        <div class="field"><label for="endInput">End Serial Number</label><input id="endInput" class="code-input" inputmode="numeric" maxlength="6" placeholder="100500"></div>
        <div class="button-row"><button id="generateBtn" class="btn btn-rust" type="button">Generate List</button><button id="clearAllBtn" class="btn btn-danger" type="button">Clear All</button></div>
      </div>
      <div id="runtime" class="runtime">Page script is starting…</div>
    </section>

    <section class="card">
      <div class="stats">
        <div class="stat"><strong id="statTotal">0</strong><span>Total</span></div>
        <div class="stat"><strong id="statInspected">0</strong><span>Inspected</span></div>
        <div class="stat"><strong id="statBlank">0</strong><span>Uninspected</span></div>
        <div class="stat ok"><strong id="statOK">0</strong><span>OK</span></div>
        <div class="stat repair"><strong id="statRepair">0</strong><span>Repair</span></div>
        <div class="stat hold"><strong id="statHold">0</strong><span>Hold</span></div>
        <div class="stat reject"><strong id="statReject">0</strong><span>Reject</span></div>
      </div>
    </section>

    <section class="card camera-card">
      <div class="card-head"><h2>Camera & PaddleOCR</h2><span id="ocrEngineLabel" class="small">PP-OCRv5 mobile</span></div>
      <div class="toolbar">
        <button id="openCameraBtn" class="btn btn-rust" type="button">Open Continuous Camera</button>
        <label class="file-label btn-primary">Phone Camera<input id="cameraFileInput" type="file" accept="image/*" capture="environment"></label>
        <label class="file-label btn-light">Choose Photo<input id="galleryFileInput" type="file" accept="image/*"></label>
        <button id="preloadBtn" class="btn btn-dark" type="button">Preload PaddleOCR</button>
        <button id="diagnosticsBtn" class="btn btn-light" type="button">OCR Diagnostics</button>
        <div class="mode-group" aria-label="Frame orientation">
          <button id="horizontalBtn" type="button" class="active">Horizontal</button>
          <button id="verticalBtn" type="button">Vertical</button>
        </div>
      </div>
      <div class="manual-grid">
        <input id="manualSerialInput" inputmode="numeric" maxlength="6" placeholder="Enter six-digit serial number">
        <button id="manualFindBtn" class="btn btn-primary" type="button">Find Container</button>
      </div>
      <div id="progressArea" class="progress-area">
        <progress id="ocrProgress" max="100" value="0"></progress>
        <div class="progress-line"><span id="progressText">Ready</span><span id="progressPercent">0%</span></div>
      </div>
    </section>

    <section class="card filter-card">
      <div class="card-head"><h2>Filter</h2><span id="filterCount" class="small">0 containers</span></div>
      <div class="filter-grid">
        <div class="field"><label for="dateFrom">From Date</label><input id="dateFrom" type="date"></div>
        <div class="field"><label for="dateTo">To Date</label><input id="dateTo" type="date"></div>
        <div class="status-pills" id="statusPills">
          <span class="pill"><input id="filterAll" type="checkbox" checked><label for="filterAll">All</label></span>
          <span class="pill"><input id="filterBlank" type="checkbox" checked><label for="filterBlank">Uninspected</label></span>
          <span class="pill ok"><input id="filterOK" type="checkbox" checked><label for="filterOK">OK</label></span>
          <span class="pill repair"><input id="filterRepair" type="checkbox" checked><label for="filterRepair">Repair</label></span>
          <span class="pill hold"><input id="filterHold" type="checkbox" checked><label for="filterHold">Hold</label></span>
          <span class="pill reject"><input id="filterReject" type="checkbox" checked><label for="filterReject">Reject</label></span>
        </div>
        <div class="button-row"><button id="todayBtn" class="btn btn-light" type="button">Today</button><button id="clearFilterBtn" class="btn btn-light" type="button">Reset</button></div>
      </div>
      <div class="table-wrap" style="margin-top:12px">
        <table>
          <thead><tr><th class="center">No.</th><th>Container Number</th><th>Status</th><th>Inspection Date</th><th>Note</th><th>Updated</th></tr></thead>
          <tbody id="filteredBody"><tr><td colspan="6" class="empty">No container list has been generated.</td></tr></tbody>
        </table>
      </div>
    </section>

    <details id="masterDetails" class="master">
      <summary><span class="summary-label">Full Generated Container List</span><span id="masterSummary" class="small">0 containers</span></summary>
      <div class="master-body">
        <div class="button-row" style="margin-bottom:10px">
          <button id="exportCsvBtn" class="btn btn-dark" type="button">Export CSV</button>
          <button id="exportJsonBtn" class="btn btn-light" type="button">Export Backup</button>
          <label class="file-label btn-light">Import Backup<input id="importJsonInput" type="file" accept="application/json,.json"></label>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th class="center">No.</th><th>Container Number</th><th>Status</th><th>Inspection Date</th><th>Note</th></tr></thead>
            <tbody id="masterBody"><tr><td colspan="5" class="empty">No container list has been generated.</td></tr></tbody>
          </table>
        </div>
      </div>
    </details>
  </main>

  <section id="cameraLayer" class="camera-layer" aria-hidden="true">
    <video id="cameraVideo" playsinline muted></video>
    <div class="camera-top">
      <button id="closeCameraBtn" class="round-btn" type="button" aria-label="Close camera">×</button>
      <div class="camera-modes"><button id="cameraHorizontalBtn" class="active" type="button">Horizontal</button><button id="cameraVerticalBtn" type="button">Vertical</button></div>
    </div>
    <div class="camera-shade"><div id="scanFrame" class="scan-frame horizontal"><b>Place the full container number inside the frame</b></div></div>
    <div class="camera-bottom"><div class="camera-note">Three frames are captured for voting.<br>Only the six-digit serial number is used.</div><button id="shutterBtn" class="shutter" type="button" aria-label="Capture"></button><button id="switchCameraBtn" class="round-btn camera-switch" type="button" aria-label="Switch camera">↻</button></div>
    <div id="cameraProcessing" class="camera-processing"><div class="processing-card"><strong id="cameraProcessingTitle">Running PaddleOCR…</strong><progress id="cameraProgress" max="100" value="0"></progress><div id="cameraProgressText" class="small" style="margin-top:7px;color:#fff">Preparing</div></div></div>
  </section>

  <section id="recognitionPanel" class="panel">
    <div class="panel-card">
      <div class="card-head"><h2 id="recognitionTitle">Recognition Result</h2><button id="closeRecognitionBtn" class="btn btn-light" type="button">Close</button></div>
      <div id="recognizedNumber" class="recognized-number">—</div>
      <div id="recognitionMessage" class="small"></div>
      <div id="candidateList" class="candidate-list"></div>
      <div id="recognitionFields">
        <div class="field"><label for="recognitionDate">Inspection Date</label><input id="recognitionDate" type="date"></div>
        <div class="field" style="margin-top:9px"><label for="recognitionNote">Note</label><textarea id="recognitionNote" placeholder="Repair details, hold reason, rejection reason, etc."></textarea></div>
        <div class="status-buttons"><button class="btn btn-ok" data-status="OK" type="button">OK</button><button class="btn btn-repair" data-status="Repair" type="button">Repair</button><button class="btn btn-hold" data-status="Hold" type="button">Hold</button><button class="btn btn-reject" data-status="Reject" type="button">Reject</button></div>
      </div>
      <div class="button-row"><button id="viewLastDiagBtn" class="btn btn-light" type="button">View OCR Details</button><button id="retryBtn" class="btn btn-light" type="button">Capture Again</button></div>
    </div>
  </section>

  <section id="editModal" class="modal">
    <div class="modal-card">
      <div class="card-head"><h2>Edit Container Status</h2><button id="closeEditBtn" class="btn btn-light" type="button">Close</button></div>
      <div id="editNumber" class="recognized-number">—</div>
      <div class="radio-grid">
        <span class="radio-option"><input id="editBlank" name="editStatus" type="radio" value=""><label for="editBlank">Blank</label></span>
        <span class="radio-option"><input id="editOK" name="editStatus" type="radio" value="OK"><label for="editOK" style="color:var(--ok)">OK</label></span>
        <span class="radio-option"><input id="editRepair" name="editStatus" type="radio" value="Repair"><label for="editRepair" style="color:var(--repair)">Repair</label></span>
        <span class="radio-option"><input id="editHold" name="editStatus" type="radio" value="Hold"><label for="editHold" style="color:var(--hold)">Hold</label></span>
        <span class="radio-option"><input id="editReject" name="editStatus" type="radio" value="Reject"><label for="editReject" style="color:var(--reject)">Reject</label></span>
      </div>
      <div class="field"><label for="editDate">Inspection Date</label><input id="editDate" type="date"></div>
      <div class="field" style="margin-top:9px"><label for="editNote">Note</label><textarea id="editNote"></textarea></div>
      <div class="button-row" style="margin-top:12px"><button id="saveEditBtn" class="btn btn-rust" type="button">Save Changes</button><button id="clearStatusBtn" class="btn btn-danger" type="button">Clear Status</button></div>
    </div>
  </section>

  <section id="diagnosticPanel" class="modal">
    <div class="modal-card diagnostic-card">
      <div class="card-head"><div><h2>PaddleOCR Diagnostics</h2><div id="diagVersion" class="small"></div></div><button id="closeDiagnosticsBtn" class="btn btn-light" type="button">Close</button></div>
      <div class="diag-grid">
        <section class="diag-box"><h3>Captured Image</h3><img id="diagImage" class="diag-image" alt="Last OCR input"><div id="diagImageMeta" class="small" style="margin-top:7px">No image</div></section>
        <section class="diag-box"><h3>Engine & Metrics</h3><pre id="diagMetrics" class="diag-pre">No OCR run yet.</pre></section>
      </div>
      <section class="diag-box" style="margin-top:12px"><h3>Detected Text Lines</h3><div id="diagItems" class="diag-items"><div class="empty">No OCR run yet.</div></div></section>
      <div class="diag-grid" style="margin-top:12px">
        <section class="diag-box"><h3>Extracted Digit Streams</h3><pre id="diagDigits" class="diag-pre">No OCR run yet.</pre></section>
        <section class="diag-box"><h3>Serial Number Candidates</h3><pre id="diagCandidates" class="diag-pre">No OCR run yet.</pre></section>
      </div>
      <div class="button-row" style="margin-top:12px"><button id="engineSelfTestBtn" class="btn btn-dark" type="button">Run Built-in OCR Test</button><button id="exportDiagBtn" class="btn btn-light" type="button">Export Diagnostic JSON</button><button id="clearCacheBtn" class="btn btn-danger" type="button">Clear Cache & Reload</button></div>
    </div>
  </section>

  <div id="toast" class="toast"></div>
`;

const $ = (id) => document.getElementById(id);
const state = {
  config: null,
  items: [],
  orientation: "horizontal",
  stream: null,
  facing: "environment",
  ocr: null,
  ocrPromise: null,
  ocrSummary: null,
  busy: false,
  currentRaw: "",
  editingRaw: "",
  cameraWasOpen: false,
  lastDiagnostic: null,
  burstFrames: 3,
};

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[char]);
}
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function displayDate(value) { return String(value || "").replaceAll("-", "/"); }
function toast(message, duration = 2600) {
  const node = $("toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), duration);
}
function setRuntime(message, type = "") {
  const node = $("runtime");
  node.className = `runtime ${type}`.trim();
  node.innerHTML = message;
}
function setProgress(percent, message) {
  const value = Math.max(0, Math.min(100, Number(percent) || 0));
  $("progressArea").classList.add("show");
  $("ocrProgress").value = value;
  $("progressPercent").textContent = `${Math.round(value)}%`;
  $("progressText").textContent = message || "Working";
  $("cameraProgress").value = value;
  $("cameraProgressText").textContent = `${Math.round(value)}% · ${message || "Working"}`;
}
function hideProgressSoon() {
  setTimeout(() => $("progressArea").classList.remove("show"), 700);
}

function checkDigit(firstTen) {
  let sum = 0;
  for (let i = 0; i < 10; i += 1) {
    const char = firstTen[i];
    const value = i < 4 ? LETTER_VALUES[char] : Number(char);
    if (value === undefined || Number.isNaN(value)) return null;
    sum += value * (2 ** i);
  }
  const remainder = sum % 11;
  return remainder === 10 ? 0 : remainder;
}
function cleanRaw(value) { return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
function formatRaw(raw) {
  const value = cleanRaw(raw);
  if (value.length <= 4) return value;
  if (value.length <= 10) return `${value.slice(0, 4)} ${value.slice(4)}`;
  return `${value.slice(0, 4)} ${value.slice(4, 10)} ${value.slice(10, 11)}`;
}
function itemMap() { return new Map(state.items.map((item) => [item.raw, item])); }
function serialMap() { return new Map(state.items.map((item) => [item.serial, item])); }

function saveState() {
  const payload = { config: state.config, items: state.items, orientation: state.orientation };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); }
  catch (error) { setRuntime(`<strong>Local save failed.</strong><br>${escapeHTML(error.message)}`, "bad"); }
}
function loadState() {
  try {
    const payload = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!payload) return;
    state.config = payload.config || null;
    state.items = Array.isArray(payload.items) ? payload.items : [];
    state.orientation = payload.orientation === "vertical" ? "vertical" : "horizontal";
  } catch {
    state.config = null;
    state.items = [];
  }
}

function normalizeSetupInputs() {
  $("prefixInput").value = $("prefixInput").value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
  $("startInput").value = $("startInput").value.replace(/\D/g, "").slice(0, 6);
  $("endInput").value = $("endInput").value.replace(/\D/g, "").slice(0, 6);
}
function generateList() {
  normalizeSetupInputs();
  const prefix = $("prefixInput").value;
  const startString = $("startInput").value;
  const endString = $("endInput").value;
  if (!/^[A-Z]{4}$/.test(prefix)) { toast("Enter exactly four letters."); $("prefixInput").focus(); return; }
  if (!/^\d{6}$/.test(startString) || !/^\d{6}$/.test(endString)) { toast("Start and end serial numbers must each contain six digits."); return; }
  const start = Number(startString);
  const end = Number(endString);
  if (end < start) { toast("The end serial number cannot be lower than the start serial number."); return; }
  const count = end - start + 1;
  if (count > 20000) { toast("A single range is limited to 20,000 containers."); return; }
  const previous = itemMap();
  const items = [];
  for (let number = start; number <= end; number += 1) {
    const serial = String(number).padStart(6, "0");
    const firstTen = `${prefix}${serial}`;
    const raw = `${firstTen}${checkDigit(firstTen)}`;
    const old = previous.get(raw);
    items.push(old ? { ...old, serial } : { raw, serial, status: "", date: "", note: "", updatedAt: "", source: "" });
  }
  state.config = { prefix, start: startString, end: endString };
  state.items = items;
  saveState();
  renderAll();
  setRuntime(`<strong>Container list generated.</strong><br>${escapeHTML(formatRaw(items[0].raw))} to ${escapeHTML(formatRaw(items.at(-1).raw))}`, "good");
  toast(`${count} containers generated.`);
}
function clearAll() {
  if (!state.items.length) { toast("There is no data to clear."); return; }
  if (!confirm("Clear the complete container list, statuses, dates, and notes? This cannot be undone.")) return;
  state.config = null;
  state.items = [];
  $("prefixInput").value = "";
  $("startInput").value = "";
  $("endInput").value = "";
  saveState();
  renderAll();
  toast("All data cleared.");
}

function statusBadge(status) { return status ? `<span class="status-badge ${status}">${status}</span>` : ""; }
function renderStats() {
  const counts = { OK: 0, Repair: 0, Hold: 0, Reject: 0 };
  state.items.forEach((item) => { if (counts[item.status] !== undefined) counts[item.status] += 1; });
  const inspected = counts.OK + counts.Repair + counts.Hold + counts.Reject;
  $("statTotal").textContent = state.items.length;
  $("statInspected").textContent = inspected;
  $("statBlank").textContent = state.items.length - inspected;
  $("statOK").textContent = counts.OK;
  $("statRepair").textContent = counts.Repair;
  $("statHold").textContent = counts.Hold;
  $("statReject").textContent = counts.Reject;
  $("masterSummary").textContent = `${state.items.length} total · ${inspected} inspected · ${state.items.length - inspected} uninspected`;
}
function renderMaster() {
  const body = $("masterBody");
  if (!state.items.length) { body.innerHTML = '<tr><td colspan="5" class="empty">No container list has been generated.</td></tr>'; return; }
  body.innerHTML = state.items.map((item, index) => `
    <tr class="${item.status ? `row-${item.status}` : ""}">
      <td class="center">${index + 1}</td>
      <td><button class="container-link" data-edit="${item.raw}" type="button">${formatRaw(item.raw)}</button></td>
      <td>${statusBadge(item.status)}</td><td>${displayDate(item.date)}</td><td>${escapeHTML(item.note)}</td>
    </tr>`).join("");
}
function selectedStatuses() {
  const values = [];
  if ($("filterBlank").checked) values.push("");
  ["OK", "Repair", "Hold", "Reject"].forEach((status) => { if ($(`filter${status}`).checked) values.push(status); });
  return values;
}
function renderFiltered() {
  const from = $("dateFrom").value;
  const to = $("dateTo").value;
  const statuses = selectedStatuses();
  const list = state.items.filter((item) => {
    if (!statuses.includes(item.status)) return false;
    if (item.status === "") return !from && !to;
    if (from && item.date < from) return false;
    if (to && item.date > to) return false;
    return true;
  });
  $("filterCount").textContent = `${list.length} container${list.length === 1 ? "" : "s"}`;
  const body = $("filteredBody");
  if (!state.items.length) { body.innerHTML = '<tr><td colspan="6" class="empty">No container list has been generated.</td></tr>'; return; }
  if (!list.length) { body.innerHTML = '<tr><td colspan="6" class="empty">No containers match the current filter.</td></tr>'; return; }
  body.innerHTML = list.map((item, index) => `
    <tr class="${item.status ? `row-${item.status}` : ""}">
      <td class="center">${index + 1}</td>
      <td><button class="container-link" data-edit="${item.raw}" type="button">${formatRaw(item.raw)}</button></td>
      <td>${statusBadge(item.status)}</td><td>${displayDate(item.date)}</td><td>${escapeHTML(item.note)}</td><td>${escapeHTML(item.updatedAt)}</td>
    </tr>`).join("");
}
function renderOrientation() {
  const vertical = state.orientation === "vertical";
  $("horizontalBtn").classList.toggle("active", !vertical);
  $("verticalBtn").classList.toggle("active", vertical);
  $("cameraHorizontalBtn").classList.toggle("active", !vertical);
  $("cameraVerticalBtn").classList.toggle("active", vertical);
  $("scanFrame").className = `scan-frame ${state.orientation}`;
}
function renderAll() { renderStats(); renderMaster(); renderFiltered(); renderOrientation(); }
function setOrientation(value) { state.orientation = value === "vertical" ? "vertical" : "horizontal"; saveState(); renderOrientation(); }

function setAllFilters(value) {
  ["Blank", "OK", "Repair", "Hold", "Reject"].forEach((name) => { $(`filter${name}`).checked = value; });
  $("filterAll").checked = value;
  renderFiltered();
}
function individualFilterChanged() {
  const boxes = ["Blank", "OK", "Repair", "Hold", "Reject"].map((name) => $(`filter${name}`));
  if (!boxes.some((box) => box.checked)) boxes.forEach((box) => { box.checked = true; });
  $("filterAll").checked = boxes.every((box) => box.checked);
  renderFiltered();
}
function resetFilter() { $("dateFrom").value = ""; $("dateTo").value = ""; setAllFilters(true); }
function filterToday() { const value = today(); $("dateFrom").value = value; $("dateTo").value = value; $("filterBlank").checked = false; individualFilterChanged(); }

function openEdit(raw) {
  const item = itemMap().get(raw);
  if (!item) return;
  state.editingRaw = raw;
  $("editNumber").textContent = formatRaw(raw);
  const radio = document.querySelector(`input[name="editStatus"][value="${item.status}"]`) || $("editBlank");
  radio.checked = true;
  $("editDate").value = item.date || "";
  $("editNote").value = item.note || "";
  $("editModal").classList.add("show");
}
function closeEdit() { $("editModal").classList.remove("show"); state.editingRaw = ""; }
function saveEdit(forceBlank = false) {
  const item = itemMap().get(state.editingRaw);
  if (!item) return;
  const status = forceBlank ? "" : (document.querySelector('input[name="editStatus"]:checked')?.value || "");
  item.status = status;
  item.date = status ? ($("editDate").value || today()) : "";
  item.note = status ? $("editNote").value.trim() : "";
  item.updatedAt = timestamp();
  item.source = item.source || "Manual edit";
  saveState(); renderAll(); closeEdit(); toast(status ? `Status changed to ${status}.` : "Status cleared.");
}

function siteAsset(path) { return new URL(path, document.baseURI).href; }
async function createPaddleEngine(simd) {
  return PaddleOCR.create({
    textDetectionModelName: "PP-OCRv5_mobile_det",
    textDetectionModelAsset: { url: siteAsset("./models/PP-OCRv5_mobile_det_onnx_infer.tar") },
    textRecognitionModelName: "PP-OCRv5_mobile_rec",
    textRecognitionModelAsset: { url: siteAsset("./models/PP-OCRv5_mobile_rec_onnx_infer.tar") },
    textDetectionBatchSize: 1,
    textRecognitionBatchSize: 8,
    worker: false,
    ortOptions: {
      backend: "wasm",
      wasmPaths: siteAsset("./ort/"),
      numThreads: 1,
      simd,
    },
  });
}
async function ensureOCR() {
  if (state.ocr) return state.ocr;
  if (state.ocrPromise) return state.ocrPromise;
  state.ocrPromise = (async () => {
    setProgress(3, "Loading PaddleOCR.js");
    setRuntime("<strong>Loading PaddleOCR.</strong><br>The first initialization can take time because the detection and recognition models are loaded into memory.", "warn");
    let engine;
    try {
      setProgress(15, "Loading PP-OCRv5 models");
      engine = await createPaddleEngine(true);
    } catch (simdError) {
      console.warn("SIMD initialization failed; retrying without SIMD.", simdError);
      setProgress(30, "Retrying with compatible WebAssembly");
      engine = await createPaddleEngine(false);
    }
    state.ocr = engine;
    if (typeof engine.getInitializationSummary === "function") {
      const summary = engine.getInitializationSummary();
      state.ocrSummary = summary instanceof Promise ? await summary : summary;
    } else state.ocrSummary = null;
    setProgress(100, "PaddleOCR is ready");
    setRuntime("<strong>PaddleOCR is ready.</strong><br>PP-OCRv5 detection and recognition models are loaded from this GitHub Pages site.", "good");
    hideProgressSoon();
    return engine;
  })().catch((error) => {
    state.ocrPromise = null;
    setRuntime(`<strong>PaddleOCR initialization failed.</strong><br>${escapeHTML(error.message || error)}`, "bad");
    throw error;
  });
  return state.ocrPromise;
}

function normalizeDigitLike(value) {
  return String(value || "").toUpperCase().split("").map((char) => {
    if (/\d/.test(char)) return char;
    return DIGIT_SUBSTITUTIONS[char] ?? " ";
  }).join("");
}
function lineOrder(items, orientation = "horizontal") {
  const getCenter = (item) => {
    const points = item.poly || [];
    if (!points.length) return { x: 0, y: 0 };
    const xs = points.map((p) => Number(p[0] ?? p.x ?? 0));
    const ys = points.map((p) => Number(p[1] ?? p.y ?? 0));
    return { x: xs.reduce((a, b) => a + b, 0) / xs.length, y: ys.reduce((a, b) => a + b, 0) / ys.length };
  };
  return [...items].sort((a, b) => {
    const pa = getCenter(a); const pb = getCenter(b);
    return orientation === "vertical" ? pa.y - pb.y : (Math.abs(pa.y - pb.y) < 30 ? pa.x - pb.x : pa.y - pb.y);
  });
}
function extractSerialEvidence(results, sourceLabels) {
  const rangeStart = Number(state.config?.start || 0);
  const rangeEnd = Number(state.config?.end || -1);
  const evidence = new Map();
  const allLines = [];
  const digitStreams = [];
  const addCandidate = (serial, points, reason, frameIndex, score, rawText) => {
    const number = Number(serial);
    if (!/^\d{6}$/.test(serial) || number < rangeStart || number > rangeEnd) return;
    const current = evidence.get(serial) || { serial, points: 0, votes: new Set(), bestScore: 0, reasons: [], rawTexts: [] };
    current.points += points;
    current.votes.add(frameIndex);
    current.bestScore = Math.max(current.bestScore, Number(score || 0));
    current.reasons.push(reason);
    if (rawText && !current.rawTexts.includes(rawText)) current.rawTexts.push(rawText);
    evidence.set(serial, current);
  };

  results.forEach((result, frameIndex) => {
    const items = lineOrder(result.items || [], state.orientation);
    const frameTexts = [];
    items.forEach((item, itemIndex) => {
      const text = String(item.text || "");
      const score = Number(item.score || 0);
      const normalized = normalizeDigitLike(text);
      frameTexts.push(text);
      allLines.push({ frameIndex, source: sourceLabels[frameIndex] || `Image ${frameIndex + 1}`, itemIndex, text, score, poly: item.poly || [] });
      const runs = normalized.match(/\d{5,12}/g) || [];
      runs.forEach((run) => {
        digitStreams.push({ frameIndex, source: sourceLabels[frameIndex] || `Image ${frameIndex + 1}`, original: text, normalized: run, score });
        if (run.length === 6) addCandidate(run, 7 + score * 4, "exact six-digit line", frameIndex, score, text);
        for (let offset = 0; offset <= run.length - 6; offset += 1) {
          const window = run.slice(offset, offset + 6);
          const isLeading = offset === 0;
          addCandidate(window, (isLeading ? 4.5 : 3.5) + score * 3, `six-digit window ${offset + 1}`, frameIndex, score, text);
        }
      });
    });
    const joined = frameTexts.join(" ");
    const joinedDigits = normalizeDigitLike(joined).replace(/\s+/g, "");
    if (joinedDigits) {
      digitStreams.push({ frameIndex, source: sourceLabels[frameIndex] || `Image ${frameIndex + 1}`, original: joined, normalized: joinedDigits, score: 0 });
      for (let offset = 0; offset <= joinedDigits.length - 6; offset += 1) {
        addCandidate(joinedDigits.slice(offset, offset + 6), offset === 0 ? 4 : 2.5, "combined text window", frameIndex, 0, joined);
      }
    }
  });

  const candidates = [...evidence.values()].map((candidate) => ({
    ...candidate,
    voteCount: candidate.votes.size,
    votes: [...candidate.votes],
    points: candidate.points + candidate.votes.size * 8,
  })).sort((a, b) => b.points - a.points || b.voteCount - a.voteCount || b.bestScore - a.bestScore);
  return { candidates, allLines, digitStreams };
}
function serialToRaw(serial) {
  const firstTen = `${state.config.prefix}${serial}`;
  return `${firstTen}${checkDigit(firstTen)}`;
}
function chooseRecognitionOutcome(extraction) {
  const [top, second] = extraction.candidates;
  if (!top) return { type: "none", candidates: [] };
  const scoreGap = second ? top.points - second.points : 999;
  if (top.voteCount >= 2 && scoreGap >= 4) return { type: "auto", raw: serialToRaw(top.serial), candidates: extraction.candidates };
  if (top.bestScore >= 0.78 && scoreGap >= 6) return { type: "auto", raw: serialToRaw(top.serial), candidates: extraction.candidates };
  if (!second && top.points >= 8) return { type: "auto", raw: serialToRaw(top.serial), candidates: extraction.candidates };
  return { type: "confirm", candidates: extraction.candidates.slice(0, 5) };
}

function canvasPreview(canvas, maxSide = 1100) {
  const scale = Math.min(1, maxSide / Math.max(canvas.width, canvas.height));
  const preview = document.createElement("canvas");
  preview.width = Math.max(1, Math.round(canvas.width * scale));
  preview.height = Math.max(1, Math.round(canvas.height * scale));
  preview.getContext("2d", { alpha: false }).drawImage(canvas, 0, 0, preview.width, preview.height);
  return preview.toDataURL("image/jpeg", .88);
}
function rotateCanvas(source, clockwise = true) {
  const canvas = document.createElement("canvas");
  canvas.width = source.height;
  canvas.height = source.width;
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((clockwise ? 1 : -1) * Math.PI / 2);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  return canvas;
}
function enhanceCanvas(source, invert = false) {
  const canvas = document.createElement("canvas");
  canvas.width = source.width; canvas.height = source.height;
  const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
  ctx.drawImage(source, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    let gray = .299 * data[i] + .587 * data[i + 1] + .114 * data[i + 2];
    gray = Math.max(0, Math.min(255, (gray - 128) * 1.45 + 128));
    if (invert) gray = 255 - gray;
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}
function sharpnessScore(canvas) {
  const sample = document.createElement("canvas");
  const width = Math.min(520, canvas.width);
  sample.width = width;
  sample.height = Math.max(70, Math.round(width * canvas.height / canvas.width));
  const ctx = sample.getContext("2d", { alpha: false, willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, sample.width, sample.height);
  const data = ctx.getImageData(0, 0, sample.width, sample.height).data;
  let sum = 0; let sumSquared = 0; let count = 0;
  for (let y = 1; y < sample.height - 1; y += 2) {
    for (let x = 1; x < sample.width - 1; x += 2) {
      const index = (y * sample.width + x) * 4;
      const left = data[index - 4]; const right = data[index + 4];
      const up = data[index - sample.width * 4]; const down = data[index + sample.width * 4];
      const edge = Math.abs(right - left) + Math.abs(down - up);
      sum += edge; sumSquared += edge * edge; count += 1;
    }
  }
  if (!count) return 0;
  const mean = sum / count;
  return sumSquared / count - mean * mean;
}

async function runPaddleOCR(canvases, labels, stageLabel) {
  const engine = await ensureOCR();
  setProgress(48, stageLabel || "Detecting text");
  const started = performance.now();
  const results = await engine.predict(canvases, {
    textDetLimitSideLen: 1280,
    textDetLimitType: "max",
    textDetMaxSideLimit: 2200,
    textDetThresh: 0.16,
    textDetBoxThresh: 0.28,
    textDetUnclipRatio: 1.75,
    textRecScoreThresh: 0.08,
  });
  const totalMs = Math.round(performance.now() - started);
  return { results, labels, totalMs };
}
async function recognizeCanvases(inputCanvases, sourceName) {
  if (state.busy) { toast("The previous image is still being processed."); return; }
  if (!state.items.length) { toast("Generate a container range first."); return; }
  state.busy = true;
  state.cameraWasOpen = $("cameraLayer").classList.contains("open");
  $("cameraProcessing").classList.add("show");
  $("cameraProcessingTitle").textContent = "Running PaddleOCR…";
  setProgress(2, "Preparing images");
  try {
    const sorted = [...inputCanvases].sort((a, b) => sharpnessScore(b) - sharpnessScore(a));
    const originals = [];
    const labels = [];
    sorted.forEach((canvas, index) => {
      if (state.orientation === "vertical") {
        originals.push(rotateCanvas(canvas, true), rotateCanvas(canvas, false));
        labels.push(`Frame ${index + 1} · clockwise`, `Frame ${index + 1} · counter-clockwise`);
      } else {
        originals.push(canvas);
        labels.push(`Frame ${index + 1}`);
      }
    });
    const firstPass = await runPaddleOCR(originals, labels, "PaddleOCR text detection and recognition");
    let extraction = extractSerialEvidence(firstPass.results, firstPass.labels);
    let allResults = [...firstPass.results];
    let allLabels = [...firstPass.labels];
    let totalMs = firstPass.totalMs;

    if (!extraction.candidates.length) {
      setProgress(72, "Trying enhanced image variants");
      const best = originals[0];
      const variants = [enhanceCanvas(best, false), enhanceCanvas(best, true)];
      const variantLabels = ["Enhanced grayscale", "Inverted grayscale"];
      const secondPass = await runPaddleOCR(variants, variantLabels, "Retrying enhanced images");
      allResults.push(...secondPass.results);
      allLabels.push(...secondPass.labels);
      totalMs += secondPass.totalMs;
      extraction = extractSerialEvidence(allResults, allLabels);
    }

    const bestCanvas = originals[0];
    state.lastDiagnostic = {
      version: APP_VERSION,
      time: timestamp(),
      sourceName,
      orientation: state.orientation,
      image: { width: bestCanvas.width, height: bestCanvas.height, preview: canvasPreview(bestCanvas) },
      labels: allLabels,
      results: allResults.map((result, index) => ({
        source: allLabels[index], image: result.image, items: result.items || [], metrics: result.metrics || null, runtime: result.runtime || null,
      })),
      extraction,
      totalMs,
      initialization: state.ocrSummary,
    };
    setProgress(100, "Recognition complete");
    $("cameraProcessing").classList.remove("show");
    releaseFileInputs();
    const outcome = chooseRecognitionOutcome(extraction);
    if (outcome.type === "auto") showRecognition(outcome.raw, sourceName);
    else if (outcome.type === "confirm") showCandidates(outcome.candidates, sourceName, "Select the correct six-digit serial number.");
    else {
      showCandidates([], sourceName, "No serial number inside the generated range was found. Review OCR details or capture again.");
      openDiagnostics();
    }
  } catch (error) {
    $("cameraProcessing").classList.remove("show");
    releaseFileInputs();
    setRuntime(`<strong>OCR failed.</strong><br>${escapeHTML(error.message || error)}`, "bad");
    toast(error.message || "OCR failed", 4200);
    state.lastDiagnostic = { version: APP_VERSION, time: timestamp(), sourceName, error: String(error.message || error), initialization: state.ocrSummary };
  } finally {
    state.busy = false;
    hideProgressSoon();
  }
}
function releaseFileInputs() { $("cameraFileInput").value = ""; $("galleryFileInput").value = ""; }

function showRecognition(raw, sourceName) {
  const item = itemMap().get(raw);
  if (!item) { toast("The recognized serial number is outside the generated range."); return; }
  state.currentRaw = raw;
  $("recognitionTitle").textContent = item.status ? "Existing Inspection Record" : "Select Inspection Status";
  $("recognizedNumber").textContent = formatRaw(raw);
  $("recognitionMessage").textContent = item.status ? `Current status: ${item.status} on ${displayDate(item.date)}.` : "The prefix and check digit were generated automatically from the recognized six-digit serial number.";
  $("candidateList").innerHTML = "";
  $("recognitionFields").style.display = "block";
  $("recognitionDate").value = item.date || today();
  $("recognitionNote").value = item.note || "";
  $("recognitionPanel").dataset.source = sourceName || "PaddleOCR";
  $("recognitionPanel").classList.add("show");
}
function showCandidates(candidates, sourceName, message) {
  state.currentRaw = "";
  $("recognitionTitle").textContent = "Manual Confirmation Required";
  $("recognizedNumber").textContent = candidates.length ? "Select a candidate" : "Not recognized";
  $("recognitionMessage").textContent = message;
  $("recognitionFields").style.display = "none";
  $("candidateList").innerHTML = candidates.map((candidate) => {
    const raw = serialToRaw(candidate.serial);
    return `<button class="btn candidate-button" data-candidate="${raw}" type="button">${formatRaw(raw)} · votes ${candidate.voteCount} · score ${candidate.points.toFixed(1)}</button>`;
  }).join("");
  $("recognitionPanel").dataset.source = sourceName || "PaddleOCR";
  $("recognitionPanel").classList.add("show");
}
function closeRecognition() { $("recognitionPanel").classList.remove("show"); state.currentRaw = ""; $("candidateList").innerHTML = ""; }
function commitRecognition(status) {
  const item = itemMap().get(state.currentRaw);
  if (!item || !["OK", "Repair", "Hold", "Reject"].includes(status)) return;
  item.status = status;
  item.date = $("recognitionDate").value || today();
  item.note = $("recognitionNote").value.trim();
  item.updatedAt = timestamp();
  item.source = $("recognitionPanel").dataset.source || "PaddleOCR";
  saveState(); renderAll(); closeRecognition(); toast(`${formatRaw(item.raw)} saved as ${status}.`);
}
function manualFind() {
  if (!state.items.length) { toast("Generate a container range first."); return; }
  const serial = $("manualSerialInput").value.replace(/\D/g, "").slice(0, 6);
  if (!/^\d{6}$/.test(serial)) { toast("Enter a six-digit serial number."); return; }
  const item = serialMap().get(serial);
  if (!item) { toast("The serial number is outside the generated range."); return; }
  $("manualSerialInput").value = "";
  showRecognition(item.raw, "Manual entry");
}

async function startCamera() {
  if (state.stream) state.stream.getTracks().forEach((track) => track.stop());
  state.stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: state.facing }, width: { ideal: 3840 }, height: { ideal: 2160 } },
  });
  const video = $("cameraVideo");
  video.srcObject = state.stream;
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Camera start timed out.")), 12000);
    video.onloadedmetadata = () => { clearTimeout(timeout); video.play().then(resolve).catch(reject); };
  });
}
async function openCamera() {
  if (!state.items.length) { toast("Generate a container range first."); return; }
  if (!window.isSecureContext) { alert("The continuous camera requires an HTTPS address. Open the GitHub Pages URL in Safari."); return; }
  if (!navigator.mediaDevices?.getUserMedia) { toast("This browser does not support the live camera API."); return; }
  $("cameraLayer").classList.add("open");
  $("cameraLayer").setAttribute("aria-hidden", "false");
  document.body.classList.add("camera-open");
  try {
    await startCamera();
    setRuntime("<strong>Continuous camera is open.</strong><br>Capture the complete container number. PaddleOCR uses only the six-digit serial number.", "good");
    ensureOCR().catch(() => {});
  } catch (error) {
    closeCamera();
    setRuntime(`<strong>Camera failed.</strong><br>${escapeHTML(error.message || error)}`, "bad");
  }
}
function closeCamera() {
  if (state.stream) state.stream.getTracks().forEach((track) => track.stop());
  state.stream = null;
  $("cameraVideo").srcObject = null;
  $("cameraLayer").classList.remove("open");
  $("cameraLayer").setAttribute("aria-hidden", "true");
  $("cameraProcessing").classList.remove("show");
  document.body.classList.remove("camera-open");
}
function cropVideoFrame() {
  const video = $("cameraVideo");
  const videoRect = video.getBoundingClientRect();
  const frameRect = $("scanFrame").getBoundingClientRect();
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  if (!sourceWidth || !sourceHeight) throw new Error("The camera is not ready.");
  const scale = Math.max(videoRect.width / sourceWidth, videoRect.height / sourceHeight);
  const renderedWidth = sourceWidth * scale;
  const renderedHeight = sourceHeight * scale;
  const offsetX = (renderedWidth - videoRect.width) / 2;
  const offsetY = (renderedHeight - videoRect.height) / 2;
  let sx = (frameRect.left - videoRect.left + offsetX) / scale;
  let sy = (frameRect.top - videoRect.top + offsetY) / scale;
  let sw = frameRect.width / scale;
  let sh = frameRect.height / scale;
  const marginX = sw * .06;
  const marginY = sh * .10;
  sx -= marginX; sy -= marginY; sw += marginX * 2; sh += marginY * 2;
  sx = Math.max(0, Math.min(sourceWidth - 1, sx));
  sy = Math.max(0, Math.min(sourceHeight - 1, sy));
  sw = Math.max(1, Math.min(sourceWidth - sx, sw));
  sh = Math.max(1, Math.min(sourceHeight - sy, sh));
  const canvas = document.createElement("canvas");
  const targetLongSide = Math.min(2600, Math.max(1600, Math.round(Math.max(sw, sh))));
  if (state.orientation === "vertical") {
    canvas.height = targetLongSide;
    canvas.width = Math.max(320, Math.round(targetLongSide * sw / sh));
  } else {
    canvas.width = targetLongSide;
    canvas.height = Math.max(320, Math.round(targetLongSide * sh / sw));
  }
  canvas.getContext("2d", { alpha: false }).drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}
function wait(milliseconds) { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }
async function captureBurst() {
  if (state.busy) { toast("The previous capture is still processing."); return; }
  try {
    const frames = [];
    for (let index = 0; index < state.burstFrames; index += 1) {
      frames.push(cropVideoFrame());
      if (index < state.burstFrames - 1) await wait(160);
    }
    await recognizeCanvases(frames, "Continuous camera");
  } catch (error) { toast(error.message || "Capture failed"); }
}
async function switchCamera() { state.facing = state.facing === "environment" ? "user" : "environment"; try { await startCamera(); } catch (error) { toast(error.message || "Camera switch failed"); } }
function cropSelectedImage(image) {
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const longSide = Math.min(2600, Math.max(sourceWidth, sourceHeight));
  const scale = Math.min(1, longSide / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(320, Math.round(sourceWidth * scale));
  canvas.height = Math.max(320, Math.round(sourceHeight * scale));
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}
function readImageFile(file, sourceName) {
  if (!file) return;
  if (!state.items.length) { toast("Generate a container range first."); releaseFileInputs(); return; }
  const reader = new FileReader();
  reader.onerror = () => { toast("The photo could not be read."); releaseFileInputs(); };
  reader.onload = () => {
    const image = new Image();
    image.onload = () => { const canvas = cropSelectedImage(image); image.src = ""; recognizeCanvases([canvas], sourceName); };
    image.onerror = () => { toast("This image format is not supported. JPEG or PNG is recommended."); releaseFileInputs(); };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function openDiagnostics() {
  $("diagVersion").textContent = `Version ${APP_VERSION} · PaddleOCR.js 0.4.2 · PP-OCRv5 mobile`;
  renderDiagnostics();
  $("diagnosticPanel").classList.add("show");
}
function closeDiagnostics() { $("diagnosticPanel").classList.remove("show"); }
function renderDiagnostics() {
  const diag = state.lastDiagnostic;
  if (!diag) {
    $("diagImage").removeAttribute("src");
    $("diagImageMeta").textContent = "No OCR image has been processed.";
    $("diagMetrics").textContent = JSON.stringify({ version: APP_VERSION, engineReady: Boolean(state.ocr), initialization: state.ocrSummary }, null, 2);
    $("diagItems").innerHTML = '<div class="empty">No OCR run yet.</div>';
    $("diagDigits").textContent = "No OCR run yet.";
    $("diagCandidates").textContent = "No OCR run yet.";
    return;
  }
  if (diag.image?.preview) $("diagImage").src = diag.image.preview; else $("diagImage").removeAttribute("src");
  $("diagImageMeta").textContent = diag.image ? `${diag.image.width} × ${diag.image.height} · ${diag.sourceName} · ${diag.orientation}` : "No image";
  $("diagMetrics").textContent = JSON.stringify({ version: diag.version, time: diag.time, totalMs: diag.totalMs, initialization: diag.initialization, runs: (diag.results || []).map((result) => ({ source: result.source, metrics: result.metrics, runtime: result.runtime, image: result.image })) , error: diag.error }, null, 2);
  const lines = diag.extraction?.allLines || [];
  $("diagItems").innerHTML = lines.length ? lines.map((line) => `<div class="diag-item"><strong>${escapeHTML(line.source)}</strong> · confidence ${(line.score * 100).toFixed(1)}%<br><span class="mono">${escapeHTML(line.text || "(blank)")}</span></div>`).join("") : '<div class="empty">PaddleOCR returned no text lines.</div>';
  $("diagDigits").textContent = JSON.stringify(diag.extraction?.digitStreams || [], null, 2);
  $("diagCandidates").textContent = JSON.stringify((diag.extraction?.candidates || []).map((candidate) => ({ serial: candidate.serial, fullContainerNumber: formatRaw(serialToRaw(candidate.serial)), voteCount: candidate.voteCount, points: Number(candidate.points.toFixed(2)), bestTextScore: candidate.bestScore, reasons: candidate.reasons, rawTexts: candidate.rawTexts })), null, 2);
}
function createSelfTestCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 1800; canvas.height = 420;
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = RAL_3009;
  ctx.font = "900 190px Arial, sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const serial = state.config?.start || "100001";
  ctx.fillText(`${state.config?.prefix || "TEXU"} ${serial} ${checkDigit(`${state.config?.prefix || "TEXU"}${serial}`)}`, canvas.width / 2, canvas.height / 2);
  return canvas;
}
async function runSelfTest() {
  if (!state.items.length) { toast("Generate a range first so the test serial can be matched."); return; }
  closeDiagnostics();
  await recognizeCanvases([createSelfTestCanvas()], "Built-in test card");
  openDiagnostics();
}
function exportDiagnostic() {
  if (!state.lastDiagnostic) { toast("No diagnostic data is available."); return; }
  const copy = structuredClone(state.lastDiagnostic);
  if (copy.image) delete copy.image.preview;
  downloadBlob(JSON.stringify(copy, null, 2), `Tex_Yard_OCR_Diagnostic_${Date.now()}.json`, "application/json;charset=utf-8");
}
async function clearCacheAndReload() {
  try {
    if ("serviceWorker" in navigator) { const registrations = await navigator.serviceWorker.getRegistrations(); await Promise.all(registrations.map((registration) => registration.unregister())); }
    if ("caches" in window) { const keys = await caches.keys(); await Promise.all(keys.map((key) => caches.delete(key))); }
  } catch {}
  const url = new URL(location.href); url.searchParams.set("v", `${APP_VERSION}-${Date.now()}`); location.replace(url);
}

function downloadBlob(content, fileName, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = fileName; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}
function csvCell(value) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function exportCSV() {
  if (!state.items.length) { toast("There is no data to export."); return; }
  const rows = [["No.", "Container Number", "Prefix", "Serial Number", "Check Digit", "Status", "Inspection Date", "Note", "Updated", "Source"]];
  state.items.forEach((item, index) => rows.push([index + 1, formatRaw(item.raw), item.raw.slice(0, 4), item.serial, item.raw.at(-1), item.status, displayDate(item.date), item.note, item.updatedAt, item.source]));
  const csv = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  downloadBlob(csv, `Tex_Yard_Inspection_${state.config?.prefix || "Containers"}_${today()}.csv`, "text/csv;charset=utf-8");
}
function exportBackup() {
  if (!state.items.length) { toast("There is no data to export."); return; }
  downloadBlob(JSON.stringify({ app: "Tex Yard Inspection", version: APP_VERSION, exportedAt: timestamp(), config: state.config, items: state.items, orientation: state.orientation }, null, 2), `Tex_Yard_Inspection_Backup_${Date.now()}.json`, "application/json;charset=utf-8");
}
function importBackup(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data.config || !Array.isArray(data.items)) throw new Error("Invalid backup format.");
      state.config = data.config; state.items = data.items; state.orientation = data.orientation === "vertical" ? "vertical" : "horizontal";
      $("prefixInput").value = state.config.prefix || ""; $("startInput").value = state.config.start || ""; $("endInput").value = state.config.end || "";
      saveState(); renderAll(); toast("Backup imported.");
    } catch (error) { toast(error.message || "Backup import failed."); }
    $("importJsonInput").value = "";
  };
  reader.readAsText(file);
}

function registerEvents() {
  [$("prefixInput"), $("startInput"), $("endInput")].forEach((input) => input.addEventListener("input", normalizeSetupInputs));
  $("generateBtn").addEventListener("click", generateList);
  $("clearAllBtn").addEventListener("click", clearAll);
  $("horizontalBtn").addEventListener("click", () => setOrientation("horizontal"));
  $("verticalBtn").addEventListener("click", () => setOrientation("vertical"));
  $("cameraHorizontalBtn").addEventListener("click", () => setOrientation("horizontal"));
  $("cameraVerticalBtn").addEventListener("click", () => setOrientation("vertical"));
  $("openCameraBtn").addEventListener("click", openCamera);
  $("closeCameraBtn").addEventListener("click", closeCamera);
  $("switchCameraBtn").addEventListener("click", switchCamera);
  $("shutterBtn").addEventListener("click", captureBurst);
  $("preloadBtn").addEventListener("click", () => ensureOCR().catch((error) => toast(error.message || "PaddleOCR failed", 4200)));
  $("diagnosticsBtn").addEventListener("click", openDiagnostics);
  $("cameraFileInput").addEventListener("change", (event) => readImageFile(event.target.files?.[0], "Phone camera"));
  $("galleryFileInput").addEventListener("change", (event) => readImageFile(event.target.files?.[0], "Photo library"));
  $("manualSerialInput").addEventListener("input", () => { $("manualSerialInput").value = $("manualSerialInput").value.replace(/\D/g, "").slice(0, 6); });
  $("manualSerialInput").addEventListener("keydown", (event) => { if (event.key === "Enter") manualFind(); });
  $("manualFindBtn").addEventListener("click", manualFind);
  $("filterAll").addEventListener("change", () => setAllFilters($("filterAll").checked));
  ["Blank", "OK", "Repair", "Hold", "Reject"].forEach((name) => $(`filter${name}`).addEventListener("change", individualFilterChanged));
  $("dateFrom").addEventListener("change", renderFiltered); $("dateTo").addEventListener("change", renderFiltered);
  $("todayBtn").addEventListener("click", filterToday); $("clearFilterBtn").addEventListener("click", resetFilter);
  document.addEventListener("click", (event) => {
    const edit = event.target.closest("[data-edit]"); if (edit) openEdit(edit.dataset.edit);
    const candidate = event.target.closest("[data-candidate]"); if (candidate) showRecognition(candidate.dataset.candidate, $("recognitionPanel").dataset.source || "PaddleOCR");
    const status = event.target.closest("[data-status]"); if (status) commitRecognition(status.dataset.status);
  });
  $("closeRecognitionBtn").addEventListener("click", closeRecognition); $("retryBtn").addEventListener("click", closeRecognition);
  $("viewLastDiagBtn").addEventListener("click", openDiagnostics);
  $("closeEditBtn").addEventListener("click", closeEdit); $("saveEditBtn").addEventListener("click", () => saveEdit(false)); $("clearStatusBtn").addEventListener("click", () => saveEdit(true));
  $("closeDiagnosticsBtn").addEventListener("click", closeDiagnostics); $("engineSelfTestBtn").addEventListener("click", runSelfTest); $("exportDiagBtn").addEventListener("click", exportDiagnostic); $("clearCacheBtn").addEventListener("click", clearCacheAndReload);
  $("exportCsvBtn").addEventListener("click", exportCSV); $("exportJsonBtn").addEventListener("click", exportBackup); $("importJsonInput").addEventListener("change", (event) => importBackup(event.target.files?.[0]));
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
  try { await navigator.serviceWorker.register("./sw.js", { scope: "./" }); }
  catch (error) { console.warn("Service worker registration failed", error); }
}
function initialize() {
  loadState();
  if (state.config) { $("prefixInput").value = state.config.prefix || ""; $("startInput").value = state.config.start || ""; $("endInput").value = state.config.end || ""; }
  registerEvents(); renderAll(); registerServiceWorker();
  setRuntime(`<strong>Page script is running.</strong><br>Version ${APP_VERSION}. PaddleOCR recognizes text regions, but only six-digit serial numbers inside the generated range are used.`, "good");
}

initialize();

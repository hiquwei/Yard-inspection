import "./styles.css";
import { PaddleOCR } from "@paddleocr/paddleocr-js";
import ExcelJS from "exceljs";

const APP_VERSION = "2026.07.29-paddleocr-2";
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
    <header class="hero">
      <h1>Tex Yard Inspection</h1>
      <div class="hero-actions">
        <button id="saveAsBtn" class="btn btn-rust" type="button">Save As</button>
        <button id="exportExcelBtn" class="btn btn-dark" type="button">Export Excel</button>
      </div>
    </header>

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
          <thead><tr><th>Serial No.</th><th>Container No.</th><th>Inspection Date</th><th>Latest Status</th><th>Updated Date</th><th>Note</th></tr></thead>
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
            <thead><tr><th>Serial No.</th><th>Container No.</th><th>Inspection Date</th><th>Latest Status</th><th>Updated Date</th><th>Note</th></tr></thead>
            <tbody id="masterBody"><tr><td colspan="6" class="empty">No container list has been generated.</td></tr></tbody>
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
        <div class="record-date-grid">
          <div class="field"><label for="recognitionDate">Original Inspection Date</label><input id="recognitionDate" type="date"></div>
          <div class="field"><label for="recognitionUpdatedDate">Updated Date</label><input id="recognitionUpdatedDate" type="date" disabled></div>
        </div>
        <div class="field" style="margin-top:9px"><label for="recognitionNote">Note</label><textarea id="recognitionNote" placeholder="Repair details, hold reason, rejection reason, etc."></textarea></div>
        <div class="status-buttons"><button class="btn btn-ok" data-status="OK" type="button">OK</button><button class="btn btn-repair" data-status="Repair" type="button">Repair</button><button class="btn btn-hold" data-status="Hold" type="button">Hold</button><button class="btn btn-reject" data-status="Reject" type="button">Reject</button></div>
      </div>
      <div class="button-row"><button id="viewLastDiagBtn" class="btn btn-light" type="button">View OCR Details</button><button id="retryBtn" class="btn btn-light" type="button">Capture Again</button></div>
    </div>
  </section>

  <section id="editModal" class="modal">
    <div class="modal-card">
      <div class="card-head"><h2>Update Container Status</h2><button id="closeEditBtn" class="btn btn-light" type="button">Close</button></div>
      <div id="editNumber" class="recognized-number">—</div>
      <div class="record-date-grid">
        <div class="date-readout"><span>Original Inspection Date</span><strong id="editInspectionDateText">—</strong></div>
        <div class="date-readout"><span>Updated Date</span><strong id="editUpdatedDateText">—</strong></div>
      </div>
      <div class="field" style="margin-top:11px"><label for="editNote">Note</label><textarea id="editNote" placeholder="Optional note"></textarea></div>
      <p class="modal-copy">Choose a status to save immediately. The original Inspection Date is retained; Updated Date changes to today.</p>
      <div class="status-buttons">
        <button class="btn btn-ok" data-edit-status="OK" type="button">OK</button>
        <button class="btn btn-repair" data-edit-status="Repair" type="button">Repair</button>
        <button class="btn btn-hold" data-edit-status="Hold" type="button">Hold</button>
        <button class="btn btn-reject" data-edit-status="Reject" type="button">Reject</button>
      </div>
    </div>
  </section>

  <section id="saveAsModal" class="modal">
    <div class="modal-card save-as-card">
      <div class="card-head"><h2>Save As</h2><button id="closeSaveAsBtn" class="btn btn-light" type="button">Close</button></div>
      <p class="modal-copy">Both options create a data-embedded HTML file containing the current container list, Inspection Date, Latest Status, Updated Date and notes.</p>
      <div class="save-actions">
        <button id="saveHtmlBtn" class="btn btn-rust" type="button">Save as HTML</button>
        <button id="shareHtmlBtn" class="btn btn-dark" type="button">Share via WeChat</button>
      </div>
      <p class="small" style="margin:12px 0 0">For WeChat, choose WeChat from the system share sheet. If file sharing is unavailable, the HTML file will be downloaded instead.</p>
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
function dateFromTimestamp(value) {
  const match = String(value || "").match(/^(\d{4})[\/-](\d{2})[\/-](\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
}
function migrateItem(item) {
  const copy = { ...item };
  copy.serial = String(copy.serial || String(copy.raw || "").slice(4, 10)).padStart(6, "0").slice(-6);
  copy.status = STATUS_VALUES.includes(copy.status) ? copy.status : "";
  copy.date = String(copy.date || copy.inspectionDate || "").slice(0, 10);
  copy.updatedDate = String(copy.updatedDate || dateFromTimestamp(copy.updatedAt) || (copy.status ? copy.date : "")).slice(0, 10);
  copy.note = String(copy.note || "");
  copy.updatedAt = String(copy.updatedAt || "");
  copy.source = String(copy.source || "");
  return copy;
}
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
    state.items = Array.isArray(payload.items) ? payload.items.map(migrateItem) : [];
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
    items.push(old ? { ...old, serial } : { raw, serial, status: "", date: "", updatedDate: "", note: "", updatedAt: "", source: "" });
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
  if (!state.items.length) { body.innerHTML = '<tr><td colspan="6" class="empty">No container list has been generated.</td></tr>'; return; }
  body.innerHTML = state.items.map((item) => `
    <tr class="${item.status ? `row-${item.status}` : ""}">
      <td class="mono">${escapeHTML(item.serial)}</td>
      <td><button class="container-link" data-edit="${item.raw}" type="button">${formatRaw(item.raw)}</button></td>
      <td>${displayDate(item.date)}</td><td>${statusBadge(item.status)}</td><td>${displayDate(item.updatedDate)}</td><td>${escapeHTML(item.note)}</td>
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
  body.innerHTML = list.map((item) => `
    <tr class="${item.status ? `row-${item.status}` : ""}">
      <td class="mono">${escapeHTML(item.serial)}</td>
      <td><button class="container-link" data-edit="${item.raw}" type="button">${formatRaw(item.raw)}</button></td>
      <td>${displayDate(item.date)}</td><td>${statusBadge(item.status)}</td><td>${displayDate(item.updatedDate)}</td><td>${escapeHTML(item.note)}</td>
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
  $("editInspectionDateText").textContent = displayDate(item.date) || "Not inspected";
  $("editUpdatedDateText").textContent = displayDate(item.updatedDate) || "—";
  $("editNote").value = item.note || "";
  $("editModal").classList.add("show");
}
function closeEdit() { $("editModal").classList.remove("show"); state.editingRaw = ""; }
function applyEditStatus(status) {
  const item = itemMap().get(state.editingRaw);
  if (!item || !["OK", "Repair", "Hold", "Reject"].includes(status)) return;
  if (!item.date) item.date = today();
  item.status = status;
  item.note = $("editNote").value.trim();
  item.updatedDate = today();
  item.updatedAt = timestamp();
  item.source = item.source || "Manual edit";
  saveState(); renderAll(); closeEdit(); toast(`${formatRaw(item.raw)} updated to ${status}.`);
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
  $("recognitionMessage").textContent = item.status ? `Current status: ${item.status}. Original Inspection Date: ${displayDate(item.date)}. Updated Date: ${displayDate(item.updatedDate) || "—"}.` : "The prefix and check digit were generated automatically from the recognized six-digit serial number.";
  $("candidateList").innerHTML = "";
  $("recognitionFields").style.display = "block";
  $("recognitionDate").value = item.date || today();
  $("recognitionDate").disabled = Boolean(item.date);
  $("recognitionUpdatedDate").value = today();
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
  if (!item.date) item.date = $("recognitionDate").value || today();
  item.note = $("recognitionNote").value.trim();
  item.updatedDate = today();
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

function exportPayload() {
  return {
    app: "Tex Yard Inspection",
    version: APP_VERSION,
    exportedAt: timestamp(),
    config: state.config,
    orientation: state.orientation,
    items: state.items.map((item) => migrateItem(item)),
  };
}
function exportFileBase() {
  return `Tex_Yard_Inspection_${state.config?.prefix || "Containers"}_${today()}`;
}
function safeEmbeddedJSON(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
function buildDataEmbeddedHTML() {
  const data = safeEmbeddedJSON(exportPayload());
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="${RAL_3009}"><title>Tex Yard Inspection</title>
<style>
:root{--rust:${RAL_3009};--page:#eef3f6;--line:#d5dfe7;--text:#18222d;--muted:#687888;--ok:#178447;--repair:#1e73bd;--hold:#d97706;--reject:#ce3030;--okbg:#e8f7ef;--repairbg:#e8f3fd;--holdbg:#fff2de;--rejectbg:#ffebeb}*{box-sizing:border-box}body{margin:0;background:var(--page);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}.shell{max-width:1180px;margin:auto;padding:10px 10px 40px}.hero{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px;border:1px solid #ddc8cb;border-radius:17px;background:#fff}.hero h1{margin:0;color:var(--rust);font-size:clamp(30px,6vw,50px);line-height:1}.actions,.filters,.status-buttons{display:flex;flex-wrap:wrap;gap:8px}.btn{min-height:42px;padding:9px 12px;border:0;border-radius:10px;font-weight:760;cursor:pointer}.rust{color:#fff;background:var(--rust)}.dark{color:#fff;background:#273745}.light{color:#294052;background:#edf2f5}.card{margin-top:14px;padding:14px;border:1px solid var(--line);border-radius:15px;background:#fff}.stats{display:grid;grid-template-columns:repeat(7,minmax(80px,1fr));gap:8px}.stat{padding:10px;border:1px solid var(--line);border-radius:11px;text-align:center}.stat strong{display:block;font-size:21px}.stat span{color:var(--muted);font-size:12px}.filters{align-items:end}.field label{display:block;margin-bottom:5px;color:#4b5a68;font-size:12px;font-weight:750}.field input{min-height:40px;padding:8px 9px;border:1px solid #aebdca;border-radius:9px}.pills label{display:inline-flex;margin:3px;padding:7px 10px;border:1px solid var(--line);border-radius:99px;cursor:pointer}.pills input{position:absolute;opacity:0}.pills input:checked+label{color:#fff;background:#163b59}.table-wrap{overflow:auto;max-height:68vh;border:1px solid var(--line);border-radius:11px}table{width:100%;min-width:760px;border-collapse:collapse}th,td{padding:9px;border-bottom:1px solid var(--line);text-align:left}th{position:sticky;top:0;background:#edf2f6}.container{padding:0;border:0;color:var(--rust);background:none;font:800 15px ui-monospace,monospace;text-decoration:underline;cursor:pointer}.badge{display:inline-flex;min-width:70px;justify-content:center;padding:4px 8px;border-radius:99px;color:#fff;font-size:12px;font-weight:800}.badge.OK{background:var(--ok)}.badge.Repair{background:var(--repair)}.badge.Hold{background:var(--hold)}.badge.Reject{background:var(--reject)}.row-OK{background:var(--okbg)}.row-Repair{background:var(--repairbg)}.row-Hold{background:var(--holdbg)}.row-Reject{background:var(--rejectbg)}.mono{font-family:ui-monospace,monospace}.modal{display:none;position:fixed;inset:0;align-items:center;justify-content:center;padding:12px;background:rgba(0,0,0,.52)}.modal.show{display:flex}.modal-card{width:min(100%,560px);padding:16px;border-radius:15px;background:#fff}.number{margin:10px 0;padding:12px;border-radius:10px;color:var(--rust);background:#f7ecee;text-align:center;font:900 22px ui-monospace,monospace}.date-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.date-box{padding:10px;border:1px solid var(--line);border-radius:9px}.date-box span{display:block;color:var(--muted);font-size:12px}.date-box strong{display:block;margin-top:4px}.status-buttons button{flex:1 1 45%;color:#fff}.ok{background:var(--ok)}.repair{background:var(--repair)}.hold{background:var(--hold)}.reject{background:var(--reject)}textarea{width:100%;min-height:70px;margin-top:9px;padding:9px;border:1px solid #aebdca;border-radius:9px}.empty{padding:25px;color:var(--muted);text-align:center}@media(max-width:650px){.hero{align-items:flex-start;flex-direction:column}.stats{grid-template-columns:repeat(2,1fr)}.date-grid{grid-template-columns:1fr}}
</style></head><body><main class="shell"><header class="hero"><h1>Tex Yard Inspection</h1><div class="actions"><button id="saveBtn" class="btn rust">Save As</button><button id="shareBtn" class="btn dark">Share via WeChat</button></div></header><section class="card"><div id="stats" class="stats"></div></section><section class="card"><div class="filters"><div class="field"><label>From Date</label><input id="from" type="date"></div><div class="field"><label>To Date</label><input id="to" type="date"></div><div id="pills" class="pills"></div><button id="reset" class="btn light">Reset</button></div></section><section class="card"><div id="count" style="margin-bottom:9px;color:var(--muted)"></div><div class="table-wrap"><table><thead><tr><th>Serial No.</th><th>Container No.</th><th>Inspection Date</th><th>Latest Status</th><th>Updated Date</th><th>Note</th></tr></thead><tbody id="body"></tbody></table></div></section></main><section id="edit" class="modal"><div class="modal-card"><div style="display:flex;justify-content:space-between;gap:8px"><h2 style="margin:0">Update Container Status</h2><button id="close" class="btn light">Close</button></div><div id="number" class="number"></div><div class="date-grid"><div class="date-box"><span>Original Inspection Date</span><strong id="inspectionDate">—</strong></div><div class="date-box"><span>Updated Date</span><strong id="updatedDate">—</strong></div></div><textarea id="note" placeholder="Optional note"></textarea><p style="color:var(--muted);font-size:13px">Choose a status to save immediately. The original Inspection Date is retained.</p><div class="status-buttons"><button class="btn ok" data-status="OK">OK</button><button class="btn repair" data-status="Repair">Repair</button><button class="btn hold" data-status="Hold">Hold</button><button class="btn reject" data-status="Reject">Reject</button></div></div></section><script id="embeddedData" type="application/json">${data}</script><script>
(function(){'use strict';var RUST='${RAL_3009}',data=JSON.parse(document.getElementById('embeddedData').textContent),state={config:data.config||null,items:Array.isArray(data.items)?data.items:[],editing:null};var statuses=['','OK','Repair','Hold','Reject'];function q(id){return document.getElementById(id)}function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]})}function td(){var d=new Date(),p=function(n){return String(n).padStart(2,'0')};return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}function disp(v){return String(v||'').replace(/-/g,'/')}function fmt(v){v=String(v||'').replace(/[^A-Z0-9]/g,'');return v.slice(0,4)+' '+v.slice(4,10)+' '+v.slice(10,11)}function badge(s){return s?'<span class="badge '+s+'">'+s+'</span>':''}function selected(){var out=[];statuses.forEach(function(s){var id=s||'Blank';if(q('st'+id).checked)out.push(s)});return out}function renderStats(){var c={OK:0,Repair:0,Hold:0,Reject:0};state.items.forEach(function(x){if(c[x.status]!=null)c[x.status]++});var done=c.OK+c.Repair+c.Hold+c.Reject,vals=[[state.items.length,'Total'],[done,'Inspected'],[state.items.length-done,'Uninspected'],[c.OK,'OK'],[c.Repair,'Repair'],[c.Hold,'Hold'],[c.Reject,'Reject']];q('stats').innerHTML=vals.map(function(x){return'<div class="stat"><strong>'+x[0]+'</strong><span>'+x[1]+'</span></div>'}).join('')}function render(){renderStats();var from=q('from').value,to=q('to').value,ss=selected(),list=state.items.filter(function(x){if(ss.indexOf(x.status)<0)return false;if(!x.status)return !from&&!to;if(from&&x.date<from)return false;if(to&&x.date>to)return false;return true});q('count').textContent=list.length+' container'+(list.length===1?'':'s');q('body').innerHTML=list.length?list.map(function(x){return'<tr class="'+(x.status?'row-'+x.status:'')+'"><td class="mono">'+esc(x.serial)+'</td><td><button class="container" data-raw="'+esc(x.raw)+'">'+fmt(x.raw)+'</button></td><td>'+disp(x.date)+'</td><td>'+badge(x.status)+'</td><td>'+disp(x.updatedDate)+'</td><td>'+esc(x.note)+'</td></tr>'}).join(''):'<tr><td colspan="6" class="empty">No containers match the current filter.</td></tr>'}function open(raw){var item=state.items.find(function(x){return x.raw===raw});if(!item)return;state.editing=item;q('number').textContent=fmt(item.raw);q('inspectionDate').textContent=disp(item.date)||'Not inspected';q('updatedDate').textContent=disp(item.updatedDate)||'—';q('note').value=item.note||'';q('edit').classList.add('show')}function saveStatus(status){var x=state.editing;if(!x)return;if(!x.date)x.date=td();x.status=status;x.note=q('note').value.trim();x.updatedDate=td();q('edit').classList.remove('show');state.editing=null;render()}function currentHTML(){var clone=document.documentElement.cloneNode(true);clone.querySelector('#embeddedData').textContent=JSON.stringify({app:'Tex Yard Inspection',version:data.version,exportedAt:new Date().toISOString(),config:state.config,items:state.items}).replace(/</g,'\\\\u003c');clone.querySelector('#edit').classList.remove('show');return'<!doctype html>\\n'+clone.outerHTML}function download(){var blob=new Blob([currentHTML()],{type:'text/html;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Tex_Yard_Inspection_'+(state.config&&state.config.prefix||'Containers')+'_'+td()+'.html';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},700)}async function share(){var html=currentHTML(),name='Tex_Yard_Inspection_'+(state.config&&state.config.prefix||'Containers')+'_'+td()+'.html',file=new File([html],name,{type:'text/html'});try{if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({title:'Tex Yard Inspection',text:'Choose WeChat to share this data-embedded HTML file.',files:[file]})}else download()}catch(e){if(e&&e.name!=='AbortError')download()}}q('pills').innerHTML=statuses.map(function(s){var id=s||'Blank',label=s||'Uninspected';return'<span><input id="st'+id+'" type="checkbox" checked><label for="st'+id+'">'+label+'</label></span>'}).join('');statuses.forEach(function(s){q('st'+(s||'Blank')).addEventListener('change',render)});q('from').addEventListener('change',render);q('to').addEventListener('change',render);q('reset').addEventListener('click',function(){q('from').value='';q('to').value='';statuses.forEach(function(s){q('st'+(s||'Blank')).checked=true});render()});document.addEventListener('click',function(e){var b=e.target.closest('[data-raw]');if(b)open(b.dataset.raw);var s=e.target.closest('[data-status]');if(s)saveStatus(s.dataset.status)});q('close').addEventListener('click',function(){q('edit').classList.remove('show');state.editing=null});q('saveBtn').addEventListener('click',download);q('shareBtn').addEventListener('click',share);render()})();
</script></body></html>`;
}
function openSaveAs() { if (!state.items.length) { toast("There is no data to export."); return; } $("saveAsModal").classList.add("show"); }
function closeSaveAs() { $("saveAsModal").classList.remove("show"); }
function saveAsHTML() {
  const html = buildDataEmbeddedHTML();
  downloadBlob(html, `${exportFileBase()}.html`, "text/html;charset=utf-8");
  closeSaveAs();
}
async function shareHTML() {
  const html = buildDataEmbeddedHTML();
  const fileName = `${exportFileBase()}.html`;
  const file = new File([html], fileName, { type: "text/html" });
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      await navigator.share({ title: "Tex Yard Inspection", text: "Choose WeChat to share this data-embedded HTML file.", files: [file] });
      closeSaveAs();
      return;
    }
    downloadBlob(file, fileName, "text/html");
    toast("File sharing is unavailable in this browser. The HTML file was downloaded instead.", 4200);
    closeSaveAs();
  } catch (error) {
    if (error?.name !== "AbortError") {
      downloadBlob(file, fileName, "text/html");
      toast("Sharing failed. The HTML file was downloaded instead.", 4200);
      closeSaveAs();
    }
  }
}
function excelDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}
async function exportExcel() {
  if (!state.items.length) { toast("There is no data to export."); return; }
  const button = $("exportExcelBtn");
  button.disabled = true;
  const previous = button.textContent;
  button.textContent = "Creating Excel…";
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Tex Yard Inspection";
    workbook.title = "Tex Yard Inspection";
    workbook.subject = "Container yard inspection records";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Inspection Records", {
      properties: { defaultRowHeight: 20 },
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9, margins: { left: .3, right: .3, top: .5, bottom: .5, header: .2, footer: .2 } },
      views: [{ state: "frozen", ySplit: 3 }],
    });
    sheet.mergeCells("A1:E1");
    const title = sheet.getCell("A1");
    title.value = "Tex Yard Inspection";
    title.font = { name: "Arial", size: 20, bold: true, color: { argb: "FF5E2028" } };
    title.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 34;
    sheet.getRow(2).height = 8;
    const headers = ["Serial No.", "Container No.", "Inspection Date", "Latest Status", "Updated Date"];
    sheet.getRow(3).values = headers;
    sheet.getRow(3).height = 26;
    sheet.getRow(3).eachCell((cell) => {
      cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5E2028" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { top: { style: "thin", color: { argb: "FF9C777C" } }, left: { style: "thin", color: { argb: "FF9C777C" } }, bottom: { style: "thin", color: { argb: "FF9C777C" } }, right: { style: "thin", color: { argb: "FF9C777C" } } };
    });
    const statusStyles = {
      OK: { fill: "FF178447", font: "FFFFFFFF" },
      Repair: { fill: "FF1E73BD", font: "FFFFFFFF" },
      Hold: { fill: "FFD97706", font: "FFFFFFFF" },
      Reject: { fill: "FFCE3030", font: "FFFFFFFF" },
    };
    state.items.forEach((item, index) => {
      const row = sheet.addRow([item.serial, formatRaw(item.raw), excelDate(item.date), item.status || "", excelDate(item.updatedDate)]);
      row.height = 22;
      row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
        cell.font = { name: "Arial", size: 10, color: { argb: "FF1F2933" } };
        cell.alignment = { horizontal: columnNumber === 2 ? "left" : "center", vertical: "middle" };
        cell.border = { top: { style: "hair", color: { argb: "FFD5DFE7" } }, left: { style: "hair", color: { argb: "FFD5DFE7" } }, bottom: { style: "hair", color: { argb: "FFD5DFE7" } }, right: { style: "hair", color: { argb: "FFD5DFE7" } } };
        if (index % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F9FA" } };
      });
      row.getCell(1).numFmt = "@";
      row.getCell(2).font = { name: "Consolas", size: 10, bold: true, color: { argb: "FF5E2028" } };
      row.getCell(3).numFmt = "yyyy/mm/dd";
      row.getCell(5).numFmt = "yyyy/mm/dd";
      if (statusStyles[item.status]) {
        const cell = row.getCell(4);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusStyles[item.status].fill } };
        cell.font = { name: "Arial", size: 10, bold: true, color: { argb: statusStyles[item.status].font } };
      }
    });
    sheet.getColumn(1).width = 14;
    sheet.getColumn(2).width = 24;
    sheet.getColumn(3).width = 18;
    sheet.getColumn(4).width = 17;
    sheet.getColumn(5).width = 18;
    sheet.autoFilter = { from: "A3", to: "E3" };
    sheet.pageSetup.printTitlesRow = "1:3";
    const buffer = await workbook.xlsx.writeBuffer();
    downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${exportFileBase()}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    toast("Excel file exported.");
  } catch (error) {
    console.error(error);
    toast(`Excel export failed: ${error.message || error}`, 5000);
  } finally {
    button.disabled = false;
    button.textContent = previous;
  }
}

function csvCell(value) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function exportCSV() {
  if (!state.items.length) { toast("There is no data to export."); return; }
  const rows = [["No.", "Container Number", "Prefix", "Serial Number", "Check Digit", "Latest Status", "Inspection Date", "Updated Date", "Note", "Updated Timestamp", "Source"]];
  state.items.forEach((item, index) => rows.push([index + 1, formatRaw(item.raw), item.raw.slice(0, 4), item.serial, item.raw.at(-1), item.status, displayDate(item.date), displayDate(item.updatedDate), item.note, item.updatedAt, item.source]));
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
      state.config = data.config; state.items = data.items.map(migrateItem); state.orientation = data.orientation === "vertical" ? "vertical" : "horizontal";
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
    const editStatus = event.target.closest("[data-edit-status]"); if (editStatus) applyEditStatus(editStatus.dataset.editStatus);
  });
  $("closeRecognitionBtn").addEventListener("click", closeRecognition); $("retryBtn").addEventListener("click", closeRecognition);
  $("viewLastDiagBtn").addEventListener("click", openDiagnostics);
  $("closeEditBtn").addEventListener("click", closeEdit);
  $("closeDiagnosticsBtn").addEventListener("click", closeDiagnostics); $("engineSelfTestBtn").addEventListener("click", runSelfTest); $("exportDiagBtn").addEventListener("click", exportDiagnostic); $("clearCacheBtn").addEventListener("click", clearCacheAndReload);
  $("saveAsBtn").addEventListener("click", openSaveAs);
  $("exportExcelBtn").addEventListener("click", exportExcel);
  $("closeSaveAsBtn").addEventListener("click", closeSaveAs);
  $("saveHtmlBtn").addEventListener("click", saveAsHTML);
  $("shareHtmlBtn").addEventListener("click", shareHTML);
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
  setRuntime(`<strong>Page script is running.</strong><br>Version ${APP_VERSION}. Data-embedded HTML and styled Excel export are available. PaddleOCR recognizes text regions, but only six-digit serial numbers inside the generated range are used.`, "good");
}

initialize();

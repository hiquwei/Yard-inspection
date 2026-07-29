# Tex Yard Inspection

Mobile container-yard inspection web application using the official browser SDK `@paddleocr/paddleocr-js` with PP-OCRv5 mobile detection and recognition models.

## Recognition design

The camera captures the complete container number, but the application only uses a six-digit serial number from PaddleOCR output. The four-letter prefix comes from the generated range and the ISO 6346 check digit is recalculated by the application. This prevents the check-digit box and prefix recognition errors from controlling the result.

## Main functions

- Horizontal and vertical camera frames.
- Three-frame camera burst and candidate voting.
- PaddleOCR text detection before text recognition.
- Six-digit serial-number extraction constrained to the generated range.
- Automatic ISO 6346 check-digit calculation.
- Statuses: OK, Repair, Hold, Reject; uninspected status remains blank.
- Original Inspection Date is recorded on the first inspection and cannot be overwritten by later status changes.
- Updated Date changes automatically whenever the latest status is changed.
- Date and multi-status filters.
- Full generated list is collapsed by default.
- Click any container number to choose a new latest status; the original Inspection Date remains unchanged and Updated Date changes automatically.
- Data-embedded HTML save/share, styled Excel export, CSV export, and JSON backup/restore.
- Built-in PaddleOCR diagnostics.
- Temporary camera images are released after recognition and are not stored in inspection records.

## Build

```bash
bash scripts/build-site.sh
```

The build script downloads the official PP-OCRv5 mobile ONNX model archives, installs the pinned browser SDK, builds the Vite application, and copies ONNX Runtime WebAssembly assets into `dist/`.

## GitHub Pages

Upload the repository files, select **Settings → Pages → GitHub Actions**, and allow the included workflow to finish. The workflow publishes the `dist` directory.

## Runtime notes

- Use the GitHub Pages HTTPS address in Safari.
- The first PaddleOCR initialization is slower because models are loaded into browser memory.
- GitHub Pages does not provide COOP/COEP headers, so this build uses one WebAssembly thread for broad iPhone compatibility.
- Browser records are stored in local storage. Export backups regularly.

## Data export and inspection-date rules

- `Save As` creates a data-embedded standalone HTML file.
- `Share via WeChat` opens the system share sheet with the same HTML file.
- `Export Excel` creates a styled `.xlsx` workbook with Serial No., Container No., Inspection Date, Latest Status and Updated Date.
- The original Inspection Date is written only when a container is inspected for the first time. Later status changes update Updated Date but do not overwrite Inspection Date.

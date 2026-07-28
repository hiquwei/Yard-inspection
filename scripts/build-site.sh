#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="$ROOT/_site"
OCR="$SITE/ocr"
CORE="$OCR/core"
LANG="$OCR/lang"

rm -rf "$SITE"
mkdir -p "$CORE" "$LANG" "$SITE/icons" "$OCR/licenses"

cp "$ROOT/index.html" "$SITE/index.html"
cp "$ROOT/manifest.webmanifest" "$SITE/manifest.webmanifest"
cp "$ROOT/sw.js" "$SITE/sw.js"
cp "$ROOT/diagnostic-test-card.html" "$SITE/diagnostic-test-card.html"
cp "$ROOT/.nojekyll" "$SITE/.nojekyll"
cp "$ROOT/icons/icon-192.png" "$SITE/icons/icon-192.png"
cp "$ROOT/icons/icon-512.png" "$SITE/icons/icon-512.png"

fetch_file() {
  local url="$1"
  local out="$2"
  echo "Downloading: $url"
  curl --fail --location --retry 5 --retry-all-errors --connect-timeout 20 --max-time 300 \
    --output "$out" "$url"
}

# Tesseract.js browser API and Worker (pinned versions)
fetch_file "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js" "$OCR/tesseract.min.js"
fetch_file "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/worker.min.js" "$OCR/worker.min.js"
fetch_file "https://raw.githubusercontent.com/naptha/tesseract.js/v5.1.1/LICENSE.md" "$OCR/licenses/tesseract.js-LICENSE.md"

# Tesseract.js Core. Official local-installation guidance requires all four files.
BASE_CORE="https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.0"
for f in \
  tesseract-core.wasm.js \
  tesseract-core-simd.wasm.js \
  tesseract-core-lstm.wasm.js \
  tesseract-core-simd-lstm.wasm.js; do
  fetch_file "$BASE_CORE/$f" "$CORE/$f"
done
fetch_file "$BASE_CORE/LICENSE" "$OCR/licenses/tesseract.js-core-LICENSE.txt"

# Fast English model: appropriate for uppercase letters and digits on container numbers.
fetch_file "https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0_fast/eng.traineddata.gz" "$LANG/eng.traineddata.gz"
fetch_file "https://raw.githubusercontent.com/naptha/tessdata/gh-pages/LICENSE" "$OCR/licenses/tessdata-LICENSE.txt"

# Fail early if a proxy returned an HTML error page or truncated file.
check_size() {
  local file="$1"
  local min="$2"
  local size
  size=$(wc -c < "$file")
  if [ "$size" -lt "$min" ]; then
    echo "ERROR: $file is unexpectedly small ($size bytes)." >&2
    exit 1
  fi
}
check_size "$OCR/tesseract.min.js" 50000
check_size "$OCR/worker.min.js" 50000
check_size "$CORE/tesseract-core.wasm.js" 1000000
check_size "$CORE/tesseract-core-simd.wasm.js" 1000000
check_size "$CORE/tesseract-core-lstm.wasm.js" 1000000
check_size "$CORE/tesseract-core-simd-lstm.wasm.js" 1000000
check_size "$LANG/eng.traineddata.gz" 500000

cat > "$OCR/version.json" <<'JSON'
{
  "tesseract.js": "5.1.1",
  "tesseract.js-core": "5.1.0",
  "language": "eng 4.0.0_fast",
  "runtime": "self-hosted on the same GitHub Pages origin"
}
JSON

cp "$SITE/index.html" "$SITE/404.html"
echo "Build complete: $SITE"
find "$SITE" -type f -printf '%P  %k KB\n' | sort

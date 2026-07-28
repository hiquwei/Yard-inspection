#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

MODEL_DIR="$ROOT/public/models"
mkdir -p "$MODEL_DIR"

fetch_file() {
  local url="$1"
  local output="$2"
  local minimum_size="$3"
  if [[ -f "$output" ]] && [[ $(wc -c < "$output") -ge "$minimum_size" ]]; then
    echo "Using cached file: $output"
    return
  fi
  echo "Downloading: $url"
  curl --fail --location --retry 6 --retry-all-errors --connect-timeout 30 --max-time 900 \
    --output "$output.part" "$url"
  mv "$output.part" "$output"
  local size
  size=$(wc -c < "$output")
  if [[ "$size" -lt "$minimum_size" ]]; then
    echo "ERROR: $output is unexpectedly small ($size bytes)." >&2
    exit 1
  fi
}

fetch_file \
  "https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv5_mobile_det_onnx_infer.tar" \
  "$MODEL_DIR/PP-OCRv5_mobile_det_onnx_infer.tar" 1000000
fetch_file \
  "https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv5_mobile_rec_onnx_infer.tar" \
  "$MODEL_DIR/PP-OCRv5_mobile_rec_onnx_infer.tar" 1000000

npm install --no-audit --no-fund
npm run build

mkdir -p "$ROOT/dist/ort"
find "$ROOT/node_modules/onnxruntime-web/dist" -maxdepth 1 -type f \
  \( -name 'ort-wasm*.wasm' -o -name 'ort-wasm*.mjs' -o -name 'ort-wasm*.js' \) \
  -exec cp {} "$ROOT/dist/ort/" \;

: > "$ROOT/dist/.nojekyll"

for required in \
  "$ROOT/dist/index.html" \
  "$ROOT/dist/models/PP-OCRv5_mobile_det_onnx_infer.tar" \
  "$ROOT/dist/models/PP-OCRv5_mobile_rec_onnx_infer.tar"; do
  if [[ ! -s "$required" ]]; then
    echo "ERROR: Missing required build output: $required" >&2
    exit 1
  fi
done

if ! find "$ROOT/dist/ort" -type f -name '*.wasm' -print -quit | grep -q .; then
  echo "ERROR: ONNX Runtime WebAssembly files were not copied." >&2
  exit 1
fi

echo "Build completed successfully."
find "$ROOT/dist" -type f -printf '%P  %k KB\n' | sort

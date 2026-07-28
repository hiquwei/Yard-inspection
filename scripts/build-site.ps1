$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root
$ModelDir = Join-Path $Root "public\models"
New-Item -ItemType Directory -Force -Path $ModelDir | Out-Null

function Get-RequiredFile([string]$Url, [string]$Output, [long]$MinimumSize) {
    if ((Test-Path $Output) -and ((Get-Item $Output).Length -ge $MinimumSize)) {
        Write-Host "Using cached file: $Output"
        return
    }
    Write-Host "Downloading: $Url"
    $Temp = "$Output.part"
    Invoke-WebRequest -Uri $Url -OutFile $Temp -UseBasicParsing
    Move-Item -Force $Temp $Output
    if ((Get-Item $Output).Length -lt $MinimumSize) {
        throw "$Output is unexpectedly small."
    }
}

Get-RequiredFile "https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv5_mobile_det_onnx_infer.tar" (Join-Path $ModelDir "PP-OCRv5_mobile_det_onnx_infer.tar") 1000000
Get-RequiredFile "https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv5_mobile_rec_onnx_infer.tar" (Join-Path $ModelDir "PP-OCRv5_mobile_rec_onnx_infer.tar") 1000000

npm install --no-audit --no-fund
npm run build

$OrtDir = Join-Path $Root "dist\ort"
New-Item -ItemType Directory -Force -Path $OrtDir | Out-Null
Get-ChildItem (Join-Path $Root "node_modules\onnxruntime-web\dist") -File | Where-Object {
    $_.Name -like "ort-wasm*.wasm" -or $_.Name -like "ort-wasm*.mjs" -or $_.Name -like "ort-wasm*.js"
} | Copy-Item -Destination $OrtDir -Force
New-Item -ItemType File -Force -Path (Join-Path $Root "dist\.nojekyll") | Out-Null
Write-Host "Build completed successfully: $Root\dist"

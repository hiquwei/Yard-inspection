$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Site = Join-Path $Root '_site'
$Ocr = Join-Path $Site 'ocr'
$Core = Join-Path $Ocr 'core'
$Lang = Join-Path $Ocr 'lang'
Remove-Item $Site -Recurse -Force -ErrorAction SilentlyContinue
New-Item $Core -ItemType Directory -Force | Out-Null
New-Item $Lang -ItemType Directory -Force | Out-Null
New-Item (Join-Path $Site 'icons') -ItemType Directory -Force | Out-Null
New-Item (Join-Path $Ocr 'licenses') -ItemType Directory -Force | Out-Null
Copy-Item (Join-Path $Root 'index.html') $Site
Copy-Item (Join-Path $Root 'manifest.webmanifest') $Site
Copy-Item (Join-Path $Root 'sw.js') $Site
Copy-Item (Join-Path $Root 'diagnostic-test-card.html') $Site
Copy-Item (Join-Path $Root '.nojekyll') $Site
Copy-Item (Join-Path $Root 'icons\*') (Join-Path $Site 'icons')
function Get-Asset([string]$Url,[string]$Out) {
  Write-Host "Downloading: $Url"
  Invoke-WebRequest -Uri $Url -OutFile $Out -UseBasicParsing
}
Get-Asset 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js' (Join-Path $Ocr 'tesseract.min.js')
Get-Asset 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/worker.min.js' (Join-Path $Ocr 'worker.min.js')
Get-Asset 'https://raw.githubusercontent.com/naptha/tesseract.js/v5.1.1/LICENSE.md' (Join-Path $Ocr 'licenses\tesseract.js-LICENSE.md')
$BaseCore='https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.0'
@('tesseract-core.wasm.js','tesseract-core-simd.wasm.js','tesseract-core-lstm.wasm.js','tesseract-core-simd-lstm.wasm.js') | ForEach-Object { Get-Asset "$BaseCore/$_" (Join-Path $Core $_) }
Get-Asset "$BaseCore/LICENSE" (Join-Path $Ocr 'licenses\tesseract.js-core-LICENSE.txt')
Get-Asset 'https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0_fast/eng.traineddata.gz' (Join-Path $Lang 'eng.traineddata.gz')
Get-Asset 'https://raw.githubusercontent.com/naptha/tessdata/gh-pages/LICENSE' (Join-Path $Ocr 'licenses\tessdata-LICENSE.txt')
Copy-Item (Join-Path $Site 'index.html') (Join-Path $Site '404.html')
Write-Host "Build complete: $Site"

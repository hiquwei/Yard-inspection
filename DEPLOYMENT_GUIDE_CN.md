# GitHub Pages 部署说明

## 完整新建仓库

1. 解压 `Tex_Yard_Inspection_PaddleOCR_GitHub_Root_Ready.zip`。
2. 在 GitHub 新建一个公开仓库，例如 `Yard-inspection`。
3. 将解压后根目录内的全部文件和文件夹上传到仓库根目录。
4. 必须确认以下路径存在：

```text
.github/workflows/main.yml
src/main.js
scripts/build-site.sh
package.json
index.html
```

5. 进入 `Settings → Pages`，将 Source 选择为 `GitHub Actions`。
6. 进入 `Actions`，等待 `Deploy Tex Yard Inspection` 变成绿色对勾。
7. 用 iPhone Safari 打开 Pages 的 HTTPS 地址。

## 更新现有仓库

使用 `Tex_Yard_Inspection_PaddleOCR_GitHub_Update.zip`。解压后将其中全部内容覆盖到现有仓库根目录。旧的 Tesseract 文件无需保留，新的构建不会使用旧 `ocr/` 文件夹。

建议使用 GitHub Desktop 或 Git 命令更新，因为 GitHub 网页的 “Choose your files” 不会可靠上传文件夹。使用网页时，应把整个解压目录中的文件夹直接拖入上传区域，并确认 `.github` 隐藏目录已上传。

## 首次部署时间

构建需要下载两个官方 PP-OCRv5 ONNX 模型、安装 NPM 依赖并生成网页。首次运行通常比以后更新更慢。

## 手机更新缓存

新版本部署完成后，在网页中打开 `OCR Diagnostics`，点击 `Clear Cache & Reload`。网页顶部标题应为 `Tex Yard Inspection`，界面全部为英文。

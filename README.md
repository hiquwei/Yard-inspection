# Container Inspection OCR — Diagnostic Build

本目录为可诊断版本。页面版本：`2026.07.28-diagnostic-1`。

# 集装箱箱号识别与检验状态记录｜GitHub Pages 完整部署包

这个包用于把网页部署到 GitHub Pages。GitHub Actions 会在部署阶段自动下载并放入站内：

- Tesseract.js 5.1.1
- Tesseract Worker 5.1.1
- Tesseract.js Core 5.1.0 的四个兼容核心
- English `4.0.0_fast` 识别模型

手机运行时从你自己的 GitHub Pages 地址加载这些文件，不再依赖手机直接访问 jsDelivr、unpkg 或语言模型网站。

## 最简单的部署步骤

1. 新建一个 GitHub 仓库，例如 `container-inspection`。
2. 将本 ZIP 解压后的**全部文件和文件夹**上传到仓库根目录，必须保留 `.github/workflows/pages.yml`。
3. 在仓库 `Settings → Pages` 中，将 `Source` 设为 **GitHub Actions**。
4. 打开仓库的 `Actions`，等待 `Deploy Container Inspection OCR` 变为绿色。
5. 返回 `Settings → Pages`，打开 GitHub 给出的 HTTPS 地址。
6. 必须用 iPhone 的 Safari 打开网址，并允许相机权限。

详细图文式步骤见 `部署说明_中文.md`。

## 数据说明

检验记录保存在当前浏览器的 localStorage 中，不会上传到 GitHub。请定期导出 CSV；清除 Safari 网站数据、换手机或换浏览器会导致本机记录不可见。

## 本地构建（可选）

Windows PowerShell：

```powershell
powershell -ExecutionPolicy Bypass -File .\scriptsuild-site.ps1
```

Linux / macOS：

```bash
bash scripts/build-site.sh
```

构建结果位于 `_site`。实时网页相机仍要求通过 HTTPS 或 localhost 打开。

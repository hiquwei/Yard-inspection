# 现有 Yard-inspection 仓库更新步骤

1. 解压更新包。
2. 在本地将更新包内容复制到现有仓库目录，并允许覆盖同名文件。
3. 删除旧项目中仅供 Tesseract 使用的文件（如旧 `ocr` 构建资源）；不删除历史检查数据，因为检查数据存储在手机浏览器中，而不是 GitHub 仓库中。
4. 提交并推送全部变更。
5. 在 GitHub `Actions` 查看最新工作流。
6. 成功后使用 Safari 打开 Pages 地址，点击 `OCR Diagnostics → Clear Cache & Reload`。

更新后的关键文件：

```text
.github/workflows/main.yml
index.html
package.json
vite.config.js
src/main.js
src/styles.css
public/sw.js
public/manifest.webmanifest
scripts/build-site.sh
scripts/build-site.ps1
```

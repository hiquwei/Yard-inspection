# Tex Yard Inspection v2：更新现有 GitHub 仓库

本次只需要覆盖下列文件，不需要重新创建仓库，也不需要修改 GitHub Pages 设置：

```text
package.json
src/main.js
src/styles.css
public/sw.js
public/app-version.json
README.md
THIRD_PARTY_NOTICES.md
```

## 使用 GitHub 网页逐项替换

1. 进入仓库根目录，上传并替换 `package.json`、`README.md`、`THIRD_PARTY_NOTICES.md`。
2. 进入仓库的 `src` 文件夹，上传并替换 `main.js`、`styles.css`。
3. 进入仓库的 `public` 文件夹，上传并替换 `sw.js`、`app-version.json`。
4. 每次上传时允许 GitHub 覆盖同名文件，然后提交到 `main` 分支。
5. 最后一次提交后，打开 `Actions`，等待最新的 `Deploy Tex Yard Inspection` 工作流显示绿色对勾。
6. 在 iPhone Safari 打开 GitHub Pages 页面，进入 `OCR Diagnostics`，点击 `Clear Cache & Reload`。

## 本次新增

- 标题右侧的 `Save As` 和 `Export Excel`。
- `Save As HTML` 与 `Share via WeChat` 均生成带当前数据的独立 HTML。
- Excel 文件包含 `Serial No.`、`Container No.`、`Inspection Date`、`Latest Status`、`Updated Date`，并带 RAL 3009 标题和状态颜色。
- 第一次检验时写入原始 `Inspection Date`；以后修改状态只更新 `Updated Date`，不覆盖原始检验日期。
- 点击箱号后直接选择 `OK / Repair / Hold / Reject`，选择后立即保存。

现有手机浏览器中的历史数据会自动兼容；更新代码不会主动清除 localStorage 中的检验记录。

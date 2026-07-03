# ADR-0001：云函数共享代码采用构建期复制

日期：2026-07-03 · 状态：已接受

## 背景

全部云函数曾以 `require("../_shared/...")` 引用共享模块。微信云开发按函数目录独立打包上传，`../_shared` 不进部署包，线上必然 `MODULE_NOT_FOUND`；且 `_shared` 位于 `cloudfunctionRoot` 之下，会被微信当作函数扫描。仓库此前没有任何构建或部署步骤处理这一点。

## 决策

1. 共享源码唯一真身移至 `apps/wechat-miniprogram/cloudfunctions-shared/`（在 `cloudfunctionRoot` 之外）。
2. `scripts/build-cloudfunctions.js` 在测试/部署前把共享模块复制进每个 `cloudfunctions/<fn>/_shared/`；复制件由 `.gitignore` 排除，避免双源。
3. 函数内一律 `require("./_shared/...")`；`scripts/validate-miniprogram.js` 拦截任何 `require("../`。

## 备选方案与否决理由

- **npm workspaces / 符号链接**：微信上传器不跟随 workspace 提升与符号链接，需为每个函数引入打包器（esbuild），机制过重。
- **云函数层（Layer）**：只能在 TCB 控制台管理，`miniprogram-ci` 无对应 API，CI 无法拥有它，可复现性差。
- **构建期复制（采纳）**：对微信开发者工具右键部署和 `miniprogram-ci` 的 `ci.cloud.uploadFunction` 都成立，机制最简单、完全受版本控制。

## 影响

- 部署流程增加一个前置步骤（由 npm scripts 与 CI 自动执行）。
- 单测可以在构建后直接 `require` 每个函数入口，验证模块解析。

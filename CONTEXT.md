# VikiSize 仓库上下文

面向人和 Agent 的单页仓库地图。修改代码前先读这里。

## 这是什么

VikiSize 是一个微信小程序：以"生活空间"为核心的协作应用（今日 / 计划 / 生活 / 决策），第一条完整链路是旅行空间（从东京 8 天模板生成可协作编辑的行程）。产品规格在 `docs/specs/`，v1.0 旅行功能规格套件在 `docs/specs/v1.0/`。

## 关键事实（容易踩的坑）

1. **云函数尚未接线**。前端页面全部通过 `apps/wechat-miniprogram/services/localStore.js`（本地存储"数据库"）读写，没有任何页面调用 `wx.cloud.callFunction`（唯一云调用是图片 `wx.cloud.uploadFile`）。`cloudfunctions/` 下的函数是为云端接线准备的后端，行为必须与 localStore 保持一致（见 `docs/specs/v1.0/README.md` 统一约束）。
2. **云函数共享代码有构建步骤**。共享源码在 `apps/wechat-miniprogram/cloudfunctions-shared/`，部署/测试前运行 `node scripts/build-cloudfunctions.js` 把它复制进每个函数目录的 `_shared/`（复制件被 gitignore）。函数内只允许 `require("./_shared/...")`，禁止 `require("../`（validate 会拦截）。背景见 `docs/adr/0001-cloudfunction-shared-packaging.md`。
3. **模板数据是生成的**。`apps/wechat-miniprogram/data/generatedTravelTemplates.js` 由 `npm run build:travel-seed` 从 `data/travel-templates/*.json` 生成；H5 预览由 `npm run build:travel-previews` 生成到 `generated/`（不进 git）。不要手改生成文件。

## 目录地图

- `apps/wechat-miniprogram/` — 小程序本体（`project.config.json` 以此为根）
  - `pages/` — 页面；每个页面目录必须注册在 `app.json`（validate 强制）
  - `services/` — `localStore.js`（当前数据层）、`travelExecution.js`、`mapAdapter.js`、`travelTemplateService.js`
  - `domain/constants.js` — 角色/状态/标签枚举
  - `data/` — 模板 JSON 与生成的种子
  - `cloudfunctions/` — 云函数（每目录独立部署）
  - `cloudfunctions-shared/` — 云函数共享源码（构建时复制）
- `scripts/` — 校验、测试（`scripts/tests/`）、构建、部署脚本
- `docs/` — 规格（specs）、迭代记录（iterations）、版本快照（versions）、ADR（adr）、Agent 约定（agents）

## 常用命令

```bash
npm test                          # node:test 全量测试
npm run lint                      # ESLint
npm run validate:wechat           # 小程序结构校验
npm run validate:travel-templates # 模板 schema 校验
node scripts/build-cloudfunctions.js  # 复制共享代码进各云函数
npm run deploy:wechat             # 上传小程序（需要 WECHAT_* 环境变量）
```

## 流程约定

- 规格驱动：需求变更走 `docs/iterations/YYYY-MM-DD-topic/`，稳定结论合入 `docs/specs/`（见 `docs/project-structure.md`）。
- 架构决策记录在 `docs/adr/`。
- Issue 分诊与标签约定见 `AGENTS.md` 与 `docs/agents/`。

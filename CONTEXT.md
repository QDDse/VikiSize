# VikiSize 仓库上下文

面向人和 Agent 的单页仓库地图。修改代码前先读这里。

## 这是什么

VikiSize 是一个个人微信小程序，目前只保留两条主线：旅行协作，以及 Fitness PlanOps（训练/健康周报、计划 Diff、人工确认）。旅行仍以空间承载；Fitness 是账号级收件箱，不属于旅行空间。产品规格在 `docs/specs/`，v1.0 旅行功能规格套件在 `docs/specs/v1.0/`。

## 关键事实（容易踩的坑）

1. **旅行仍是 local-first，Fitness 已接云函数**。旅行页面通过 `localStore.js` 读写；Fitness 通过 `fitnessRepository.js` 优先调用 `wx.cloud.callFunction`，云端不可用时回退本机缓存。两端的数据契约与权限边界不能混用。
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
npm run deploy:wechat:cloud       # 部署 Fitness 云函数（还需 WECHAT_CLOUD_ENV_ID）
npm run fitness:publish -- <json> # 从外部 Pipeline 发布 Fitness Delivery
```

## 流程约定

- 规格驱动：需求变更走 `docs/iterations/YYYY-MM-DD-topic/`，稳定结论合入 `docs/specs/`（见 `docs/project-structure.md`）。
- 架构决策记录在 `docs/adr/`。
- Fitness Pipeline 的触发、凭证、HTTP 网关和验收见 `docs/fitness-pipeline.md`。
- Issue 分诊与标签约定见 `AGENTS.md` 与 `docs/agents/`。

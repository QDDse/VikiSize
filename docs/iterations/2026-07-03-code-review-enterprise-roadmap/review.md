# VikiSize 全仓库代码评审（2026-07-03）

本轮评审覆盖三个层面：小程序前端（`apps/wechat-miniprogram/`，不含云函数）、云函数后端（`cloudfunctions/`，约 34 个函数）、仓库基础设施（脚本、CI、文档、卫生）。结论先行：

- 规格文档体系（`docs/specs/`、`docs/iterations/`）质量很高，是仓库最强的资产。
- 云函数后端存在**一个部署级致命问题**和**多个高危安全漏洞**；且前端目前完全没有调用云函数（全部走 `localStore` 本地存储），后端处于"未接线"状态。
- 基础设施缺失：CI 从不运行任何测试或校验；没有 lint/format/类型工具；存在死代码和重复产物。

严重级别：P0 = 致命/安全，P1 = 功能缺陷/数据风险，P2 = 质量/卫生。

## 一、P0：部署级致命问题

### D0 云函数共享代码无法随函数部署

所有云函数都写作 `require("../_shared/cloud")`（如 `cloudfunctions/createSpace/index.js:1`）。微信云开发**按函数目录独立打包上传**，`../_shared` 不会进入部署包，线上必然 `MODULE_NOT_FOUND`。仓库没有任何构建/复制步骤：`scripts/upload-wechat.js` 只上传小程序前端，从不部署云函数。另外 `_shared` 目录本身位于 `cloudfunctionRoot` 之下，会被微信当作一个"函数"扫描，也是隐患。

**修复方向**：共享源码移出 `cloudfunctions/`（改为 `cloudfunctions-shared/`），新增构建脚本在部署前把共享模块复制进每个函数目录，函数内改为 `require("./_shared/...")`，并在 `validate-miniprogram.js` 中加检查禁止 `require("../`。

## 二、P0：安全漏洞

### S1 `upsertCard` 越权更新（IDOR）

`cloudfunctions/upsertCard/index.js:5` 用**客户端传入的** `event.spaceId` 做权限校验，更新分支（第 25-38 行）却直接更新 `cards.doc(event.id)`，从不校验该卡片是否属于 `event.spaceId`。任何空间的成员都可以用自己有写权限的 spaceId + 任意受害卡片 id，改写其他空间的卡片。对比 `addComment`/`archiveCard` 的做法（先取卡片、以卡片上的 `spaceId` 为准）即为正确姿势。

### S2 邀请 token 可猜测且永不过期

`cloudfunctions/createInvitation/index.js:10` 与 `services/localStore.js:28`（`newId`）都用 `Date.now() + Math.random()` 生成 token。`Math.random` 非加密随机，有效熵只有约 6 个 base36 字符，且前缀是可推算的时间戳。token 是加入空间的唯一凭证，却没有 `expiresAt`。应改用 `crypto.randomBytes`/`randomUUID` 并加过期时间。

### S3 `acceptInvitation` 无幂等、有竞态

`cloudfunctions/acceptInvitation/index.js:6-27`：不检查用户是否已是成员（重复接受产生重复 `space_members` 记录）；读 pending 邀请和翻转状态之间非原子，两个并发接受都会成功。需要事务/条件更新 + 按 `(spaceId,userId)` 去重。

### S4 `dispatchReminders` 无调用鉴权，且提醒永远发不出去

`cloudfunctions/dispatchReminders/index.js` 没有任何身份/来源校验，若可被 `callFunction` 调用则任何用户都能驱动派发。更严重的是它发送到 `reminder.recipientOpenid`（第 15 行），而 `scheduleReminder/index.js:17` 只存过 `recipientUserId`——`touser` 永远是 `undefined`，**所有模板消息提醒都会失败**并被标记为 `failed`。另外 `limit(50)` 无循环，积压会无限增长。

### S5 服务端完全没有读路径与安全规则

仓库中没有任何读/查询云函数，也没有数据库安全规则文件。行程节点内的 `sensitiveFields`（确认码、内部预算备注）没有服务端脱敏路径；现有的访客脱敏（`localStore.js` 的 `projectTravelInstanceForRole`）只是客户端展示过滤，不是访问控制。云端接线（Phase 3）前必须补：deny-all 安全规则 + 带脱敏的查询函数。

### S6 共享层竞态

- `_shared/cloud.js:23` `getOrCreateUser`：查询-再创建非原子，并发登录会产生重复用户记录。
- `_shared/travelEditor.js`：`expectedRevision` 检查在内存中做（先读、比较、整文档 `set()` 回写），读与写之间存在 TOCTOU，两个客户端可同时通过检查互相覆盖；且 `expectedRevision` 是可选的，缺省时完全没有并发保护。
- `createAttachmentRecord`/`deleteAttachment` 手工 `revision + 1` 回写整个 instance，无事务、无版本守卫。

## 三、P1：功能缺陷与数据风险

| # | 问题 | 位置 |
| --- | --- | --- |
| F1 | **选择任何模板都会创建东京行程**：`travel-template-detail` 调 `createSpace` 时不传所选模板 id，`createTravelInstanceFromTemplateRecord` 硬编码 `travel_templates[0]`。注册表里的模板"可浏览但永远不可实例化" | `pages/travel-template-detail/index.js:29`、`services/localStore.js:230` |
| F2 | **未知状态版本静默清空用户数据**：`readRawState` 只接受 version 1/2，其他值直接落入 `createInitialState()`，无备份 | `services/localStore.js:107→118` |
| F3 | **整库状态推入视图层**：`getCurrentContext()` 返回整个 state，各页 `setData({ context })` 每次 `onShow` 把整个本地数据库序列化过 JS↔渲染桥 | `localStore.js:397-403`、`pages/today/index.js:20` 等 |
| F4 | 读路径无 try/catch，迁移失败即白屏 | 各 tab 页 `onShow`/`refresh` |
| F5 | 多页无空间时解引用 `context.space` 崩溃 | `travel-node-editor:8`、`travel-candidates:2`、`travel-day-editor:7`、`space-settings:60` |
| F6 | `onShareAppMessage` 作为副作用创建邀请记录（分享回调里可能抛错且被平台吞掉） | `pages/space-settings/index.js:60` |
| F7 | 图片上传 async 回调 rejection 未处理、无并发锁，可超 9 张上限 | `pages/travel-node-editor/index.js:28-35` |
| F8 | 无上限查询：`listTravelTemplates` 等不带 `.limit()`，微信服务端默认 20 条，超出静默截断 | `cloudfunctions/listTravelTemplates/index.js:4` 等 |
| F9 | 校验器潜在崩溃：source 缺 `url` 字段时直接抛 TypeError 而不是产出校验错误 | `scripts/travel-templates/lib.js:55` |

## 四、P2：质量与卫生

### 代码质量

- 云函数间约 40-50% 是复制粘贴的脚手架：`add()` → `update({id:_id})` 镜像写重复约 30 处（第二次写失败会留下 `id:""` 脏数据，且写成本翻倍）；活动日志写入重复约 8 处；响应形状不统一（`{user}`/`{ok:true}`/`{id}`……）；错误大多是裸 `Error(中文)` 无 `code`，客户端无法分支处理；全仓库没有任何事务。
- `wx-server-sdk: "latest"` 在全部函数中未锁版本，部署不可复现。
- 死代码：`pages/{home,profile,records,services,travel}` 5 个页面未注册于 `app.json`，加 `utils/state.js` 共约 450 行，全部来自旧"尺码助手"时代。
- `test-travel-collaboration.js` 一行多语句的压缩风格，与其余 5 个测试脚本不一致。
- 前端零组件化（没有 `components/`），约 8 个页面重复同一套 `refresh()` 样板。

### 仓库卫生

- `index.html` 与 `关东东京8天旅行计划.html` 字节级相同（43KB，md5 一致），冗余；`docs/project-structure.md:46-48` 本身已把它列为待清理项。
- `generated/travel-previews/` 是 `npm run build:travel-previews` 的构建产物，却被提交进 git。
- `AGENTS.md:15` 引用的 `CONTEXT.md` 和 `docs/adr/` 不存在，文档漂移。
- `wechat-mini-program-ui.html` 是无主的设计稿残留。

### 基础设施缺失

- **CI 不运行任何测试**：`deploy-wechat.yml` 直接 `npm ci` → 上传，而 `docs/specs/v1.0/README.md:50-51` 的完成定义明确要求 `validate:wechat` 和 `test:domain` 通过。
- 没有聚合 `npm test`；6 个测试脚本是裸 assert 脚本，无测试运行器、无用例命名、无汇总。
- 没有 ESLint/Prettier、没有 TypeScript/JSDoc 类型、没有提交钩子、没有 PR 模板/Dependabot/CODEOWNERS。

## 五、值得保留的优点

- 规格驱动流程完整：S1-S5 规格 + 验收矩阵 + 迭代记录 + 版本快照，与实现相互对应。
- `validate-miniprogram.js` 是一个扎实的结构化冒烟门（页面四件套、tabBar、云函数边界、JS 可编译性）。
- 领域层有正确直觉：乐观并发 `revision` + `CONFLICT` 错误码、访客脱敏意识、附件 MIME/大小/数量上限、WebView URL 白名单、WGS84→GCJ02 转换、时区感知的"今日"逻辑、迁移前备份。
- 旅行编辑器云函数是真正的共享收敛（14 个函数一行委托 `travelEditor.handle`）。

## 六、本轮修复范围

见同目录 `roadmap.md`。本轮（Phase 0 + Phase 1）落地：仓库卫生、CI/lint/测试基建、D0 打包修复、S1-S4/S6(部分)/F1/F2/F5/F6/F8/F9 修复及回归测试。F3/F4/F7 与组件化、云端接线归入 Phase 2/3。

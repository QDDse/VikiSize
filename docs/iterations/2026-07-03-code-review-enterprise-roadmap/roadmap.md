# VikiSize 企业级演进路线图（2026-07-03）

依据同目录 `review.md` 的评审结论，分四个阶段推进。指导原则：

1. 云函数尚未被前端调用，这是修契约（响应包络、安全、打包）的最便宜窗口——先修契约（Phase 1），后接线（Phase 3）。
2. 每个修复必须带回归测试，且 CI 强制执行；否则单人 + Agent 的工作流会静默回退。
3. 复用既有资产（`validate-miniprogram.js`、测试脚本、规格流程），不推倒重来。

## Phase 0 — 仓库卫生与 CI 强制（本轮完成）

- 新增 `.github/workflows/ci.yml`：push/PR 上运行 lint、全部测试、`validate:wechat`、`validate:travel-templates`。
- 6 个裸 assert 脚本迁移到 `node:test`（Node 20 内置，零依赖），聚合为 `npm test`；重写压缩风格的协作测试。
- ESLint（扁平配置，只开正确性规则）。
- 锁定全部云函数的 `wx-server-sdk` 版本。
- 删除死代码（5 个未注册页面 + `utils/state.js`）、重复的根 HTML、git 中的 `generated/` 构建产物。
- 创建 `CONTEXT.md` 和 `docs/adr/`，修复 `AGENTS.md` 悬空引用。
- PR 模板 + Dependabot。
- 扩展 `validate-miniprogram.js`：pages 目录必须全部注册、云函数禁止 `require("../`、依赖必须锁版本。

## Phase 1 — 致命问题与安全修复（本轮完成）

- **D0 打包**（ADR-0001）：共享源码移至 `cloudfunctions-shared/`，`scripts/build-cloudfunctions.js` 在构建/部署前复制进每个函数目录（复制件 gitignore），函数内 `require("./_shared/...")`。评估过 npm workspace（微信上传器不跟符号链接）与云函数层（`miniprogram-ci` 无 API，CI 无法管理），复制方案对开发者工具右键部署和 CI 都成立。
- **S1**：`upsertCard` 更新分支先取卡片，以库内 `card.spaceId` 校验权限并拒绝跨空间更新。
- **S2**：邀请 token 改为加密随机 + 72 小时过期（前后端一致）。
- **S3**:`acceptInvitation` 幂等（已是成员直接成功）、条件状态翻转关竞态、校验过期。
- **S4**：`scheduleReminder` 记录 `recipientOpenid`；`dispatchReminders` 仅允许定时触发器调用，触发器声明进 `config.json` 纳入代码评审。
- **S6（部分）**：`travelEditor` 改条件版本守卫写入。
- **F1/F2/F5/F6/F8/F9**：模板 id 直通、未知版本先备份再报错、`context.space` 判空、邀请创建移出分享回调、查询显式 `.limit()`、校验器空 url 防御。
- 云函数可测试化：共享层暴露数据库注入点，`scripts/tests/lib/mock-cloud-db.js` 内存模拟微信云数据库，被修函数直接单测。
- 新增 `_shared/repo.js`：`addWithId()`（消灭 add→update 镜像写）、`logActivity()`。

## Phase 2 — 前端架构与质量加固（后续 1-2 周，Agent 迭代）

目标：页面与整库状态解耦，为 Phase 3 云端接线准备好"数据源接口"缝隙。

1. **数据源缝隙（关键动作）**：新增 `services/dataSource.js` 定义页面消费的异步接口（按页返回视图模型而不是原始 state），首个实现委托 `localStore`。页面逐个迁移为只 `setData` 自己的视图模型——同时消灭 F3（整库 setData）。接口从第一天就是异步的，Phase 3 换云端实现即为直接替换。
2. **错误路径**：所有页面 `onLoad/onShow` 包 try/catch + 共享错误视图；`app.js` 挂 `wx.onError`/`onUnhandledRejection`，日志进 `services/telemetry.js` 桩（真实上报后端在 Phase 3）。同时修 F4/F7。
3. **组件化**：把重复的卡片列表项、时间线节点、成员行抽成 `components/`；`validate-miniprogram.js` 增加组件注册校验。
4. **类型（不引入 TypeScript）**：`domain/types.js` 写 JSDoc `@typedef` + `jsconfig.json` `checkJs`，CI 跑 `tsc --noEmit`。单人 + Agent 的微信项目，JSDoc 拿到八成收益、零构建链风险。
5. **测试深度**：`c8` 覆盖率 + 只升不降的下限；每页 selector 合同测试。
6. **提交钩子**：husky + lint-staged。
7. **i18n 仅做地基**：用户可见字符串收敛到 `domain/messages.js`。是否真做多语言是产品决策（面向中文市场，大概率不需要）。

## Phase 3 — 云端接线与生产运维（多周，最大架构动作）

1. **环境**：TCB 开发/生产双环境；env id 进 `config/env.js`；CI 合并到 main 部署函数到 dev，`wechat-v*` tag 部署 prod（复用 Phase 1 的 `deploy:cloud` 脚本，底层 `ci.cloud.uploadFunction`）。
2. **先接认证**：`login` 云函数接入 `app.js` 会话引导，替换 localStore 的合成用户。
3. **CloudDataSource**：Phase 2 接口的第二个实现，走 `wx.cloud.callFunction` + Phase 1 的响应包络 + 重试/超时策略；按模块灰度（先旅行模块，S3-S5 规格覆盖最全），localStore 作为回退。
4. **补读路径**：新增 `getSpaceSnapshot`/`listCards`/`getTravelInstance` 等 4-6 个查询函数，复用共享脱敏（S5 收口）。
5. **数据迁移**：一次性 `migrateLocalState` 函数，首次云登录时吸收 localStore v2 数据，保留本地备份。
6. **安全规则 + 索引**：应用 deny-all 客户端直读规则（`db/security-rules.json`）；`db/indexes.json` 声明查询所需复合索引（`space_members(spaceId,userId)`、`cards(spaceId,module,archivedAt)`、`reminders(status,scheduledAt)`、`invitations(token,status)`）。
7. **定时器**：`dispatchReminders` 触发器随 `config.json` 部署，dev 环境端到端提醒测试。
8. **运维**：真实错误上报（微信实时日志 + telemetry 后端）、云函数日志告警、发布清单、体验版 QA 门。

**Phase 3 启动前需要的产品决策**：

- 离线策略：localStore 是缓存（离线优先同步）还是被整体替换？建议：替换 + 读穿缓存，真正的双向同步是独立项目量级。
- 共享空间的访客访问模型（决定安全规则与脱敏范围）。
- 数据保留/删除政策（微信个人信息合规必答）。

## 验收方式

- 每阶段以 `npm run lint && npm test && npm run validate:wechat && npm run validate:travel-templates` 全绿为底线，CI 强制。
- Phase 1 额外要求：构建后 `node -e "require('.../upsertCard/index.js')"` 模块解析冒烟通过。
- Phase 3 按 `docs/specs/v1.0` S1-S5 验收项在云端模式下重新执行，并用"直连数据库必须失败"的反向测试验证安全规则。

# VikiSize 技能包（vendored Claude skills）

本目录收录经人工挑选的开源 Agent 技能，Claude Code 在本仓库会自动发现加载；其他 Agent 可直接把对应 `SKILL.md` 作为指令喂入。每个技能目录内有 `ATTRIBUTION.md`（上游仓库、收录 commit、许可）。

## 收录清单

| 技能 | 类别 | 用途 | 上游 | 许可 |
| --- | --- | --- | --- | --- |
| `travel-plan-viz` | 旅行 | 把行程生成单文件、可离线、手机优先的 HTML（Leaflet 交互地图 + 每日时间轴 + 行前提醒） | zexuanw958-svg/travel-plan-viz | MIT |
| `road-trip-planner` | 旅行 | 端到端旅行/自驾规划：可导航攻略、核实车程、天气打包清单 | d-wwei/trip-planner | MIT |
| `test-driven-development` | 编码 | 红-绿-重构 TDD 纪律 | obra/superpowers | MIT |
| `systematic-debugging` | 编码 | 四阶段调试法：先理解，后修改 | obra/superpowers | MIT |
| `brainstorming` | 编码 | 写码前先澄清需求、给出可否决的设计 | obra/superpowers | MIT |
| `writing-plans` | 编码 | 把工作拆成带文件路径与验证步骤的小任务 | obra/superpowers | MIT |
| `verification-before-completion` | 编码 | 宣称完成前必须实际验证 | obra/superpowers | MIT |
| `webapp-testing` | 编码 | 用 Playwright 驱动真实浏览器测试 Web 应用 | anthropics/skills | Apache-2.0 |
| `mcp-builder` | 编码 | 开发 MCP 服务器的官方指引 | anthropics/skills | Apache-2.0 |
| `prd-development` | 产品 | PRD 撰写框架 | deanpeters/Product-Manager-Skills | CC BY-NC-SA 4.0 |
| `discovery-process` | 产品 | 需求发现流程 | deanpeters/Product-Manager-Skills | CC BY-NC-SA 4.0 |
| `prioritization-advisor` | 产品 | 优先级排序框架 | deanpeters/Product-Manager-Skills | CC BY-NC-SA 4.0 |
| `jobs-to-be-done` | 产品 | JTBD 需求分析 | deanpeters/Product-Manager-Skills | CC BY-NC-SA 4.0 |
| `ui-ux-pro-max` | UI | 设计系统生成器：50+ UI 风格、161 配色、57 字体组合、多技术栈 | nextlevelbuilder/ui-ux-pro-max-skill | MIT |

## 与仓库流程的衔接

- 旅行技能与 `apps/wechat-miniprogram/data/travel-templates/` 的模板数据契约同源（specs 引用的正是 travel-plan-viz 概念）；生成的单文件 HTML 思路与 `scripts/travel-templates/build-h5.js` 管线一致。
- 产品技能配合 `docs/agents/spec-ssd-workflow.md` 与 `docs/iterations/` 迭代约定使用。
- 编码技能与 `CONTEXT.md`、`docs/adr/` 的工程铁律互补；完成前验证 = 本仓库的 `npm run lint && npm test && npm run validate:wechat`。

## 许可注意

- 大部分技能为 MIT / Apache-2.0。
- 四个产品技能（prd-development、discovery-process、prioritization-advisor、jobs-to-be-done）为 **CC BY-NC-SA 4.0**：非商业、署名、相同方式共享；这四个目录不适用仓库根 LICENSE，商用前请自行评估或联系上游作者。

## 更新方式

从上游浅克隆后整目录覆盖拷贝，并更新对应 `ATTRIBUTION.md` 的 commit。superpowers 的五个技能摘自其完整框架（含更多技能与 hooks），需要全套时请直接安装上游插件。

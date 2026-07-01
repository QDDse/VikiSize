# VikiSize v1.0

## 版本定位

v1.0 以“可信小空间中的旅行协作”为第一条完整产品链路，并保留家庭菜谱作为第二条已定义、后续实现的生活协作链路。

旅行 v1.0 的核心体验：

1. 在旅行模板列表看到封面、标题和简介。
2. 进入只读的精美 HTML 旅行攻略，先完整浏览内容。
3. 用户确认使用后，从模板创建自己空间内的可编辑计划实例。
4. 管理员和成员调整每日行程、地点、时间、交通、预算、提醒、图片和任务。
5. 访客可以浏览，但不能修改。

## 文档索引

Coding 入口：

- [v1.0 旅行 Spec 套件](../../specs/v1.0/README.md)

后续生产 spec 的唯一需求输入：

- [v1.0 旅行需求迭代](../../iterations/2026-07-01-v1.0-travel-requirements/README.md)
- [聚合需求](../../iterations/2026-07-01-v1.0-travel-requirements/requirements.md)
- [需求决策](../../iterations/2026-07-01-v1.0-travel-requirements/decisions.md)
- [Spec 生产计划](../../iterations/2026-07-01-v1.0-travel-requirements/spec-plan.md)

版本阅读材料：

- [旅行功能 PRD](travel-prd.md)
- [旅行功能技术方案](travel-technical-design.md)
- [东京 HTML 资产分析](tokyo-html-analysis.md)

权威和历史文档：

- 主 PRD：`docs/specs/vikisize-life-assistant-mvp.md`
- 旅行空间技术方案：`docs/specs/vikisize-travel-space-technical-design.md`
- 源竞品调研：`docs/iterations/2026-07-01-travel-recipe-research/`
- 源 HTML 接入分析：`docs/iterations/2026-07-01-tokyo-html-v1/`

## v1.0 范围

### P0

- 旅行模板列表和简介。
- 东京 8 天模板详情。
- 托管 H5 只读预览。
- 从模板创建空间旅行计划实例。
- 原生小程序行程编辑器。
- 按天时间线、地点、地图、任务、预算和成员权限。
- 图片附件和微信分享邀请沿用空间能力。

### P1

- 候选地点池。
- 相邻节点交通时间和距离。
- 单日路线优化与撤销。
- 弱网缓存。
- 面向同行人的分享版执行页面。

### 不在 v1.0

- 直接在 H5 中编辑云端旅行实例。
- HTML 与小程序双向实时同步。
- AI 自动生成行程。
- 机票、酒店实时价格和代预订。
- 复杂费用分摊。

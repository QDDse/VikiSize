# VikiSize v1.0 旅行功能 Spec 套件

## 状态

- 阶段：P0 代码已实现，待微信开发者工具与真机验收。
- 需求输入：`docs/iterations/2026-07-01-v1.0-travel-requirements/requirements.md`。
- 决策输入：`docs/iterations/2026-07-01-v1.0-travel-requirements/decisions.md`。
- 目标运行时：微信小程序 + 微信云开发。
- 首个模板：`关东东京8天旅行计划.html`。

## 执行顺序

1. [S1 旅行模板数据与构建](s1-travel-template-data-build-spec.md)
2. [S2 模板浏览与 H5 预览](s2-travel-template-browse-preview-spec.md)
3. [S3 旅行实例与编辑器](s3-travel-instance-editor-spec.md)
4. [S4 地图与今日执行](s4-travel-map-today-spec.md)
5. [S5 旅行协作与附件](s5-travel-collaboration-attachment-spec.md)

S2 和 S3 可在 S1 完成后并行；S4 和 S5 必须基于 S3 的实例与节点契约。

## 统一约束

- 公共模板、H5 和实例初始数据来自同一份版本化模板 JSON。
- H5 只读，不承担空间实例写入。
- 原生小程序承担编辑、权限、附件、任务、提醒、活动和归档。
- 保留现有空间、成员、统一卡片和活动集合，不创建重复体系。
- 本地预览适配器和云函数必须保持相同外部行为。
- P1 能力不得阻塞 P0 完成。

## 需求覆盖矩阵

| 聚合需求 | Spec |
| --- | --- |
| 模板列表、简介、版本 | S1、S2 |
| H5 完整攻略与降级 | S1、S2 |
| 单一模板数据源 | S1 |
| 幂等实例创建 | S3 |
| 日期、节点、模块编辑 | S3 |
| 候选地点池 | S3 |
| 地图与时间线同源 | S4 |
| 今日执行视图 | S4 |
| 角色、敏感字段 | S5 |
| 图片、评论、意见、提醒 | S5 |
| 派生任务和来源追溯 | S3、S5 |
| 旅行归档与恢复 | S3、S4 |

## Coding 完成定义

- 五份 spec 的 P0 验收项全部通过。
- `npm run validate:wechat` 和 `npm run test:domain` 通过。
- 新增模板构建和 schema 测试通过。
- 微信开发者工具完成至少一次 iOS 和 Android 真机验证；无法执行时必须记录缺口。
- H5 正式域名未就绪时允许配置占位，但原生浏览和实例创建必须可测试。

## 实现记录（2026-07-01）

- S1：模板 JSON、Schema、注册表、小程序种子和 H5 构建完成。
- S2：模板列表、详情、H5 预览和原生降级完成。
- S3：幂等实例、v1 到 v2 本地迁移、日期/节点/模块/候选地点编辑完成。
- S4：坐标适配、按日地图、微信地图打开和今日执行状态完成。
- S5：访客脱敏、图片附件、派生任务、revision 冲突保护完成。
- 自动化：模板、浏览、编辑、地图今日、协作附件、领域与小程序静态校验均通过。
- 待验收：微信开发者工具编译、云函数部署联调、iOS/Android 真机地图与图片上传。

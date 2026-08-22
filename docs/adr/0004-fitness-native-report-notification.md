# ADR 0004：Fitness 原生报告与无 H5 通知

- 状态：Accepted
- 日期：2026-08-23
- 取代：ADR 0003 的 Server酱正文边界，以及 `2026-08-18-fitness-report-notification` 中的新 H5 分发方案

## 决策

1. VikiSize 小程序 `pages/fitness-detail/index` 是 Fitness 完整报告与计划操作的当前唯一入口。
2. 微信订阅消息继续直接打开 `/pages/fitness-detail/index?id=<deliveryId>`，不经过 `web-view` 或外部网页。
3. Server酱默认 `minimal` 模式只提醒报告到达；`report` 模式直接展示摘要、最多 6 个指标、5 条洞察和 5 条建议，并以文字引导用户回到小程序。
4. 新通知不再读取 `FITNESS_REPORT_H5_URL`，不生成 H5 URL，也不把报告投影放进 `#report` Fragment。
5. 旧 H5 报告壳暂时保留，只用于已经发出的历史链接；它不再属于新报告主链路或验收范围。

## 隐私边界

- `report` 模式会把报告投影发送给 Server酱，启用该模式即表示接受这一外部展示范围。
- 投影不得包含原始健康样本、用户凭证、完整健康档案或计划写回请求。
- 不希望外发报告正文时使用 `minimal`；无论哪种模式，通知失败都不得回滚 Delivery 入箱。

## 理由

- 微信小程序已经有完整原生详情页，原生路径能够继续完成计划采纳、拒绝和训记写回。
- H5 链接会受小程序业务域名、浏览器上下文和 Fragment 完整性影响，增加一个没有交互能力的失败入口。
- Server酱报告模式本身已经包含可读摘要；需要完整上下文或操作时回到原生小程序，路径更清晰。

## 验收

- 微信订阅消息的 `page` 精确指向对应 Delivery 的原生详情页。
- Server酱 `report` 模式包含摘要、指标、洞察和建议，但不包含配置的 H5 域名或 `#report=`。
- 原生详情页继续展示完整报告，并保留计划确认与写回保护。
- 定向云函数测试、完整测试、Lint 和小程序静态校验均通过。

## 回滚

恢复 Server酱中的 H5 URL 拼接和部署变量注入即可；不涉及 Delivery Schema、数据库迁移或历史数据变更。

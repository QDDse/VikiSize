# ADR 0002：Fitness PlanOps 使用账号级边界

- 状态：Accepted
- 日期：2026-08-17

## 决策

旅行继续使用 `spaceId` 做多人协作隔离；Fitness Delivery、体测数据和发布通道全部使用 `userId` 隔离，不创建“健身空间”。

外部 Pipeline 只能通过一次性展示的发布 Token 写入该用户的收件箱。数据库只保存 Token 的 SHA-256 哈希。报告与计划分别遵循 `fitness_review_v2`、`plan_patch_v1`，由 `fitness_delivery_v1` 封装；服务端重新计算内容哈希。计划决策必须携带当前 `patchHash`，且同一 Patch 只能决策一次。

## 理由

- 健身数据是个人健康数据，不应继承旅行空间的成员权限。
- Pipeline 写入与用户阅读/确认是两种身份，需要不同凭证。
- 哈希绑定避免用户看到 A 版本却确认了已经变化的 B 版本。

## 后果

- `fitness_channels`、`fitness_deliveries`、`body_measurements` 是账号级集合。
- 小程序端云调用失败时仅回退本地缓存，不把云端失败伪装成同步成功。
- HTTP 网关路由是环境配置，不能仅靠代码仓库完成，需要部署后绑定一次。

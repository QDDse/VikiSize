# ADR 0003：Fitness 报告通知与训记写回边界

- 状态：Accepted
- 日期：2026-08-18

## 决策

1. GPT / Skill 生成的 `fitness_review_v2` 先投递到 VikiSize 收件箱；微信订阅消息只是“报告已到达”的一次性提醒，提醒失败不得回滚或伪装报告投递失败。
2. “开启周报提醒”使用 `wx.requestSubscribeMessage`。授权结果保存到当前微信账号的 `users.fitnessWeeklySubscription`；成功发送一次后标记为 `consumed`，用户可再次授权下一次提醒。
3. 模板 ID 和字段映射均由云函数环境变量提供，不把环境配置或凭证写入小程序包：
   - `FITNESS_WEEKLY_REPORT_TEMPLATE_ID`
   - `FITNESS_WEEKLY_REPORT_TEMPLATE_BINDINGS`，例如 `{"thing1":"title","time2":"generatedAt","thing3":"summary"}`
4. Server酱作为并行的长期通知通道。每个首次入库的 `deliveryId` 最多调用一次 Server酱；幂等重试不重复提醒。SendKey 只从 `ingestFitnessDelivery` 的 `SERVERCHAN_SENDKEY` 环境变量读取。
5. Server酱正文只说明报告周期和查看入口，不发送健康指标、分析结论或计划内容。Server酱或微信通知失败都不得回滚 Delivery，结果分别记录在 `notification.channels`。
6. 训记官方计划 API 只读。采纳后的自动写回仅支持训记训练记录 `api_upsert_trains_for_llm_v2`，不宣称修改官方计划。
7. 可写 Patch 必须把 `writeback.summary` 和无凭证的 `writeback.request` 一起纳入 `patchHash`。小程序展示摘要后，用户点击“确认采纳并写回”才构成该哈希版本的明确确认。
8. 云函数使用 `XUNJI_TRAINING_API_KEY` 读取部署环境中的密钥，依次执行 dry-run、正式 upsert、回读。正式写入成功但回读失败时记录 `applied_unverified`，禁止自动重复写入。

## 理由

- 微信订阅消息是一次性授权，不能把“曾经开启”理解为永久推送许可。
- Server酱不依赖微信小程序的一次性订阅授权，适合作为 GPT 定时任务每次完成后的持久提醒；实际发送仍受 Server酱账号套餐与限额约束。
- 报告持久化是主链路，通知是可降级旁路。
- 健身写入属于个人健康数据变更，必须让用户确认的内容与服务端真正提交的请求保持哈希绑定。
- 训记当前开放能力不支持修改官方计划，训练记录写入与计划建议需要明确区分。

## 后果

- 新增 `getFitnessNotificationSettings`、`subscribeFitnessWeeklyReport` 两个云函数。
- `ingestFitnessDelivery` 在新报告落库后并行尝试微信与 Server酱提醒，并把各通道结果写到 Delivery 的 `notification.channels` 字段。
- `plan_patch_v1.writeback` 是可选字段；旧报告仍可只在 VikiSize 内记录采纳/拒绝。
- 部署后仍需在 CloudBase 为相关云函数配置模板和训记密钥，且需要用真实模板、真实 Patch 分别做一次端到端验收。

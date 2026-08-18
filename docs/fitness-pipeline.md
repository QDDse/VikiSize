# Fitness Pipeline 运行手册

## 链路

```text
训记 / Apple 健康 / 体脂秤报告图
  -> 采集与标准化
  -> 周期分析（fitness_review_v2）
  -> 可选计划变更（plan_patch_v1）
  -> publish-fitness-delivery.js 计算双层哈希
  -> CloudBase HTTP 网关
  -> ingestFitnessDelivery
  -> 小程序 Fitness 收件箱
  -> Server酱长期提醒 + 可选微信一次性订阅消息
  -> 用户采纳 / 拒绝（绑定 patchHash）
  -> 可选训记训练记录 dry-run / upsert / 回读
```

## 一次性配置

1. 设置 GitHub Secret：`WECHAT_UPLOAD_PRIVATE_KEY`、`WECHAT_CLOUD_ENV_ID`。
2. 运行部署 Action，先上传 Fitness 云函数，再上传小程序开发版本。
3. 在 CloudBase HTTP 网关给 `ingestFitnessDelivery` 绑定 POST 路径（例如 `/fitness/deliveries`），保存完整 HTTPS 地址。HTTP 路由属于环境资源，本仓库的 `miniprogram-ci` 上传不会自动创建它。
4. 在小程序“健身 → 接入 Pipeline”生成通道。`publishToken` 只展示一次，保存到 Pipeline Secret；重新生成会废弃旧通道。
5. 在微信公众平台选择周报订阅消息模板，并在 `getFitnessNotificationSettings`、`subscribeFitnessWeeklyReport`、`ingestFitnessDelivery` 三个云函数环境配置：
   - `FITNESS_WEEKLY_REPORT_TEMPLATE_ID`
   - `FITNESS_WEEKLY_REPORT_TEMPLATE_BINDINGS`，例如 `{"thing1":"title","time2":"generatedAt","thing3":"summary"}`
6. 若要在采纳后写回训记训练记录，为 `decideFitnessPlanPatch` 配置 `XUNJI_TRAINING_API_KEY`。密钥只进入云函数环境变量，不进入仓库或 Delivery。可选的 `XUNJI_TRAINING_BASE_URL` 仅用于受控测试，生产默认 `https://trains.xunjiapp.cn`。
7. 在 Server酱复制 SendKey，并把它保存为 GitHub Repository Secret `SERVERCHAN_SENDKEY`。部署 Action 会把它合并到 `ingestFitnessDelivery` 的云函数环境，仓库和小程序包均不保存明文。
8. 在 GitHub Repository Variables 配置报告式提醒：
   - `FITNESS_SERVERCHAN_DETAIL_LEVEL=report`
   - `FITNESS_REPORT_H5_URL=https://<HTTP 网关域名>/fitness/deliveries?view=report`

`FITNESS_REPORT_H5_URL` 不是密钥。H5 复用现有 `ingestFitnessDelivery` HTTP 路由的 GET 能力，无需再新建网关路径。

GitHub Action 会从 Repository Variables 读取微信模板配置，从 Repository Secrets 读取 Server酱和训记 Key，并只合并这些非空变量，不删除云函数已有环境变量。未配置时保持当前云端值不变。

## Pipeline Secret

```text
FITNESS_DELIVERY_ENDPOINT=https://<your-domain>/fitness/deliveries
FITNESS_CHANNEL_ID=<小程序生成>
FITNESS_PUBLISH_TOKEN=<小程序生成，只展示一次>
```

不要把以上值提交到 Git。服务端数据库只保存 Token 哈希。

## 发布

```bash
# 先检查最终 payload 和哈希，不联网
npm run fitness:publish -- examples/fitness-delivery.sample.json --dry-run

# Pipeline 正式推送
npm run fitness:publish -- /path/to/generated-delivery.json
```

发布器会补齐 `planPatch.patchHash` 和 `delivery.contentHash`。服务端重新计算两层哈希；同一 `deliveryId + contentHash` 幂等成功，同一 ID 不同内容会报冲突。

## 触发方式

- 每周复盘：定时任务在固定时间拉取训记/健康数据，生成一份 Delivery 并推送。
- 单次训练后：只更新数据仓，不立即改计划；避免高频噪声。
- 明显异常：生成报告但 `planPatch` 可为空，由用户先阅读。
- 体脂秤：当前从微信小程序导出的报告图手动上传，并人工核对体重/体脂率；尚未启用 OCR，也没有读取第三方小程序私有数据。
- Apple 健康：ChatGPT App 显示已关联只证明授权入口完成；每次任务仍需检查实际返回字段、日期范围和最新同步时间，缺失字段不得按 0 处理。

## 周报订阅提醒

1. 用户在健身页点击“开启周报提醒”。
2. 小程序调用 `wx.requestSubscribeMessage`，仅在返回 `accept` 后保存一次授权。
3. 新 Delivery 成功入库后，服务端向该用户发送一次订阅消息，并把授权标记为已消费。
4. 通知发送失败不影响报告入箱；页面会提示用户重新开启下一次提醒。

## Server酱长期提醒

1. GPT 定时任务仍只需向 Fitness Delivery HTTP 入口发布报告，不直接持有 Server酱 SendKey。
2. `ingestFitnessDelivery` 对首次入库的 `deliveryId` 发送一条 Server酱通知；相同 Delivery 的网络重试不会重复通知。
3. 默认 `minimal` 模式只包含报告周期和“打开 VikiSize 查看”的提示；显式配置 `FITNESS_SERVERCHAN_DETAIL_LEVEL=report` 后，通知包含报告摘要、最多 6 个指标、最多 5 条洞察和 5 条建议。
4. 报告模式配置 `FITNESS_REPORT_H5_URL` 后会附完整 H5 链接。报告投影编码在 URL `# Fragment` 中，不随 HTTP 请求传给 CloudBase；H5 壳不查询数据库或健康接口。
5. Fragment 仍会存在于 Server酱消息和用户浏览器历史中，因此只投影周报摘要，不放原始健康样本、凭证、完整档案或计划写回请求。
6. Server酱失败会写入 `delivery.notification.channels.serverChan`，报告仍正常出现在小程序收件箱。
7. Server酱账号套餐可能有每日发送额度；超过额度时收件箱仍可用，但该次外部提醒会失败。

## 训记写回

- 训记官方计划接口目前只读；这里写回的是训练记录/训练日，不是官方计划。
- `planPatch.writeback` 必须包含用户可读的 `summary` 与无凭证的 `request`，两者都受 `patchHash` 保护。
- 点击“确认采纳并写回”后，云函数按 dry-run → upsert → query 回读执行。
- 正式写入成功但回读失败时标记 `applied_unverified`，不会自动再写一次。

## 验收边界

- GitHub Action 成功只代表云函数已上传、小程序开发版本已上传，不等于微信审核或生产发布。
- HTTP 网关没有绑定时，外部 Pipeline 仍不可达；用一次真实 Delivery 返回 2xx 且小程序可见，才算端到端跑通。
- H5 验收需要对同一 HTTP 路由发起 `GET ?view=report` 并返回 `text/html`；报告链接打开后应只解析 Fragment，不产生健康数据读取请求。

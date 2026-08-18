# Fitness 报告式通知与 H5 镜像

## 目标

把“报告已到达”的两行 Server酱提醒升级为可直接阅读的周报，同时提供移动端 H5 完整报告镜像。VikiSize 小程序收件箱仍是权威记录。

## 用户体验

1. GPT/Skill 发布一个新的 Fitness Delivery。
2. 小程序收件箱保存报告，重复 Delivery 不重复入箱或提醒。
3. Server酱报告模式展示周期、摘要、关键指标、洞察和行动建议。
4. 用户点击“打开完整 H5 报告”，看到适配手机的只读报告页。

## 边界

- `minimal` 为默认隐私模式；只有 `FITNESS_SERVERCHAN_DETAIL_LEVEL=report` 才外发报告投影。
- H5 只解析 URL Fragment，不调用报告查询接口。
- Fragment 不包含原始健康样本、凭证、完整档案、用户标识或训记写回请求。
- H5 是便捷镜像，不承担计划采纳、拒绝或写回；相关操作仍在小程序详情页完成。
- 发布与部署分离，代码完成不等于云端生效。

## 验收

- 报告模式通知包含摘要、指标、洞察、建议和 H5 链接。
- 默认模式不包含健康分析正文。
- `GET /fitness/deliveries?view=report` 返回带 CSP 的通用 HTML 壳。
- HTML 壳不包含个人报告，不请求后台数据，只解析 `#report=`。
- 重复 `deliveryId + contentHash` 不重复发送通知。

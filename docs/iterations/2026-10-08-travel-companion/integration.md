# 0.3.5 基线集成与 0.3.6 开发版范围

## 基线纠正

部署前核对 GitHub Actions 最新成功运行 33325807532，确认开发版为 0.3.5，提交 778698d1dac316b423ea73107deced6a7b2ca76a（agent/fitness-pipeline-publish），而非旧 master。原旅行分支 6318dcb 不直接部署，避免回退 Fitness。

新分支 integration/travel-companion-035 直接以 778698d 为父提交，选择性移植旅行改动。三处冲突是旅行首页 WXML、旅行计划 WXML/WXSS。保留新版首页结构、主导航和全部 Fitness 代码，只增加旅行入口和本次旅行详情。首页入口允许换行以适应窄屏。

## 保留证据

以下路径与 778698d 的 git diff 为零：

- apps/wechat-miniprogram/cloudfunctions/ 与 cloudfunctions-shared/（含 9 个 Fitness 函数）
- pages/fitness/、pages/fitness-detail/、pages/body-import/
- services/fitnessRepository.js、app.json、app.wxss
- scripts/deploy-wechat-cloudfunctions.js、.github/workflows/deploy-wechat.yml

因此保留原生报告、通知设置、周报订阅、通知发送、训记写回及确认/哈希保护；未修改环境/权限/数据迁移逻辑。localStore 只增加旅行小票与写盘成功后更新缓存的处理。

## 验证

- lint、validate:wechat、validate:travel-templates、git diff --check 通过。
- npm test：78/78 通过，包括原基线 Fitness 与本次旅行用例。
- CI 同款模块解析 smoke：41 个入口通过。
- WXML 页面标签与事件绑定检查通过；没有微信开发者工具，未进行真机验收。

## 授权部署清单

预定开发版 0.3.6，robot 1，使用已有 WECHAT_CLOUD_ENV_ID，不合并 master，不发布正式版。

workflow_dispatch 显式 cloud_functions：createFitnessChannel,ingestFitnessDelivery,listFitnessDeliveries,getFitnessDelivery,decideFitnessPlanPatch,importBodyMeasurement,listBodyMeasurements。

仅更新此前已授权 7 个函数（与已部署 0.3.5 代码相同）；getFitnessNotificationSettings 和 subscribeFitnessWeeklyReport 保留现状、不重部署。upload_miniprogram=true。版本、并发运行和远程 SHA 须在实际启动前再次核验。

最终 workflow 和部署脚本相对于已成功部署基线无改动，不增加付费调用或数据迁移。真实通知/训记写回仍只由现有业务事件触发，部署不触发这些业务动作。

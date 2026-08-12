# 旅行体验改版技术影响

## 修改范围

- pages/travel-plan/: 重构为日期导航、地图/日程切换、旅行时间线和底部快捷操作。
- pages/travel-candidates/: 增加地图选点、分类、筛选、多选和批量排期。
- pages/travel-node-editor/: 增加时间选择器、地图选点、交通选择和渐进式高级信息。
- pages/travel-day-editor/: 对齐新的表单和固定保存操作。
- pages/plans/: 调整旅行入口和摘要层级。
- services/routeOptimizer.js: 增加纯函数路线距离计算和最近邻排序。
- services/mapAdapter.js: 调整路线和选中标记的视觉状态。
- app.json: 声明 chooseLocation 隐私接口和位置用途。

## 数据模型

不新增集合或持久化字段。继续复用 candidate.coordinate、travelNode.coordinate、travelNode.transport、travelNode.estimatedCost 和 travelNode.needsBooking。

地图选点写入 latitude、longitude 和 system: gcj02。

## 路线整理约束

当前实现使用坐标间的 Haversine 直线距离和最近邻算法：

- 固定第一站。
- 只有全部节点拥有有效坐标时才允许重排。
- 只作为距离整理建议，不声称是真实最优交通路线。
- 应用前显示预计减少的直线距离，并提醒用户复核交通时刻和预约顺序。

未来接入路网 API 后，routeOptimizer 可保留为离线回退。

## 隐私与发布

使用 wx.chooseLocation 前，微信公众平台仍需完成：

- 开通对应接口权限。
- 更新用户隐私保护指引中的位置用途。
- 真机验证拒绝授权和取消选点流程。

## 测试

- 新增路线距离、有效重排和坐标缺失保护测试。
- 继续运行 lint、小程序结构校验、模板校验和全量测试。
- 发布前需要在微信开发者工具中人工验证地图选点、地图标记和底部安全区。


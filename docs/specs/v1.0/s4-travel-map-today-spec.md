# S4 地图与今日执行 Spec

## 目标

让同一组旅行节点同时驱动每日时间线、地图点位和今日执行视图，并提供可靠的微信地图打开能力。

## 非目标

- 不在 P0 自动计算最优路线。
- 不承诺跨国公共交通实时数据。
- 不实现后台持续定位。
- 不复制一份地图专用节点数据。

## 当前基线

- H5 使用 Leaflet 和 WGS84 风格经纬度展示全部点位。
- 小程序精简模板缺少坐标。
- `pages/travel-plan` 没有 `map` 组件。
- `getTodaySummary` 固定取实例第一天，不按当前日期和时区计算。

## 坐标约定

模板保留来源坐标和坐标系：

```js
coordinate: {
  latitude,
  longitude,
  system: "wgs84" | "gcj02"
}
```

- 领域层不得假设全部坐标可直接用于小程序地图。
- 新增 `mapAdapter.toMiniProgramCoordinate(coordinate)` 集中转换。
- 转换失败时节点仍显示文本地点，但不生成 marker。
- 禁止在页面中散落坐标转换实现。

## 地图 ViewModel

```js
{
  latitude,
  longitude,
  scale,
  markers: [{
    id: nodeId,
    latitude,
    longitude,
    title,
    label: { content: orderText },
    iconPath,
    width,
    height
  }],
  polyline: [{ points, color, width, dottedLine }],
  activeNodeId
}
```

- markers 由当前所选日期的有效坐标节点派生。
- polyline 按节点 `order` 连接，仅表达计划顺序，不表示真实导航线路。
- marker ID 必须可反查 node ID。

## 旅行计划页地图

- 默认展示所选日期地图和时间线。
- 小屏可用分段控件切换 `时间线/地图`；不做两个滚动区抢占首屏。
- 点击时间线节点：更新 `activeNodeId` 并聚焦 marker。
- 点击 marker：滚动或选中对应节点卡片。
- 无坐标节点显示“补充地点”，不从时间线隐藏。
- 地图为空时展示明确空状态。

## 打开地图

`openTravelNodeLocation(nodeId)`：

1. 校验节点有可用坐标。
2. 转换为微信地图要求坐标。
3. 调用 `wx.openLocation`，传名称、地址和坐标。
4. 失败时允许复制地址，不阻塞页面。

相邻节点的交通方式来自前一节点的 `transport` 或独立 leg 字段；P0 不调用路线 API。

## 今日匹配

使用实例 `timezone` 计算本地日期：

```js
resolveTravelDay(instance, now): Day | null
```

规则：

- 优先匹配 `day.date === todayInInstanceTimezone`。
- 旅行未开始：返回首日和距出发天数，仅作预告。
- 旅行已结束未归档：返回最后一日完成提示。
- 已归档：不进入今日默认结果。
- 不再固定取 `days[0]`。

## 当前和下一站

```js
resolveExecutionState(day, now): {
  currentNode,
  nextNode,
  completedNodes,
  upcomingNodes
}
```

- 有开始/结束时间时按时间判断。
- 只有开始时间时，以后一节点开始时间为区间上限。
- 无时间节点保留在“今日其他安排”。
- cancelled 节点不作为当前或下一站。

## 今日 ViewModel

```js
{
  travelState: "before" | "during" | "after" | "none",
  day,
  currentNode,
  nextNode,
  reminders,
  pendingConfirmations,
  alternatives,
  canEdit
}
```

页面优先级：

1. 当前节点。
2. 下一站与打开地图。
3. 票据缩略图和预约状态。
4. 待确认与提醒。
5. 备选方案。
6. 完整时间线入口。

## H5 地图

- H5 继续使用 Leaflet 和模板原坐标。
- 构建测试确认 H5 点位数等于模板有效坐标节点数。
- H5 与小程序可使用不同地图引擎，但节点 ID、顺序和模板版本一致。

## 失败处理

- 定位权限不影响查看计划；P0 不要求用户当前位置。
- 坐标缺失只禁用地图动作。
- `wx.openLocation` 失败提供复制地址。
- 时区或日期异常时回退到所选日期，不显示错误“今日”。
- 大量点位只渲染当前一天，不一次加载全部行程。

## 测试

- 坐标转换适配器正反例。
- marker 数量、ID、顺序与节点一致。
- 时间线点击和 marker 点击状态互通。
- 当前日期、旅行前、旅行中、旅行后、归档场景。
- 跨午夜和无结束时间节点。
- `wx.openLocation` 成功与失败降级。
- `getTodaySummary` 不再固定首日。

## 验收

- 用户按天查看地图和时间线，二者节点一致。
- 点击任一视图能定位另一视图的同一节点。
- 用户能打开微信地图或复制地址。
- 今日页正确展示当前和下一站，而不是永远展示 D1。
- 归档旅行不出现在今日默认内容。

## 实现任务

1. 添加坐标适配器和地图 ViewModel。
2. 扩展旅行计划页地图视图与联动。
3. 实现打开位置与复制地址降级。
4. 实现时区、日期和执行状态解析。
5. 重构今日聚合和页面。
6. 增加单元、领域和真机测试。

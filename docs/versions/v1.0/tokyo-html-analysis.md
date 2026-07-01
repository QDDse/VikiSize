# 东京 8 天 HTML 资产分析

## 当前资产

文件：`关东东京8天旅行计划.html`

- 规模：765 行，约 43KB。
- 形式：单文件 HTML，CSS 和旅行数据内联，Leaflet 从 CDN 加载。
- 语言：中文。
- 移动端：具备响应式布局。
- 当前公开根地址：`https://qddse.github.io/VikiSize/`，2026-07-01 检查返回 HTTP 200。
- 中文文件名直链当前返回 HTTP 404，因此不能把中文文件路径直接写入小程序配置。

## 页面已有内容

- 封面、出发日期、地区、天数和简介。
- 出发前待办及按出发日期倒推的提醒。
- 天气、台风、穿搭、支付、应用和购票时机。
- 航班候选和住宿区域建议。
- Leaflet 交互地图、点位和按行程顺序连线。
- D1-D8 每日时间轴。
- 景点图片、评分、点评、营业时间、门票、交通、季节信息和预约提醒。
- 每日餐饮、必点菜和参考价格。
- 雨天或替代方案、全程贴士、来源与免责声明。

## 当前代码结构

页面内的 `trip` 对象是事实上的完整模板数据源。主要字段：

```js
{
  title,
  startDate,
  preTrip,
  flights,
  hotelAreas,
  disclaimer,
  tips,
  reminders,
  days: [{
    date,
    weekday,
    theme,
    tips,
    alternatives,
    slots: [{
      period,
      name,
      time,
      lat,
      lng,
      photo,
      rating,
      review,
      openingHours,
      ticketPrice,
      transport,
      needsBooking,
      leadDays
    }],
    dining
  }]
}
```

小程序已有 `apps/wechat-miniprogram/data/tokyoTravelTemplate.js`，但它只是 HTML 数据的精简副本，缺失图片、经纬度、评分、营业时间、餐饮、替代方案、行前须知和完整航班酒店等信息。

## 复用判断

### 可以直接复用

- H5 的视觉展示和只读浏览体验。
- `trip` 数据字段和信息密度。
- 提醒计算规则。
- 页面章节顺序。
- 地图点位和行程排序。

### 不能直接复用

- Leaflet 不能作为小程序原生地图编辑能力，应使用小程序 `map`、位置选择和打开位置能力。
- HTML 不能直接作为小程序原生页面文件运行。
- H5 内勾选状态只保存在页面会话，不能替代云端协作状态。
- HTML 内嵌数据和小程序模板各维护一份会产生漂移。
- H5 不适合承担空间权限、图片上传、活动记录和多人编辑。

## 结论

保留 HTML 作为“只读精美预览渲染器”，把完整 `trip` 数据提取为独立、版本化的旅行模板。小程序模板实例和 H5 都由这份模板生成，避免继续手工维护两份旅行内容。

# S1 旅行模板数据与构建 Spec

## 目标

将 `关东东京8天旅行计划.html` 内联的完整 `trip` 数据迁移为唯一、版本化、可校验的模板 JSON，并由该 JSON 生成 H5 数据和小程序模板种子。

## 非目标

- 不实现模板列表 UI。
- 不创建或编辑空间实例。
- 不自动更新已有实例。
- 不联网刷新票价、评分和营业时间。

## 当前基线

- `关东东京8天旅行计划.html` 内含完整 `trip`、CSS、提醒和 Leaflet 地图逻辑。
- `apps/wechat-miniprogram/data/tokyoTravelTemplate.js` 是精简副本，缺少图片、坐标、评分、营业时间、餐饮、替代方案等字段。
- `localStore` 直接 `require` 精简模板。
- 云集合已有 `travel_templates` 和 `travel_plan_instances`。

## 文件布局

```text
apps/wechat-miniprogram/data/travel-templates/
  tokyo-kanto-8d.v1.json
  schema.json
apps/wechat-miniprogram/data/travelTemplateRegistry.js
scripts/travel-templates/
  validate.js
  build-h5.js
  build-miniprogram-seed.js
generated/travel-previews/
  tokyo-kanto-8d/1.0.0/index.html
```

`generated/` 是否提交由现有发布流程决定；模板 JSON、schema 和构建脚本必须提交。

## 模板契约

```js
{
  schemaVersion: 1,
  id: "tokyo-kanto-8d",
  version: "1.0.0",
  sourceName: "关东东京8天旅行计划.html",
  title: "关东东京 8 天旅行计划",
  desc: "给两个人安排的东京进出方案……",
  status: "published",
  coverImageUrl: "https://...",
  previewUrl: "",
  startDate: "2026-09-24",
  durationDays: 8,
  destinationLabels: ["东京", "镰仓", "箱根"],
  audienceLabels: ["双人", "首次东京", "轻松节奏"],
  seasonLabels: ["9 月下旬"],
  colorScheme: "late-summer-edo",
  updatedAt: "ISO-8601",
  preTrip: {},
  flights: { booked: [], candidates: [] },
  hotelAreas: [],
  reminders: [],
  budgetCategories: [],
  taskSeeds: [],
  days: [],
  tips: [],
  disclaimer: "",
  sources: []
}
```

### Day

```js
{
  id: "day-01",
  order: 1,
  date: "2026-09-24",
  weekday: "周四",
  theme: "...",
  tips: [],
  alternatives: [{ id, label, summary }],
  nodes: [],
  dining: []
}
```

### Travel Node

```js
{
  id: "day-01-arrival",
  order: 1,
  type: "transport" | "place" | "activity" | "meal" | "hotel" | "note",
  period: "下午",
  startTime: "14:00",
  endTime: "17:00",
  title: "抵达东京并进城",
  locationName: "东京站",
  address: "",
  coordinate: { latitude: 35.6812, longitude: 139.7671, system: "wgs84" },
  photoUrl: "",
  rating: 4.5,
  review: "",
  openingHours: "",
  closedDays: "",
  ticketPrice: "",
  transport: { mode: "", fare: "", duration: "" },
  seasonal: "",
  needsBooking: true,
  leadDays: 45,
  estimatedCost: 5200,
  notes: "",
  sensitive: false
}
```

### ID 规则

- ID 在模板版本内唯一且长期稳定。
- 文案、日期或排序变化不得自动改变 ID。
- 新项目由人工指定可读 ID；构建脚本只校验，不随机生成。
- `order` 从 1 开始，同一父级内连续且不重复。

## Schema 校验

构建必须失败于以下情况：

- 必填元数据缺失。
- `durationDays` 与 `days.length` 不一致。
- ID 重复。
- 日期无效或顺序倒退。
- `startTime >= endTime`，允许缺少任一时间。
- 经纬度只有一个值、越界或坐标系未知。
- `needsBooking=true` 但 `leadDays` 不是非负整数。
- 图片或来源 URL 不是 HTTPS。
- P0 枚举出现未知值。

## 构建行为

### `validate.js`

- 读取 schema 和全部模板 JSON。
- 输出模板 ID、版本、天数、节点数、预约项数和错误列表。
- 非零错误时退出码为 1。

### `build-h5.js`

- 复用现有 HTML 的视觉样式和纯函数。
- 把模板 JSON 序列化进生成页面，不再手工维护内联 `trip`。
- 输出版本化路径。
- H5 展示 `id/version/updatedAt`，不包含空间数据。

### `build-miniprogram-seed.js`

- 生成 CommonJS 可读取的 registry，或直接由 registry 加载 JSON。
- `localStore` 从 registry 初始化 `travel_templates`。
- 输出结构不得丢失 H5 字段；小程序页面可按需读取。

## 迁移

1. 提取 HTML `trip`。
2. 把 `slots` 统一命名为 `nodes`，把 `name` 统一为 `title`。
3. 为天、节点、餐饮、备选、航班、酒店、提醒和来源补稳定 ID。
4. 合并当前精简模板中的 `budgetCategories`、`taskSeeds` 和提醒类型。
5. 重新生成 H5，并与现有页面逐章节比对。
6. 保留旧 HTML 到新 H5 验证完成；之后由发布入口指向生成页面。

## 兼容

- `travelTemplateRegistry.getById(id, version?)` 返回深拷贝或不可变数据。
- 旧 ID `template-travel-tokyo-8d-v1` 作为 alias 映射到 `tokyo-kanto-8d@1.0.0`。
- 现有本地状态版本升级不能清空已有实例。

## 测试

新增脚本：

```text
npm run validate:travel-templates
npm run build:travel-previews
npm run test:travel-templates
```

必须覆盖：

- schema 正反例。
- 8 天、节点数量和稳定 ID 快照。
- H5 包含所有章节、模板 ID 和版本。
- 小程序 registry 与源 JSON 深度一致。
- 修改实例副本不改变 registry 模板。

## 验收

- 仓库只有一份人工维护的东京模板正文。
- 生成 H5 保留当前页面全部核心章节和交互地图。
- 小程序模板不再依赖手写精简副本。
- 验证脚本能阻止无效模板进入构建。
- 旧本地状态和旧模板 ID 有明确兼容路径。

## 实现任务

1. 添加 schema、模板 JSON 和 registry。
2. 编写校验、H5 构建和种子构建脚本。
3. 迁移完整东京数据并补 ID。
4. 替换 `localStore` 的模板导入。
5. 增加测试和 package scripts。
6. 验证生成 H5 与现有页面一致。

# S2 模板浏览与 H5 预览 Spec

## 目标

提供旅行模板列表、原生模板详情和 H5 完整攻略预览，使用户能在不创建空间实例的情况下理解模板，并可随时进入“使用此计划”。

## 非目标

- 不在 H5 中编辑实例。
- 不在列表接口返回完整 8 天正文。
- 不依赖 H5 消息才能创建实例。
- 不在此 spec 实现实例编辑器。

## 当前基线

- `app.json` 没有模板列表、模板详情和预览路由。
- `pages/plans` 直接展示当前空间实例。
- `pages/spaces` 可从 `TemplateOptions` 创建空间，但没有旅行模板浏览。
- 当前 Pages 根地址可公开浏览 HTML；正式业务域名未配置。

## 页面与路由

新增并注册：

```text
pages/travel-templates/index
pages/travel-template-detail/index
pages/travel-preview/index
```

入口：

- `pages/plans` 在旅行空间无实例时显示模板入口；有实例时仍提供“浏览模板”。
- `pages/spaces` 的旅行空间模板卡进入旅行模板列表或直接进入首个模板详情。

## 模板列表

### ViewModel

```js
{
  id,
  version,
  title,
  desc,
  coverImageUrl,
  durationDays,
  destinationLabels,
  audienceLabels,
  seasonLabels,
  updatedAt,
  previewAvailable,
  instanceState: "none" | "current_space" | "other_space"
}
```

### UI

- 单列模板卡，封面比例固定，防止布局跳动。
- 简介最多 3 行，超出省略。
- 展示天数、主要目的地和 2-3 个关键标签。
- 按钮：`浏览攻略`、`使用此计划`；当前空间已有实例时替换为 `继续编辑`。
- 加载、空列表、错误和重试状态必须存在。

## 原生模板详情

展示：

- 封面、标题、简介、版本与更新时间。
- 8 天主题列表。
- 预算总额参考、地点数、预约项数。
- 主要目的地、适合人群和季节标签。
- 免责声明。

操作：

- 主按钮 `使用此计划`：调用 S3 的创建流程。
- 次按钮 `浏览完整攻略`：跳转预览页。
- 已有当前空间实例时主按钮为 `继续编辑`。

## H5 预览页

```xml
<web-view src="{{previewUrl}}" bindload="onLoad" binderror="onError" bindmessage="onMessage" />
```

规则：

- `previewUrl` 只能来自模板 registry/接口，页面不接受任意 URL 查询参数。
- 只允许 HTTPS 和配置的主机白名单。
- URL 可附加 `templateId`、`version` 和 `source=miniprogram`，不得附加用户 token。
- `onMessage` 只接受 `{ type: "use-template", templateId, version }`；消息仅跳回原生详情，不直接创建实例。
- H5 加载失败时显示原生错误页：重试、返回详情、直接使用计划。
- H5 内外都显示同一模板版本。

## 数据接口

### 本地适配器

```js
listTravelTemplates(): TemplateSummary[]
getTravelTemplate(id, version?): TravelTemplate | null
getTravelTemplateSummary(id, version?): TemplateSummary | null
```

### 云函数

`listTravelTemplates`：

```js
// input
{ status: "published" }

// output
{ templates: TemplateSummary[] }
```

`getTravelTemplate`：

```js
// input
{ templateId, version? }

// output
{ template }
```

模板读取不要求空间成员权限，但只返回 `status=published`；草稿仅开发环境可见。

## 托管配置

在配置模块集中定义：

```js
{
  travelPreviewHosts: ["travel.example.com"],
  travelPreviewFallbackUrl: ""
}
```

- 开发环境可使用当前 Pages 地址进行浏览器验证。
- 真机发布前必须完成微信业务域名配置。
- 外部图片和 Leaflet 资源也要在真机验证，不假设浏览器可用即小程序可用。

## 失败处理

- 模板不存在：返回列表并提示模板已下架。
- 版本不存在：尝试该模板最新发布版，并明确提示；不得静默创建不同版本实例。
- 封面失败：使用本地占位图，不改变卡片高度。
- H5 加载失败：保留原生详情和使用入口。
- 云接口失败：本地内置东京模板可作为只读兜底；创建实例仍遵循 S3。

## 测试

- 页面已注册且四件套存在。
- 列表摘要不包含 `days`、`initialSnapshot` 等大字段。
- `desc`、标签、版本和按钮状态正确。
- 非白名单 URL 被拒绝。
- H5 错误状态仍能触发使用计划。
- 当前空间已有实例时显示继续编辑。
- 访客可浏览公共模板，但不能借此修改空间实例。

## 验收

- 用户从计划页或空间页进入旅行模板列表。
- 东京模板卡展示规定简介、封面、天数和标签。
- 原生详情展示 8 天摘要和两个明确操作。
- 完整 H5 可打开并返回。
- H5 不可用时不阻塞创建实例。
- 列表与 H5 显示相同模板版本。

## 实现任务

1. 增加页面路由和本地模板查询服务。
2. 实现列表及状态。
3. 实现原生详情和统计派生。
4. 实现安全 `web-view` 包装页和降级。
5. 增加云函数查询边界。
6. 扩展验证脚本和页面测试。

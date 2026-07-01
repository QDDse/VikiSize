# S3 旅行实例与编辑器 Spec

## 目标

把已发布旅行模板幂等复制为空间内独立实例，并提供日期、节点、模块和候选地点的完整原生编辑能力。

## 非目标

- 不编辑公共模板或 H5。
- 不实现实时多人光标或冲突合并。
- 不自动优化路线。
- 不自动同步模板新版本。

## 当前基线

- `createTravelInstanceFromTemplate` 每次调用都会新增实例，不幂等。
- `spaces.currentTemplateInstanceId` 只保存一个实例引用。
- `localStore.updateTravelNode` 只支持 patch 已有节点。
- `pages/travel-plan` 只能切换天和写入“已确认”备注。
- 实例已有 `sourceTemplateId/sourceVersion/initialSnapshot/days/budgetCategories`。

## 实例契约

```js
{
  id,
  spaceId,
  sourceTemplateId,
  sourceVersion,
  sourceName,
  importedAt,
  initialSnapshot,
  title,
  startDate,
  endDate,
  timezone: "Asia/Tokyo",
  status: "planning" | "active" | "completed" | "archived",
  candidatePlaces: [],
  days: [],
  budgetCategories: [],
  createdBy,
  createdAt,
  updatedAt,
  archivedAt
}
```

唯一性：同一 `spaceId + sourceTemplateId + sourceVersion` 只能有一个未归档实例。

## 创建实例

### 输入

```js
{
  spaceId,
  templateId,
  templateVersion,
  idempotencyKey: `${spaceId}:${templateId}:${templateVersion}`
}
```

### 行为

1. 校验当前用户是管理员或成员。
2. 查询已存在未归档实例。
3. 存在则返回 `{ instance, created: false }`。
4. 不存在则读取精确模板版本并深拷贝实例字段。
5. 在同一业务操作中更新 `spaces.currentTemplateInstanceId`、生成模板任务和记录活动。
6. 返回 `{ instance, created: true }`。

云数据库不支持完整事务时，使用 idempotency collection 或确定性唯一键，并在失败重试时清理不完整状态。不得只依赖客户端防重。

## Day 契约

```js
{
  id,
  order,
  date,
  weekday,
  theme,
  tips: [],
  alternatives: [],
  nodes: [],
  dining: []
}
```

规则：

- 日期在实例内唯一。
- `order` 连续；排序后服务端统一重编号。
- 删除非空日期必须二次确认。
- 复制日期时为日期及其子项生成新 ID，不复制完成状态、评论和附件实体。

## Node 契约

实例节点在 S1 模板节点基础上增加：

```js
{
  sourceTemplateNodeId: string | null,
  status: "planned" | "confirmed" | "done" | "cancelled",
  sensitiveFields: {
    confirmationCode: "",
    internalBudgetNote: "",
    documentAttachmentIds: []
  },
  attachmentIds: [],
  linkedCardIds: [],
  createdBy,
  updatedBy,
  createdAt,
  updatedAt
}
```

## 候选地点

```js
{
  id,
  title,
  locationName,
  address,
  coordinate,
  category,
  photoUrl,
  notes,
  sourceUrl,
  scheduledDayId: null,
  scheduledNodeId: null,
  createdBy,
  createdAt,
  updatedAt
}
```

排期行为：

- 将候选地点转换为节点时保留候选 ID 和来源关系。
- 同一候选地点最多关联一个有效节点。
- 移回待安排状态时删除/取消关联节点并清空 schedule 字段；如果节点已有任务、评论或附件，必须确认并保留可追溯记录。

## 编辑操作

本地 store 与云函数保持同名行为：

```text
createTravelDay
updateTravelDay
deleteTravelDay
reorderTravelDays
createTravelNode
updateTravelNode
deleteTravelNode
duplicateTravelNode
reorderTravelNodes
upsertTravelCandidate
scheduleTravelCandidate
unscheduleTravelCandidate
upsertTravelModule
archiveTravelInstance
```

### Patch 规则

- API 使用允许字段白名单，不接受任意 `Object.assign`。
- `spaceId`、实例 ID、创建人、来源版本不可由 patch 修改。
- 时间、坐标、预算和枚举服务端校验。
- 每次写入更新实例 `updatedAt` 并记录活动。

## 页面

保留 `pages/travel-plan/index` 作为实例编辑器入口，新增：

```text
pages/travel-day-editor/index
pages/travel-node-editor/index
pages/travel-candidates/index
```

### 旅行编辑器

- 顶部：标题、日期范围、角色、状态、归档入口。
- 视图：每日行程、待安排地点、任务、预算、动态。
- 日期横向切换。
- 节点列表支持上移/下移；拖拽可后续增强，不作为首个 coding 阻塞。
- 新增模块使用底部操作面板。

### 节点编辑器

- 按节点类型显示字段，但保存为统一 Node。
- 表单包含时间、地点、坐标、交通、预约、预算、图片、备注。
- 敏感字段单独分组并提示访客不可见。
- 未保存离开时提示。

## 活动类型

```text
travel_instance_created
travel_instance_archived
travel_instance_unarchived
travel_day_created|updated|deleted|reordered
travel_node_created|updated|deleted|duplicated|reordered
travel_candidate_created|updated|scheduled|unscheduled
travel_module_created|updated|deleted
```

活动 summary 使用中文，不保存敏感字段值。

## 归档

- `archiveTravelInstance(instanceId, archived)` 仅管理员可执行。
- 归档更新实例状态和 `archivedAt`，不删除子项。
- 若空间当前实例被归档，清空或切换 `currentTemplateInstanceId`。
- 恢复后重新设为当前实例需显式操作。

## 本地状态迁移

- `STORAGE_KEY` schema 从 1 升级到 2。
- 读取 v1 时补实例字段、node ID/order/type/status 和空候选池。
- 迁移必须保持已有用户、空间、卡片和实例 ID。
- 迁移失败保留原始备份键并展示可恢复错误，不静默 reset。

## 测试

- 同一 key 连续创建两次只得到一个实例。
- 模板深拷贝，实例修改不污染模板。
- Day/Node CRUD、复制、排序和校验。
- 候选地点排期与撤回不重复。
- 访客所有写操作失败。
- 活动记录产生且不包含确认号。
- v1 本地状态迁移不丢数据。
- 归档从今日隐藏，恢复后可重新激活。

## 验收

- 用户从模板创建且只创建一个实例。
- 管理员和成员能完成日期、节点、模块和候选地点的增删改排。
- 节点表单覆盖聚合需求规定字段。
- 所有关键写入有活动记录。
- 归档保留完整内容。

## 实现任务

1. 升级实例、Day、Node 和候选地点模型。
2. 实现本地迁移和 store API。
3. 修复云端实例幂等。
4. 实现写云函数和权限校验。
5. 重构旅行计划页并新增编辑页面。
6. 增加领域测试和页面验证。

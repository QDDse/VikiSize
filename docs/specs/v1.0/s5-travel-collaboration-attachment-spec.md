# S5 旅行协作与附件 Spec

## 目标

在既有空间角色、统一卡片、评论、意见、提醒和活动基础上，为旅行实例补齐敏感字段保护、图片附件和派生任务来源追溯。

## 非目标

- 不实现字段级自定义权限配置器。
- 不支持 PDF、Word、视频、OCR 或大文件。
- 不做实时共同编辑或冲突合并。
- 不允许公共 H5 访问空间附件。

## 当前基线

- `assertPermission` 允许管理员和成员写，访客写失败。
- `attachments` 只在本地集合边界存在，没有上传/删除实现。
- 评论、意见、提醒和卡片云函数已经存在。
- 活动记录按卡片或空间保存。
- 当前权限错误主要围绕卡片，未覆盖旅行节点写操作和敏感字段读取。

## 权限矩阵

| 行为 | 管理员 | 成员 | 访客 |
| --- | --- | --- | --- |
| 浏览公共模板/H5 | 是 | 是 | 是 |
| 浏览空间旅行实例 | 是 | 是 | 是 |
| 浏览敏感确认字段 | 是 | 是 | 否 |
| 编辑日期/节点/模块 | 是 | 是 | 否 |
| 上传普通图片 | 是 | 是 | 否 |
| 上传票据/确认附件 | 是 | 是 | 否 |
| 评论、意见、提醒 | 是 | 是 | 否 |
| 派生任务 | 是 | 是 | 否 |
| 管理成员 | 是 | 否 | 否 |
| 归档/恢复整个旅行 | 是 | 否 | 否 |

云函数必须执行矩阵；客户端隐藏按钮不是权限实现。

## 读取脱敏

新增投影函数：

```js
projectTravelInstanceForRole(instance, role)
```

访客响应必须移除：

- `confirmationCode`。
- `internalBudgetNote`。
- `documentAttachmentIds` 及其附件记录。
- 被标记为 `sensitive=true` 的模块内容。

不得只在 WXML 隐藏后仍把敏感值放入页面 data。

## Attachment 契约

```js
{
  id,
  spaceId,
  scopeType: "card" | "travel_node" | "travel_module",
  scopeId,
  category: "image" | "ticket" | "booking" | "document",
  sensitive: boolean,
  uploadedBy,
  cloudFileId,
  mimeType: "image/jpeg" | "image/png" | "image/webp",
  width,
  height,
  sizeBytes,
  createdAt,
  deletedAt
}
```

约束：

- P0 只允许 JPEG、PNG、WebP。
- 每节点/模块最多 9 张未删除附件。
- 单文件上限在配置中定义，建议 10MB；客户端和云端都校验。
- `ticket/booking/document` 默认 `sensitive=true`。
- 列表只加载缩略图；原图按需预览。

## 上传流程

1. 客户端 `wx.chooseMedia` 仅选择图片。
2. 压缩或尺寸检查。
3. 生成受控云存储路径：`spaces/{spaceId}/travel/{scopeId}/{uuid}.{ext}`。
4. 上传云存储。
5. 调用 `createAttachmentRecord` 校验权限、scope 所属空间、数量和类型。
6. 失败时尝试删除孤立云文件并记录错误。

删除流程：

- 软删除附件记录。
- 从节点/模块关联中移除 ID。
- 云文件物理删除可同步执行或后台清理；失败不能恢复已撤销的业务可见性。
- 记录活动，不记录文件访问 URL。

## 云函数

```text
createAttachmentRecord
deleteAttachment
listAttachmentsForScope
createTravelTaskFromNode
```

上传本身优先使用 `wx.cloud.uploadFile`，云函数负责授权后的记录和关联校验。

## 派生任务

旅行任务仍使用 `cards`：

```js
details: {
  category: "tickets" | "hotels" | "documents" | "packing" | "transport" | "confirmations",
  sourceType: "travel_node" | "travel_module" | "manual",
  sourceId,
  generated: true,
  sourceUpdatedAt
}
```

规则：

- 同一 `sourceId + category` 默认只能存在一个未归档自动任务。
- 成员编辑任务后仍保留来源，但节点变更不能覆盖任务文案。
- 节点变更时比较 `sourceUpdatedAt`，在 UI 显示“来源行程已更新”。
- 节点删除时任务保留并标记“来源已删除”，由用户决定归档。

## 评论、意见和提醒

- 评论和意见继续关联卡片；旅行节点需要讨论时先创建/关联卡片。
- 节点可直接关联已有 `linkedCardIds`。
- 提醒继续只支持 `assigned_to_me/due_soon/needs_confirmation`。
- 访客不能成为负责人、接收提醒或发表意见。
- 提醒页面跳转到关联卡片；无卡片的旅行提醒应先创建任务卡片。

## 活动与审计

记录：

```text
travel_attachment_added
travel_attachment_deleted
travel_task_created
travel_task_source_changed
sensitive_field_updated
```

- `sensitive_field_updated` 只记录字段名，不记录新旧值。
- 活动列表对访客过滤敏感活动摘要。

## 并发和冲突

P0 使用乐观版本：

```js
{ revision: number, updatedAt }
```

- 写操作携带 `expectedRevision`。
- 不一致返回 `CONFLICT` 和最新摘要，不覆盖。
- 客户端提示“内容已被其他成员更新”，提供刷新；不做自动字段合并。

此 revision 可在 S3 实例/节点实现时一并加入。

## 测试

- 权限矩阵全部角色。
- 访客响应中不存在敏感字段和附件 ID。
- 图片类型、大小、数量限制。
- scope 不属于空间时拒绝创建附件记录。
- 删除后业务不可见，活动存在。
- 派生任务幂等、来源更新和来源删除。
- 评论/意见/提醒沿用行为无回归。
- revision 冲突不覆盖新数据。

## 验收

- 管理员和成员能给节点添加、预览和删除图片。
- 访客看不到上传按钮、敏感字段和敏感附件，接口也不返回数据。
- 从节点生成任务后可追溯来源。
- 节点变化不会静默覆盖成员改过的任务。
- 并发旧版本写入被拒绝并可刷新恢复。

## 实现任务

1. 扩展权限投影和旅行写权限。
2. 实现附件契约、上传关联和删除。
3. 实现节点图片 UI。
4. 实现派生任务幂等和来源状态。
5. 增加 revision 冲突保护。
6. 扩展活动、测试和真机验证。

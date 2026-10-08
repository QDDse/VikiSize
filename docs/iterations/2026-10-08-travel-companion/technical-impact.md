# 技术影响与验收

最终交付以 integration.md 的 0.3.5 基线集成结果为准；下文保留初版开发与复查记录。

## 数据与权限

保留 v1 存储键及 v1/v2/v3 读取/迁移流程，在旅行实例按需添加可选 receipts 数组。旧实例缺少字段即为空账本，不升级 schema 版本，不注入演示数据。字段为 id、date、merchant、category、amount、currency=JPY、createdBy、createdAt。

写入/删除均复用 getTravelInstanceRecord 和 assertCanWrite，拒绝访客、非成员、归档旅行。删除按实例内 id 定位。新增金额限定 1–999999999 整数日元，并校验全程总额为安全整数。存储成功后再更新内存，写入失败可重试，不呈现虚假成功。

日语和延误模型在 travelCompanion.js；模拟只生成新视图对象，不写 localStore。地点详情使用现有按角色投影的数据，不读取原始敏感字段。全局 app.json、app.wxss 和 Fitness 代码保持原样。

## 验证

- npm run validate:wechat：通过。
- npm run validate:travel-templates：通过（8 天、24 节点、8 预约项）。
- npm test：66/66 通过，包含 12 项新增旅行随行回归。
- 页面交互测试：通过日期切换、地点详情/访客脱敏、小票表单取消/重复保存/确认删除、日语分类复制、模拟关闭/切日/切页签/隐藏隔离。
- npm run lint 与 git diff --check：通过。首次 lint 的测试文件全局引用错误已修复。
- WXML 静态 UI 检查：标签配对正确，44 个事件绑定均有对应处理函数。
- 原生渲染/真机 UI：未运行，本机没有微信开发者工具；没有把 Node 页面桩测试视为真机验收。
- 原型视觉一致性：受原型 HTTP 403 限制，按提供的文本规格实现。

手工验收建议：微信开发者工具导入 apps/wechat-miniprogram，打开旅行→某日，点击地点；添加小票、退出重进确认保存；删除取消/确认；切换日语分类复制；打开模拟后取消/切日确认正式时间不变；切换访客确认只读；切换健身确认入口及收件箱仍正常。

## 交付复查

本地独立分支为 `local/travel-companion`，基于 `78b1adf`。源码未提交；补丁包含全部已修改与未跟踪新增文件，共 12 个文件。

代码复查：旧实例缺少 receipts 时按空数组处理，v2 迁移保留已有账本和备份；写操作重新核验目标实例所属空间成员权限，guest/非成员拒绝，不能通过另一实例删除小票；真实写盘成功后才更新缓存。页面写盘失败保留输入、展示错误、没有成功提示，删除失败保留持久化记录和汇总。本次复查没有发现需要修复的新业务缺陷；新增两项回归覆盖上述失败路径与跨空间写入边界。

CI 的 Cloud function module resolution smoke test 按仓库脚本运行，通过：Resolved 39 cloud function entrypoints。重跑 lint、全量测试（66/66）通过。

// 旅行协作与附件测试：由 scripts/test-travel-collaboration.js 迁移到 node:test，
// 并把原先压缩成一行多语句的写法展开为可读的命名用例。
const test = require("node:test");
const assert = require("node:assert");
const store = require("../../apps/wechat-miniprogram/services/localStore");
const { Roles } = require("../../apps/wechat-miniprogram/domain/constants");

store.resetLocalState();
const context = store.getCurrentContext();
const instance = store.getTravelInstance(context.space.id);
const day = instance.days[0];
const node = day.nodes[0];
let attachment;

test("revision 冲突保护：过期 revision 更新被拒绝", () => {
  store.updateTravelNode(instance.id, day.id, node.id, {
    sensitiveFields: { confirmationCode: "SECRET", internalBudgetNote: "PRIVATE", documentAttachmentIds: [] },
    expectedRevision: node.revision
  });
  assert.throws(
    () => store.updateTravelNode(instance.id, day.id, node.id, { title: "冲突更新", expectedRevision: node.revision }),
    /其他成员更新/
  );
});

test("附件：图片类型可上传，其他类型被拒绝", () => {
  attachment = store.createAttachmentRecord({
    spaceId: context.space.id,
    scopeType: "travel_node",
    scopeId: node.id,
    category: "ticket",
    cloudFileId: "wxcloud://ticket.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 1024
  });
  assert.strictEqual(store.listAttachmentsForScope(context.space.id, node.id).length, 1);
  assert.throws(() => store.createAttachmentRecord({
    spaceId: context.space.id,
    scopeType: "travel_node",
    scopeId: node.id,
    cloudFileId: "bad.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1
  }), /仅支持/);
});

test("从节点派生任务是幂等的", () => {
  const first = store.createTravelTaskFromNode(instance.id, day.id, node.id, "tickets");
  const second = store.createTravelTaskFromNode(instance.id, day.id, node.id, "tickets");
  assert.strictEqual(first.created, true);
  assert.strictEqual(second.created, false);
  assert.strictEqual(first.card.id, second.card.id);
});

test("访客视角：敏感字段与附件被脱敏且不可删除", () => {
  store.setCurrentUserRoleForPreview(Roles.GUEST);
  const guestInstance = store.getTravelInstance(context.space.id);
  const guestNode = guestInstance.days[0].nodes[0];
  assert.deepStrictEqual(guestNode.sensitiveFields, {});
  assert.deepStrictEqual(guestNode.attachmentIds, []);
  assert.strictEqual(store.listAttachmentsForScope(context.space.id, node.id).length, 0);
  assert.throws(() => store.deleteAttachment(attachment.id), /访客只能查看/);
});

test("管理员可删除附件", () => {
  store.setCurrentUserRoleForPreview(Roles.OWNER);
  store.deleteAttachment(attachment.id);
  assert.strictEqual(store.listAttachmentsForScope(context.space.id, node.id).length, 0);
});

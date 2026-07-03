// 旅行编辑器测试：由 scripts/test-travel-editor.js 迁移到 node:test。
// 用例按顺序执行并共享同一份本地状态（与原脚本一致）。
const test = require("node:test");
const assert = require("node:assert");
const store = require("../../apps/wechat-miniprogram/services/localStore");
const { Roles } = require("../../apps/wechat-miniprogram/domain/constants");

store.resetLocalState();
const context = store.getCurrentContext();
const original = store.getTravelInstance(context.space.id);
let day;
let node;

test("同模板重复创建实例是幂等的", () => {
  const idempotent = store.createTravelInstanceFromTemplate({
    spaceId: context.space.id,
    templateId: original.sourceTemplateId,
    templateVersion: original.sourceVersion
  });
  assert.strictEqual(idempotent.created, false);
  assert.strictEqual(idempotent.instance.id, original.id);
  assert.strictEqual(store.getState().collections.travel_plan_instances.length, 1);
});

test("日期增改与重复日期拒绝", () => {
  day = store.createTravelDay(original.id, { date: "2026-12-31", weekday: "周四", theme: "返程准备" });
  assert.throws(() => store.createTravelDay(original.id, { date: day.date }), /日期已存在/);
  store.updateTravelDay(original.id, day.id, { theme: "返程与购物" });
});

test("节点创建、复制、排序与删除", () => {
  node = store.createTravelNode(original.id, day.id, {
    title: "东京站",
    locationName: "东京站",
    startTime: "09:00",
    estimatedCost: 200,
    sensitiveFields: { confirmationCode: "PRIVATE-123" }
  });
  store.updateTravelNode(original.id, day.id, node.id, { notes: "提前到站", spaceId: "forbidden" });
  const copy = store.duplicateTravelNode(original.id, day.id, node.id);
  assert.strictEqual(copy.title, "东京站（副本）");
  store.reorderTravelNodes(original.id, day.id, [copy.id, node.id]);
  assert.strictEqual(store.getTravelInstance(context.space.id).days.find((item) => item.id === day.id).nodes[0].id, copy.id);
  store.deleteTravelNode(original.id, day.id, copy.id);
});

test("候选地点：安排、重复安排拒绝、撤回", () => {
  const candidate = store.upsertTravelCandidate(original.id, { title: "晴空塔", locationName: "东京晴空塔" });
  const scheduled = store.scheduleTravelCandidate(original.id, candidate.id, day.id);
  assert.strictEqual(scheduled.sourceCandidateId, candidate.id);
  assert.throws(() => store.scheduleTravelCandidate(original.id, candidate.id, day.id), /已安排/);
  store.unscheduleTravelCandidate(original.id, candidate.id);
  assert.strictEqual(store.getTravelInstance(context.space.id).candidatePlaces[0].scheduledNodeId, null);
});

test("旅行模块增改删", () => {
  const travelModule = store.upsertTravelModule(original.id, { type: "note", title: "行前提示", content: "携带护照" });
  store.upsertTravelModule(original.id, { id: travelModule.id, title: "行前清单" });
  store.deleteTravelModule(original.id, travelModule.id);
});

test("删除与全量重排后 order 连续", () => {
  store.deleteTravelNode(original.id, day.id, node.id);
  store.deleteTravelDay(original.id, day.id);
  const reversed = store.getTravelInstance(context.space.id).days.map((item) => item.id).reverse();
  store.reorderTravelDays(original.id, reversed);
  assert.deepStrictEqual(store.getTravelInstance(context.space.id).days.map((item) => item.order), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test("敏感字段不泄漏进活动日志", () => {
  const activityText = store.getState().collections.activities.map((item) => item.summary).join("\n");
  assert.ok(activityText.includes("东京站"));
  assert.ok(!activityText.includes("PRIVATE-123"));
});

test("角色门禁：访客只读、归档需管理员", () => {
  store.setCurrentUserRoleForPreview(Roles.GUEST);
  assert.throws(() => store.createTravelDay(original.id, { date: "2027-01-01" }), /访客只能查看/);
  store.setCurrentUserRoleForPreview(Roles.MEMBER);
  assert.throws(() => store.archiveTravelInstance(original.id, true), /只有管理员/);
  store.setCurrentUserRoleForPreview(Roles.OWNER);
  store.archiveTravelInstance(original.id, true);
  assert.strictEqual(store.getTravelInstance(context.space.id), null);
});

const assert = require("assert");
const store = require("../apps/wechat-miniprogram/services/localStore");
const { Roles } = require("../apps/wechat-miniprogram/domain/constants");

store.resetLocalState();
const context = store.getCurrentContext();
const original = store.getTravelInstance(context.space.id);

const idempotent = store.createTravelInstanceFromTemplate({
  spaceId: context.space.id,
  templateId: original.sourceTemplateId,
  templateVersion: original.sourceVersion
});
assert.strictEqual(idempotent.created, false);
assert.strictEqual(idempotent.instance.id, original.id);
assert.strictEqual(store.getState().collections.travel_plan_instances.length, 1);

const day = store.createTravelDay(original.id, { date: "2026-12-31", weekday: "周四", theme: "返程准备" });
assert.throws(() => store.createTravelDay(original.id, { date: day.date }), /日期已存在/);
store.updateTravelDay(original.id, day.id, { theme: "返程与购物" });

const node = store.createTravelNode(original.id, day.id, {
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

const candidate = store.upsertTravelCandidate(original.id, { title: "晴空塔", locationName: "东京晴空塔" });
const scheduled = store.scheduleTravelCandidate(original.id, candidate.id, day.id);
assert.strictEqual(scheduled.sourceCandidateId, candidate.id);
assert.throws(() => store.scheduleTravelCandidate(original.id, candidate.id, day.id), /已安排/);
store.unscheduleTravelCandidate(original.id, candidate.id);
assert.strictEqual(store.getTravelInstance(context.space.id).candidatePlaces[0].scheduledNodeId, null);

const travelModule = store.upsertTravelModule(original.id, { type: "note", title: "行前提示", content: "携带护照" });
store.upsertTravelModule(original.id, { id: travelModule.id, title: "行前清单" });
store.deleteTravelModule(original.id, travelModule.id);

store.deleteTravelNode(original.id, day.id, node.id);
store.deleteTravelDay(original.id, day.id);
const reversed = store.getTravelInstance(context.space.id).days.map((item) => item.id).reverse();
store.reorderTravelDays(original.id, reversed);
assert.deepStrictEqual(store.getTravelInstance(context.space.id).days.map((item) => item.order), [1, 2, 3, 4, 5, 6, 7, 8]);

const activityText = store.getState().collections.activities.map((item) => item.summary).join("\n");
assert.ok(activityText.includes("东京站"));
assert.ok(!activityText.includes("PRIVATE-123"));

store.setCurrentUserRoleForPreview(Roles.GUEST);
assert.throws(() => store.createTravelDay(original.id, { date: "2027-01-01" }), /访客只能查看/);
store.setCurrentUserRoleForPreview(Roles.MEMBER);
assert.throws(() => store.archiveTravelInstance(original.id, true), /只有管理员/);
store.setCurrentUserRoleForPreview(Roles.OWNER);
store.archiveTravelInstance(original.id, true);
assert.strictEqual(store.getTravelInstance(context.space.id), null);

console.log("Travel editor tests passed.");

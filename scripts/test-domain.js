const assert = require("assert");
const store = require("../apps/wechat-miniprogram/services/localStore");
const { Modules, ReminderTypes, Roles, TemplateTypes } = require("../apps/wechat-miniprogram/domain/constants");

store.resetLocalState();

let context = store.getCurrentContext();
assert.strictEqual(context.space.name, "关东东京 8 天旅行小队");
assert.strictEqual(context.member.role, Roles.OWNER);

const travelInstance = store.getTravelInstance(context.space.id);
assert.ok(travelInstance);
assert.strictEqual(travelInstance.days.length, 8);
assert.strictEqual(store.getCards(context.space.id, Modules.PLANS).length, 6);

const originalTemplateNote = context.state.collections.travel_templates[0].days[0].nodes[0].notes;
store.updateTravelNode(travelInstance.id, "day-01", "day-01-node-01", { notes: "本地实例已编辑" });
context = store.getCurrentContext();
assert.strictEqual(context.state.collections.travel_templates[0].days[0].nodes[0].notes, originalTemplateNote);

const familySpace = store.createSpace({ templateType: TemplateTypes.FAMILY_LIFE });
assert.ok(store.getCards(familySpace.id, Modules.LIFE).length >= 1);
const decisionSpace = store.createSpace({ templateType: TemplateTypes.PURCHASE_DECISION });
assert.ok(store.getCards(decisionSpace.id, Modules.DECISIONS).length >= 1);
const blankSpace = store.createSpace({ templateType: TemplateTypes.BLANK });
assert.strictEqual(store.getCards(blankSpace.id).length, 0);

store.switchSpace(travelInstance.spaceId);
context = store.getCurrentContext();
const card = store.getCards(context.space.id, Modules.PLANS)[0];
store.addComment(card.id, "确认一下预约时间");
assert.ok(store.getCardDetail(card.id).activities.some((activity) => activity.type === "comment_created"));

store.archiveCard(card.id, true);
assert.ok(!store.getTodaySummary(context.space.id).activeCards.some((item) => item.id === card.id));
store.archiveCard(card.id, false);
assert.ok(store.getTodaySummary(context.space.id).activeCards.some((item) => item.id === card.id));

store.scheduleReminder(card.id, ReminderTypes.ASSIGNED_TO_ME);
assert.throws(() => store.scheduleReminder(card.id, "comment_noise"), /不支持的提醒类型/);

store.setCurrentUserRoleForPreview(Roles.GUEST);
assert.throws(() => store.upsertCard({
  spaceId: context.space.id,
  module: Modules.LIFE,
  title: "访客写入",
  description: ""
}), /访客只能查看/);

store.setCurrentUserRoleForPreview(Roles.MEMBER);
store.upsertCard({
  spaceId: context.space.id,
  module: Modules.LIFE,
  title: "成员可写",
  description: "成员可以创建生活卡片"
});
assert.ok(store.getCards(context.space.id, Modules.LIFE).some((item) => item.title === "成员可写"));

const invite = store.createInvitation(Roles.GUEST);
assert.strictEqual(invite.role, Roles.GUEST);
assert.throws(() => store.acceptInvitation("missing-token"), /邀请无效/);

console.log("Domain behavior tests passed.");

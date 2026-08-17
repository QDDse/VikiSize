// 领域行为测试：由 scripts/test-domain.js 迁移到 node:test。
// 用例按顺序执行并共享同一份本地状态（与原脚本一致）。
const test = require("node:test");
const assert = require("node:assert");
const store = require("../../apps/wechat-miniprogram/services/localStore");
const { Modules, ReminderTypes, Roles, TemplateTypes } = require("../../apps/wechat-miniprogram/domain/constants");

store.resetLocalState();

test("默认空间从东京模板初始化", () => {
  const context = store.getCurrentContext();
  assert.strictEqual(context.space.name, "关东东京 8 天旅行小队");
  assert.strictEqual(context.member.role, Roles.OWNER);

  const travelInstance = store.getTravelInstance(context.space.id);
  assert.ok(travelInstance);
  assert.strictEqual(travelInstance.days.length, 8);
  assert.strictEqual(store.getCards(context.space.id, Modules.PLANS).length, 6);
});

test("编辑实例不污染模板源数据", () => {
  let context = store.getCurrentContext();
  const travelInstance = store.getTravelInstance(context.space.id);
  const originalTemplateNote = context.state.collections.travel_templates[0].days[0].nodes[0].notes;
  store.updateTravelNode(travelInstance.id, "day-01", "day-01-node-01", { notes: "本地实例已编辑" });
  context = store.getCurrentContext();
  assert.strictEqual(context.state.collections.travel_templates[0].days[0].nodes[0].notes, originalTemplateNote);
});

test("空间入口只允许创建旅行实例", () => {
  const travelSpace = store.createSpace({ templateType: TemplateTypes.TRAVEL_TEAM, name: "周末旅行" });
  assert.ok(store.getTravelInstance(travelSpace.id));
  assert.throws(() => store.createSpace({ templateType: "family_life" }), /只支持旅行空间/);
});

test("评论、归档与提醒", () => {
  const context = store.getCurrentContext();
  const travelSpaceId = store.getState().collections.travel_plan_instances[0].spaceId;
  store.switchSpace(travelSpaceId);
  const card = store.getCards(travelSpaceId, Modules.PLANS)[0];

  store.addComment(card.id, "确认一下预约时间");
  assert.ok(store.getCardDetail(card.id).activities.some((activity) => activity.type === "comment_created"));

  store.archiveCard(card.id, true);
  assert.ok(!store.getTodaySummary(travelSpaceId).activeCards.some((item) => item.id === card.id));
  store.archiveCard(card.id, false);
  assert.ok(store.getTodaySummary(travelSpaceId).activeCards.some((item) => item.id === card.id));

  store.scheduleReminder(card.id, ReminderTypes.ASSIGNED_TO_ME);
  assert.throws(() => store.scheduleReminder(card.id, "comment_noise"), /不支持的提醒类型/);
  assert.ok(context);
});

test("角色写权限：访客只读，成员可写", () => {
  const context = store.getCurrentContext();
  store.setCurrentUserRoleForPreview(Roles.GUEST);
  assert.throws(() => store.upsertCard({
    spaceId: context.space.id,
    module: Modules.PLANS,
    title: "访客写入",
    description: ""
  }), /访客只能查看/);

  store.setCurrentUserRoleForPreview(Roles.MEMBER);
  store.upsertCard({
    spaceId: context.space.id,
    module: Modules.PLANS,
    title: "成员可写",
    description: "成员可以创建旅行任务"
  });
  assert.ok(store.getCards(context.space.id, Modules.PLANS).some((item) => item.title === "成员可写"));
});

test("邀请创建与无效 token 拒绝", () => {
  const invite = store.createInvitation(Roles.GUEST);
  assert.strictEqual(invite.role, Roles.GUEST);
  assert.throws(() => store.acceptInvitation("missing-token"), /邀请无效/);
});

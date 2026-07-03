// 云函数安全回归测试：对应 docs/iterations/2026-07-03-code-review-enterprise-roadmap/review.md
// 中的 S1-S4 与 S6（travelEditor 版本守卫）。
const test = require("node:test");
const assert = require("node:assert");
const { installMockCloud, loadFunction } = require("./lib/cloudHarness");

function seedTwoSpaces(cloud) {
  cloud.seed("users", [
    { _id: "user-a", id: "user-a", openid: "openid-a", displayName: "甲" },
    { _id: "user-b", id: "user-b", openid: "openid-b", displayName: "乙" }
  ]);
  cloud.seed("space_members", [
    { id: "m-a", spaceId: "space-a", userId: "user-a", role: "owner" },
    { id: "m-b", spaceId: "space-b", userId: "user-b", role: "owner" }
  ]);
}

test("S1 upsertCard 拒绝跨空间越权更新（IDOR）", async () => {
  const cloud = installMockCloud();
  seedTwoSpaces(cloud);
  cloud.seed("cards", [{ _id: "card-victim", id: "card-victim", spaceId: "space-a", title: "受害卡片", status: "todo" }]);

  // 攻击者是 space-b 的成员，用自己的 spaceId + 受害卡片 id 尝试改写
  cloud.setWXContext({ OPENID: "openid-b" });
  const { main } = loadFunction("upsertCard");
  await assert.rejects(
    main({ id: "card-victim", spaceId: "space-b", title: "已被篡改" }),
    (error) => error.code === "PERMISSION_DENIED"
  );
  // 不带 spaceId 也不行：权限按库内卡片的 spaceId 校验
  await assert.rejects(
    main({ id: "card-victim", title: "已被篡改" }),
    (error) => error.code === "PERMISSION_DENIED"
  );
  assert.strictEqual(cloud.all("cards")[0].title, "受害卡片");
});

test("S1 upsertCard 合法成员仍可更新与创建", async () => {
  const cloud = installMockCloud();
  seedTwoSpaces(cloud);
  cloud.seed("cards", [{ _id: "card-1", id: "card-1", spaceId: "space-a", title: "旧标题", status: "todo" }]);

  cloud.setWXContext({ OPENID: "openid-a" });
  const { main } = loadFunction("upsertCard");
  const updated = await main({ id: "card-1", spaceId: "space-a", title: "新标题" });
  assert.strictEqual(updated.id, "card-1");
  assert.strictEqual(cloud.all("cards")[0].title, "新标题");
  await assert.rejects(main({ id: "card-missing", spaceId: "space-a", title: "x" }), (error) => error.code === "NOT_FOUND");

  const created = await main({ spaceId: "space-a", module: "plans", title: "新卡片" });
  assert.ok(created.card.id);
  // 单次写入即带 id（不再有 add 后补 update 的两段式窗口）
  const stored = cloud.all("cards").find((card) => card.id === created.card.id);
  assert.strictEqual(stored._id, stored.id);
});

test("S2 邀请 token 为高熵随机并带过期时间", async () => {
  const cloud = installMockCloud();
  seedTwoSpaces(cloud);
  cloud.setWXContext({ OPENID: "openid-a" });
  const { main } = loadFunction("createInvitation");
  const { invitation } = await main({ spaceId: "space-a", role: "member" });

  assert.ok(!/^token-\d/.test(invitation.token), "token 不应再带可推算的时间戳前缀");
  assert.ok(invitation.token.length >= 32, "token 长度必须足够");
  assert.ok(invitation.expiresAt > new Date().toISOString(), "必须有未来的过期时间");
});

test("S3 acceptInvitation 幂等且原子消费 token", async () => {
  const cloud = installMockCloud();
  seedTwoSpaces(cloud);
  cloud.seed("invitations", [{
    _id: "inv-1", id: "inv-1", spaceId: "space-a", token: "tok-race", invitedBy: "user-a",
    role: "member", status: "pending", expiresAt: "2999-01-01T00:00:00.000Z"
  }]);

  // 已是成员：幂等成功，不产生重复成员记录
  cloud.setWXContext({ OPENID: "openid-a" });
  const { main } = loadFunction("acceptInvitation");
  const idempotent = await main({ token: "tok-race" });
  assert.strictEqual(idempotent.alreadyMember, true);
  assert.strictEqual(cloud.all("space_members").filter((m) => m.spaceId === "space-a").length, 1);

  // 新成员接受后 token 被消费，后来者失败
  cloud.setWXContext({ OPENID: "openid-b" });
  const accepted = await main({ token: "tok-race" });
  assert.strictEqual(accepted.spaceId, "space-a");
  cloud.setWXContext({ OPENID: "openid-c" });
  cloud.seed("users", [{ _id: "user-c", id: "user-c", openid: "openid-c" }]);
  await assert.rejects(main({ token: "tok-race" }), (error) => error.code === "INVITATION_INVALID");
  assert.strictEqual(cloud.all("space_members").filter((m) => m.spaceId === "space-a").length, 2);
});

test("S3 过期邀请被拒绝并标记 expired", async () => {
  const cloud = installMockCloud();
  seedTwoSpaces(cloud);
  cloud.seed("invitations", [{
    _id: "inv-old", id: "inv-old", spaceId: "space-a", token: "tok-old", invitedBy: "user-a",
    role: "member", status: "pending", expiresAt: "2000-01-01T00:00:00.000Z"
  }]);
  cloud.setWXContext({ OPENID: "openid-b" });
  const { main } = loadFunction("acceptInvitation");
  await assert.rejects(main({ token: "tok-old" }), (error) => error.code === "INVITATION_EXPIRED");
  assert.strictEqual(cloud.all("invitations")[0].status, "expired");
});

test("S4 提醒链路端到端：openid 在创建时解析，定时器派发可送达", async () => {
  const cloud = installMockCloud();
  seedTwoSpaces(cloud);
  cloud.seed("cards", [{ _id: "card-1", id: "card-1", spaceId: "space-a", title: "订票", reminderAt: "2000-01-01T00:00:00.000Z" }]);

  cloud.setWXContext({ OPENID: "openid-a" });
  const schedule = loadFunction("scheduleReminder");
  const { reminder } = await schedule.main({ cardId: "card-1", type: "due_soon", wechatTemplateId: "tpl-1" });
  assert.strictEqual(reminder.recipientOpenid, "openid-a", "openid 必须在创建提醒时解析并落库");

  // 非定时器来源不允许驱动派发
  const dispatch = loadFunction("dispatchReminders");
  cloud.setWXContext({ SOURCE: "wx_client" });
  await assert.rejects(dispatch.main(), (error) => error.code === "FORBIDDEN_SOURCE");
  assert.strictEqual(cloud.sentMessages.length, 0);

  // 定时器来源可以派发，且 touser 是真实 openid
  cloud.setWXContext({ SOURCE: "wx_trigger" });
  const { results } = await dispatch.main();
  assert.strictEqual(results[0].status, "sent");
  assert.strictEqual(cloud.sentMessages[0].touser, "openid-a");
  assert.strictEqual(cloud.all("reminders")[0].status, "sent");
});

test("S6 travelEditor 写入带版本守卫，过期 revision 触发 CONFLICT", async () => {
  const cloud = installMockCloud();
  seedTwoSpaces(cloud);
  cloud.seed("travel_plan_instances", [{
    _id: "inst-1", id: "inst-1", spaceId: "space-a", revision: 1, status: "planning",
    days: [], candidatePlaces: [], modules: []
  }]);
  cloud.setWXContext({ OPENID: "openid-a" });

  const { main } = loadFunction("createTravelDay");
  await main({ instanceId: "inst-1", date: "2026-10-01", theme: "第一天", expectedRevision: 1 });
  assert.strictEqual(cloud.all("travel_plan_instances")[0].revision, 2);

  // 携带过期 revision 的并发写入者失败
  await assert.rejects(
    main({ instanceId: "inst-1", date: "2026-10-02", theme: "第二天", expectedRevision: 1 }),
    (error) => error.code === "CONFLICT"
  );
  assert.strictEqual(cloud.all("travel_plan_instances")[0].days.length, 1);
});

test("F8 listTravelTemplates 显式 limit，超过默认 20 条不被截断", async () => {
  const cloud = installMockCloud();
  const templates = [];
  for (let index = 0; index < 25; index += 1) {
    templates.push({ id: `tpl-${index}`, version: "1.0.0", title: `模板 ${index}`, status: "published", days: [] });
  }
  cloud.seed("travel_templates", templates);
  const { main } = loadFunction("listTravelTemplates");
  const result = await main();
  assert.strictEqual(result.templates.length, 25);
});

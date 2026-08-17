const test = require("node:test");
const assert = require("node:assert");
const { installMockCloud, loadFunction } = require("./lib/cloudHarness");

function unsignedDelivery() {
  return {
    schemaVersion: "fitness_delivery_v1",
    deliveryId: "delivery-cloud-w33",
    generatedAt: "2026-08-17T08:00:00.000Z",
    report: {
      schemaVersion: "fitness_review_v2",
      reportId: "review-cloud-w33",
      period: { start: "2026-08-10", end: "2026-08-16" },
      summary: "训练稳定，恢复尚可。",
      metrics: [],
      insights: ["训练频率稳定"],
      recommendations: ["维持当前频率"]
    },
    planPatch: {
      schemaVersion: "plan_patch_v1",
      patchId: "patch-cloud-w34",
      basePlanVersion: "plan-v7",
      changes: [{ operation: "replace", target: "day-2.volume", before: "12 组", after: "10 组", reason: "恢复不足" }]
    }
  };
}

test("发布通道密钥只返回一次，Delivery 经哈希校验后幂等入库", async () => {
  const mock = installMockCloud();
  const createChannel = loadFunction("createFitnessChannel");
  const ingest = loadFunction("ingestFitnessDelivery");
  const { withFitnessHashes } = require("../../apps/wechat-miniprogram/cloudfunctions-shared/fitnessSchema");

  const channel = await createChannel.main({ profile: { displayName: "QDD" } });
  assert.ok(channel.channelId);
  assert.ok(channel.publishToken.length >= 32);
  assert.ok(!mock.all("fitness_channels")[0].publishToken, "数据库不能保存明文 token");

  const delivery = withFitnessHashes(unsignedDelivery());
  const [first, duplicate] = await Promise.all([
    ingest.main({
      httpMethod: "POST",
      body: JSON.stringify({ channelId: channel.channelId, publishToken: channel.publishToken, delivery })
    }),
    ingest.main({ channelId: channel.channelId, publishToken: channel.publishToken, delivery })
  ]);
  assert.strictEqual(first.statusCode, 200);
  const firstBody = JSON.parse(first.body);
  assert.strictEqual(firstBody.delivery.id, duplicate.delivery.id);
  assert.strictEqual(mock.all("fitness_deliveries").length, 1);

  await assert.rejects(
    ingest.main({ channelId: channel.channelId, publishToken: "wrong-token", delivery }),
    /发布凭证无效/
  );

  const denied = await ingest.main({
    httpMethod: "POST",
    body: JSON.stringify({ channelId: channel.channelId, publishToken: "wrong-token", delivery })
  });
  assert.strictEqual(denied.statusCode, 401);
  assert.ok(!denied.body.includes("wrong-token"));
  await assert.rejects(
    ingest.main({
      channelId: channel.channelId,
      publishToken: channel.publishToken,
      delivery: Object.assign({}, delivery, { contentHash: "sha256:tampered" })
    }),
    /内容哈希不匹配/
  );
});

test("用户只能读取自己的报告，计划确认必须绑定 Patch 哈希", async () => {
  installMockCloud();
  const createChannel = loadFunction("createFitnessChannel");
  const ingest = loadFunction("ingestFitnessDelivery");
  const list = loadFunction("listFitnessDeliveries");
  const decide = loadFunction("decideFitnessPlanPatch");
  const { withFitnessHashes } = require("../../apps/wechat-miniprogram/cloudfunctions-shared/fitnessSchema");

  const channel = await createChannel.main({});
  const delivery = withFitnessHashes(unsignedDelivery());
  await ingest.main({ channelId: channel.channelId, publishToken: channel.publishToken, delivery });
  const inbox = await list.main({});
  assert.strictEqual(inbox.deliveries.length, 1);

  await assert.rejects(
    decide.main({ deliveryId: delivery.deliveryId, patchHash: "sha256:stale", decision: "accepted" }),
    /Patch 已变化/
  );
  const result = await decide.main({
    deliveryId: delivery.deliveryId,
    patchHash: delivery.planPatch.patchHash,
    decision: "accepted"
  });
  assert.strictEqual(result.delivery.decision.status, "accepted");
  await assert.rejects(
    decide.main({ deliveryId: delivery.deliveryId, patchHash: delivery.planPatch.patchHash, decision: "rejected" }),
    /已经完成决策/
  );
});

test("体测报告按用户隔离，异常指标拒绝入库", async () => {
  const mock = installMockCloud();
  const importBody = loadFunction("importBodyMeasurement");
  const listBody = loadFunction("listBodyMeasurements");
  const input = {
    measurementId: "body-20260611-1844",
    measuredAt: "2026-06-11T18:44:00.000Z",
    imageFileId: "cloud://body/report.png",
    metrics: { weightKg: 79.3, bodyFatPct: 14.7 }
  };
  const created = await importBody.main(input);
  assert.strictEqual(created.measurement.reviewStatus, "confirmed");
  assert.strictEqual((await listBody.main({})).measurements.length, 1);

  await assert.rejects(importBody.main(Object.assign({}, input, {
    measurementId: "bad-body",
    metrics: { weightKg: -1, bodyFatPct: 120 }
  })), /合理范围/);

  mock.setWXContext({ OPENID: "openid-another-user" });
  assert.strictEqual((await listBody.main({})).measurements.length, 0);
});

test("云端空间入口同样只允许旅行模板", async () => {
  installMockCloud();
  const createSpace = loadFunction("createSpace");
  await assert.rejects(createSpace.main({ templateType: "family_life" }), /只支持旅行空间/);
  const result = await createSpace.main({ templateType: "travel_team", name: "北海道旅行" });
  assert.strictEqual(result.space.templateType, "travel_team");
});

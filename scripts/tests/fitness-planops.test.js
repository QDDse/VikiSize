const test = require("node:test");
const assert = require("node:assert");
const path = require("path");

const STORE_PATH = path.resolve(__dirname, "../../apps/wechat-miniprogram/services/localStore.js");

function freshStore() {
  Object.keys(require.cache).forEach((key) => {
    if (key.includes(`${path.sep}apps${path.sep}wechat-miniprogram${path.sep}`)) delete require.cache[key];
  });
  return require(STORE_PATH);
}

function delivery(overrides = {}) {
  return Object.assign({
    schemaVersion: "fitness_delivery_v1",
    deliveryId: "delivery-2026-w33",
    contentHash: "sha256:delivery-content-a",
    generatedAt: "2026-08-17T08:00:00.000Z",
    report: {
      schemaVersion: "fitness_review_v2",
      reportId: "review-2026-w33",
      period: { start: "2026-08-10", end: "2026-08-16" },
      summary: "训练稳定，恢复尚可。",
      metrics: [{ key: "training_sessions", label: "训练次数", value: 4, unit: "次" }],
      insights: ["深蹲训练量连续两周增长"],
      recommendations: ["下周保持四次训练"]
    },
    planPatch: {
      schemaVersion: "plan_patch_v1",
      patchId: "patch-2026-w34",
      patchHash: "sha256:patch-a",
      basePlanVersion: "plan-v7",
      changes: [{
        operation: "replace",
        target: "day-2.squat.volume",
        title: "深蹲总组数",
        before: "12 组",
        after: "10 组",
        reason: "疲劳指标升高"
      }]
    }
  }, overrides);
}

test.beforeEach(() => {
  delete global.wx;
});

test("Fitness Delivery 相同内容幂等、同 id 不同内容拒绝", () => {
  const store = freshStore();
  store.resetLocalState();

  const first = store.ingestFitnessDelivery(delivery());
  const duplicate = store.ingestFitnessDelivery(delivery());
  assert.strictEqual(duplicate.id, first.id);
  assert.strictEqual(store.listFitnessDeliveries().length, 1);

  assert.throws(
    () => store.ingestFitnessDelivery(delivery({ contentHash: "sha256:tampered" })),
    /Delivery 内容冲突/
  );
});

test("计划决策必须绑定当前 Patch 哈希且只能决策一次", () => {
  const store = freshStore();
  store.resetLocalState();
  store.ingestFitnessDelivery(delivery());

  assert.throws(
    () => store.decideFitnessPlanPatch("delivery-2026-w33", "sha256:old", "accepted"),
    /Patch 已变化/
  );

  const accepted = store.decideFitnessPlanPatch("delivery-2026-w33", "sha256:patch-a", "accepted");
  assert.strictEqual(accepted.decision.status, "accepted");
  assert.strictEqual(accepted.decision.patchHash, "sha256:patch-a");
  assert.throws(
    () => store.decideFitnessPlanPatch("delivery-2026-w33", "sha256:patch-a", "rejected"),
    /已经完成决策/
  );
});

test("不完整或未知 schema 的 Delivery 不得进入收件箱", () => {
  const store = freshStore();
  store.resetLocalState();
  assert.throws(() => store.ingestFitnessDelivery(delivery({ schemaVersion: "fitness_delivery_v0" })), /schema/);
  assert.throws(() => store.ingestFitnessDelivery(delivery({ report: null })), /报告/);
});

test("体测报告导入只接受合理范围内的已确认指标", () => {
  const store = freshStore();
  store.resetLocalState();
  const record = store.createBodyMeasurementImport({
    measurementId: "body-20260611-1844",
    measuredAt: "2026-06-11T18:44:00.000Z",
    imageFileId: "wxcloud://body-report.png",
    metrics: { weightKg: 79.3, bodyFatPct: 14.7 }
  });
  assert.strictEqual(record.schemaVersion, "body_measurement_v1");
  assert.strictEqual(record.reviewStatus, "confirmed");
  assert.strictEqual(store.listBodyMeasurementImports().length, 1);
  assert.throws(() => store.createBodyMeasurementImport({
    measurementId: "invalid",
    measuredAt: "2026-06-11T18:44:00.000Z",
    metrics: { weightKg: -1, bodyFatPct: 120 }
  }), /合理范围/);
});

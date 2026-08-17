const { collection, now } = require("./_shared/cloud");
const { currentUser } = require("./_shared/permissions");
const { addWithId } = require("./_shared/repo");

function normalizeInput(event) {
  const weightKg = Number(event && event.metrics && event.metrics.weightKg);
  const bodyFatPct = Number(event && event.metrics && event.metrics.bodyFatPct);
  if (!event || !event.measurementId || !event.measuredAt) throw new Error("体测记录缺少标识或测量时间");
  if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 300 || !Number.isFinite(bodyFatPct) || bodyFatPct < 1 || bodyFatPct > 80) {
    throw new Error("体重或体脂率超出合理范围，请检查报告");
  }
  return { weightKg, bodyFatPct };
}

exports.main = async (event) => {
  const metrics = normalizeInput(event);
  const user = await currentUser(event.profile || {});
  const existing = await collection("body_measurements").where({ userId: user.id, measurementId: event.measurementId }).limit(1).get();
  if (existing.data.length) return { measurement: existing.data[0], created: false };
  const timestamp = now();
  const id = await addWithId("body_measurements", {
    userId: user.id,
    measurementId: event.measurementId,
    schemaVersion: "body_measurement_v1",
    source: "wechat_miniprogram_report",
    measuredAt: event.measuredAt,
    imageFileId: event.imageFileId || "",
    metrics: Object.assign({}, event.metrics, metrics),
    reviewStatus: "confirmed",
    createdAt: timestamp,
    updatedAt: timestamp
  });
  return { measurement: (await collection("body_measurements").doc(id).get()).data, created: true };
};

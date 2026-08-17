const crypto = require("crypto");

function stableSort(value) {
  if (Array.isArray(value)) return value.map(stableSort);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value).sort().reduce((result, key) => {
    if (value[key] !== undefined) result[key] = stableSort(value[key]);
    return result;
  }, {});
}

function sha256(value) {
  const text = typeof value === "string" ? value : JSON.stringify(stableSort(value));
  return `sha256:${crypto.createHash("sha256").update(text).digest("hex")}`;
}

function patchPayload(patch) {
  const copy = Object.assign({}, patch);
  delete copy.patchHash;
  return copy;
}

function deliveryPayload(delivery) {
  const copy = Object.assign({}, delivery);
  delete copy.contentHash;
  return copy;
}

function withFitnessHashes(input) {
  const delivery = JSON.parse(JSON.stringify(input));
  if (delivery.planPatch) delivery.planPatch.patchHash = sha256(patchPayload(delivery.planPatch));
  delivery.contentHash = sha256(deliveryPayload(delivery));
  return delivery;
}

function validateFitnessDelivery(delivery) {
  if (!delivery || delivery.schemaVersion !== "fitness_delivery_v1") throw new Error("不支持的 Fitness Delivery schema");
  if (!delivery.deliveryId || !delivery.generatedAt || !delivery.contentHash) throw new Error("Fitness Delivery 缺少标识");
  if (!delivery.report || delivery.report.schemaVersion !== "fitness_review_v2" || !delivery.report.reportId) throw new Error("Fitness 报告不完整");
  if (delivery.planPatch) {
    if (delivery.planPatch.schemaVersion !== "plan_patch_v1" || !delivery.planPatch.patchId || !delivery.planPatch.patchHash) throw new Error("计划变更不完整");
    if (!Array.isArray(delivery.planPatch.changes)) throw new Error("计划变更必须为列表");
    if (delivery.planPatch.patchHash !== sha256(patchPayload(delivery.planPatch))) throw new Error("Patch 内容哈希不匹配");
  }
  if (delivery.contentHash !== sha256(deliveryPayload(delivery))) throw new Error("Delivery 内容哈希不匹配");
  return delivery;
}

function tokenHash(token) {
  return sha256(String(token || ""));
}

function secureHashEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

module.exports = { secureHashEqual, sha256, tokenHash, validateFitnessDelivery, withFitnessHashes };

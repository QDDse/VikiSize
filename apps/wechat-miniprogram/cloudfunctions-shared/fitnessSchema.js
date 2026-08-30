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
    validateWriteback(delivery.planPatch.writeback);
    if (delivery.planPatch.patchHash !== sha256(patchPayload(delivery.planPatch))) throw new Error("Patch 内容哈希不匹配");
  }
  if (delivery.contentHash !== sha256(deliveryPayload(delivery))) throw new Error("Delivery 内容哈希不匹配");
  return delivery;
}

function validateWriteback(writeback) {
  if (!writeback) return;
  if (writeback.provider !== "xunji" || writeback.operation !== "upsert_training_day_v2") {
    throw new Error("不支持的训记写回操作");
  }
  if (!Array.isArray(writeback.summary) || !writeback.summary.length) throw new Error("训记写回缺少确认摘要");
  if (!writeback.request || !Array.isArray(writeback.request.res) || !writeback.request.res.length || writeback.request.res.length > 4) {
    throw new Error("训记写回训练记录数量必须为 1 到 4 条");
  }
  if (writeback.request.client_request_id || writeback.request.dry_run !== undefined || writeback.request.confirmed !== undefined) {
    throw new Error("训记写回请求包含服务端保留字段");
  }
  const dates = new Set(writeback.request.res.map((item) => item && item.datestr));
  if (dates.size !== 1 || dates.has(undefined) || dates.has("")) throw new Error("训记单次写回必须属于同一天");
  writeback.summary.forEach((item) => {
    if (!item || !item.datestr || !item.label || item.after === undefined) throw new Error("训记写回确认摘要不完整");
    if (!dates.has(item.datestr)) throw new Error("训记写回摘要日期与请求不一致");
  });
  const serialized = JSON.stringify(writeback.request).toLowerCase();
  if (/authorization|api[_-]?key|bearer|publish[_-]?token/.test(serialized)) throw new Error("训记写回请求不得包含凭证");
}

function tokenHash(token) {
  return sha256(String(token || ""));
}

function secureHashEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

module.exports = { patchPayload, secureHashEqual, sha256, tokenHash, validateFitnessDelivery, validateWriteback, withFitnessHashes };

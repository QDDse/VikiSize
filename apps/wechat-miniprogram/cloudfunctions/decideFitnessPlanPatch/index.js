const { _, collection, now } = require("./_shared/cloud");
const { currentUser } = require("./_shared/permissions");
const { notFound } = require("./_shared/repo");

exports.main = async (event) => {
  if (event.decision !== "accepted" && event.decision !== "rejected") throw new Error("不支持的计划决策");
  const user = await currentUser(event.profile || {});
  const result = await collection("fitness_deliveries").where({ userId: user.id, deliveryId: event.deliveryId }).limit(1).get();
  const delivery = result.data[0];
  if (!delivery || !delivery.planPatch) throw notFound("计划变更不存在");
  if (delivery.planPatch.patchHash !== event.patchHash) throw new Error("Patch 已变化，请刷新后重新确认");
  if (delivery.decision) throw new Error("该计划已经完成决策");
  const decision = { status: event.decision, patchHash: event.patchHash, decidedAt: now(), decidedBy: user.id };
  // CloudBase 会把普通对象展开成嵌套字段更新；旧值为 null 时，写入
  // decision.decidedAt 会失败。使用 _.set 明确整体替换 decision 对象。
  const updated = await collection("fitness_deliveries").where({ _id: delivery._id, decision: null }).update({
    data: { decision: _.set(decision), updatedAt: decision.decidedAt }
  });
  if (!updated.stats.updated) throw new Error("该计划已经完成决策");
  return { delivery: Object.assign({}, delivery, { decision }) };
};

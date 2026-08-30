const { _, collection, now } = require("./_shared/cloud");
const { currentUser } = require("./_shared/permissions");
const { notFound } = require("./_shared/repo");
const { applyTrainingWriteback } = require("./_shared/xunjiClient");
const { patchPayload, sha256, validateWriteback } = require("./_shared/fitnessSchema");

function createHandler(dependencies) {
  const writeToXunji = dependencies && dependencies.applyTrainingWriteback
    ? dependencies.applyTrainingWriteback
    : applyTrainingWriteback;
  return async (event) => {
    if (event.decision !== "accepted" && event.decision !== "rejected") throw new Error("不支持的计划决策");
    const user = await currentUser(event.profile || {});
    const result = await collection("fitness_deliveries").where({ userId: user.id, deliveryId: event.deliveryId }).limit(1).get();
    const delivery = result.data[0];
    if (!delivery || !delivery.planPatch) throw notFound("计划变更不存在");
    if (delivery.planPatch.patchHash !== event.patchHash) throw new Error("Patch 已变化，请刷新后重新确认");
    if (delivery.planPatch.patchHash !== sha256(patchPayload(delivery.planPatch))) throw new Error("Patch 内容校验失败，请重新生成报告");
    if (delivery.decision) throw new Error("该计划已经完成决策");

    const decidedAt = now();
    const baseDecision = { patchHash: event.patchHash, decidedAt, decidedBy: user.id };
    if (event.decision === "accepted" && delivery.planPatch.writeback) {
      validateWriteback(delivery.planPatch.writeback);
      const reservation = Object.assign({}, baseDecision, { status: "applying", writeback: { status: "pending" } });
      const reserved = await collection("fitness_deliveries").where({ _id: delivery._id, decision: null }).update({
        data: { decision: _.set(reservation), updatedAt: decidedAt }
      });
      if (!reserved.stats.updated) throw new Error("该计划已经完成决策");

      let writeback;
      try {
        writeback = await writeToXunji({
          writeback: delivery.planPatch.writeback,
          deliveryId: delivery.deliveryId,
          patchHash: event.patchHash,
          env: process.env
        });
      } catch (error) {
        if (error.writeStage === "write") {
          const uncertain = Object.assign({}, baseDecision, {
            status: "accepted",
            writeback: { status: "write_uncertain", readBackVerified: false, message: "训记写入结果不确定，请先在训记 App 核对" }
          });
          await collection("fitness_deliveries").doc(delivery._id).update({ data: { decision: _.set(uncertain), updatedAt: now() } });
        } else {
          await collection("fitness_deliveries").doc(delivery._id).update({ data: { decision: _.set(null), updatedAt: now() } });
        }
        throw error;
      }

      const decision = Object.assign({}, baseDecision, { status: "accepted", writeback });
      await collection("fitness_deliveries").doc(delivery._id).update({ data: { decision: _.set(decision), updatedAt: now() } });
      return { delivery: Object.assign({}, delivery, { decision }) };
    }

    const decision = Object.assign({}, baseDecision, { status: event.decision, writeback: null });
    // CloudBase 会把普通对象展开成嵌套字段更新；旧值为 null 时，写入
    // decision.decidedAt 会失败。使用 _.set 明确整体替换 decision 对象。
    const updated = await collection("fitness_deliveries").where({ _id: delivery._id, decision: null }).update({
      data: { decision: _.set(decision), updatedAt: decision.decidedAt }
    });
    if (!updated.stats.updated) throw new Error("该计划已经完成决策");
    return { delivery: Object.assign({}, delivery, { decision }) };
  };
}

exports.createHandler = createHandler;
exports.main = createHandler();

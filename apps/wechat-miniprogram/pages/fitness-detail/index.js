const fitnessRepository = require("../../services/fitnessRepository");

function decisionLabel(decision) {
  if (!decision) return "";
  if (decision.status === "applying") return "正在写回训记，请勿重复提交";
  if (decision.status === "rejected") return "已拒绝此计划";
  if (!decision.writeback) return "已采纳此计划";
  if (decision.writeback.status === "write_uncertain") return "已采纳，训记写入结果需人工核验";
  return decision.writeback.readBackVerified ? "已采纳并写回训记（已回读）" : "已采纳并写回训记（待核验）";
}

function writebackSummaryText(delivery) {
  const writeback = delivery && delivery.planPatch && delivery.planPatch.writeback;
  if (!writeback || !Array.isArray(writeback.summary)) return "";
  return writeback.summary.slice(0, 4).map((item) => {
    const before = item.before === null || item.before === undefined ? "新建" : item.before;
    return `${item.datestr} ${item.label}: ${before} → ${item.after}${item.unit || ""}`;
  }).join("\n");
}

Page({
  data: {
    deliveryId: "",
    delivery: null,
    source: "local",
    decisionText: "",
    loadError: ""
  },

  onLoad(options) {
    this.setData({ deliveryId: options.id || "" });
    this.refresh();
  },

  async refresh() {
    try {
      const result = await fitnessRepository.getDelivery(this.data.deliveryId, true);
      if (!result.item) throw new Error("报告不存在");
      this.setData({
        delivery: result.item,
        source: result.source,
        decisionText: decisionLabel(result.item.decision),
        loadError: ""
      });
    } catch (error) {
      this.setData({ loadError: error.message || "报告加载失败" });
    }
  },

  acceptPatch() {
    const summary = writebackSummaryText(this.data.delivery);
    const content = summary
      ? `确认以下变更后，将先校验再写入训记训练记录：\n${summary}`
      : "采纳后，本次 Patch 将被标记为你的有效决策。";
    this.confirmDecision("accepted", summary ? "确认采纳并写回" : "采纳计划变更", content);
  },

  rejectPatch() {
    this.confirmDecision("rejected", "拒绝计划变更", "拒绝后，本次 Patch 不会进入后续执行计划。");
  },

  confirmDecision(decision, title, content) {
    wx.showModal({
      title,
      content,
      confirmText: decision === "accepted" ? "确认采纳" : "确认拒绝",
      success: async (result) => {
        if (!result.confirm) return;
        try {
          if (decision === "accepted" && this.data.delivery.planPatch.writeback && this.data.source !== "cloud") {
            throw new Error("云端不可用，不能安全写回训记");
          }
          const delivery = await fitnessRepository.decidePlanPatch(
            this.data.delivery.deliveryId,
            this.data.delivery.planPatch.patchHash,
            decision,
            this.data.source
          );
          this.setData({ delivery, decisionText: decisionLabel(delivery.decision) });
          wx.showToast({ title: delivery.decision && delivery.decision.writeback ? "已写回训记" : "决策已记录", icon: "success" });
        } catch (error) {
          wx.showToast({ title: error.message || "提交失败", icon: "none" });
        }
      }
    });
  }
});

const fitnessRepository = require("../../services/fitnessRepository");

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
        decisionText: result.item.decision ? (result.item.decision.status === "accepted" ? "已采纳此计划" : "已拒绝此计划") : "",
        loadError: ""
      });
    } catch (error) {
      this.setData({ loadError: error.message || "报告加载失败" });
    }
  },

  acceptPatch() {
    this.confirmDecision("accepted", "采纳计划变更", "采纳后，本次 Patch 将被标记为你的有效决策。");
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
          const delivery = await fitnessRepository.decidePlanPatch(
            this.data.delivery.deliveryId,
            this.data.delivery.planPatch.patchHash,
            decision,
            this.data.source
          );
          this.setData({ delivery, decisionText: decision === "accepted" ? "已采纳此计划" : "已拒绝此计划" });
          wx.showToast({ title: "决策已记录", icon: "success" });
        } catch (error) {
          wx.showToast({ title: error.message || "提交失败", icon: "none" });
        }
      }
    });
  }
});

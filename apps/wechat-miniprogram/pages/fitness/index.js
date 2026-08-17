const fitnessRepository = require("../../services/fitnessRepository");

function dateText(value) {
  return value ? String(value).slice(0, 10) : "";
}

Page({
  data: {
    deliveries: [],
    bodyMeasurements: [],
    unreadCount: 0,
    cloudWarning: "",
    loadError: ""
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    try {
      // 两个云函数都会确保用户存在；首次进入时串行调用，避免并发创建同一 openid 用户。
      const deliveryResult = await fitnessRepository.listDeliveries();
      const bodyMeasurements = await fitnessRepository.listBodyMeasurements();
      const deliveries = deliveryResult.items.map((item) => Object.assign({}, item, {
        generatedDate: dateText(item.generatedAt),
        periodText: item.report && item.report.period ? `${item.report.period.start} — ${item.report.period.end}` : "",
        decisionText: item.decision ? (item.decision.status === "accepted" ? "已采纳" : "已拒绝") : (item.planPatch ? "待确认" : "仅报告")
      }));
      this.setData({
        deliveries,
        bodyMeasurements: bodyMeasurements.slice(0, 3).map((item) => Object.assign({}, item, { measuredDate: dateText(item.measuredAt) })),
        unreadCount: deliveries.filter((item) => !item.readAt).length,
        cloudWarning: deliveryResult.warning,
        loadError: ""
      });
    } catch (error) {
      this.setData({ loadError: error.message || "健身数据加载失败" });
    }
  },

  openDelivery(event) {
    wx.navigateTo({ url: `/pages/fitness-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  openBodyImport() {
    wx.navigateTo({ url: "/pages/body-import/index" });
  },

  async createPipelineChannel() {
    try {
      const channel = await fitnessRepository.createChannel();
      const config = JSON.stringify({ channelId: channel.channelId, publishToken: channel.publishToken }, null, 2);
      wx.setClipboardData({
        data: config,
        success: () => wx.showModal({
          title: "Pipeline 凭证已复制",
          content: "发布 Token 只展示这一次。请保存到 Pipeline Secret，不要写入仓库。再次生成会使旧 Token 失效。",
          showCancel: false
        })
      });
    } catch (error) {
      wx.showToast({ title: error.message || "创建失败", icon: "none" });
    }
  }
});

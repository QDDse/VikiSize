const fitnessRepository = require("../../services/fitnessRepository");

function dateText(value) {
  return value ? String(value).slice(0, 10) : "";
}

Page({
  data: {
    deliveries: [],
    bodyMeasurements: [],
    unreadCount: 0,
    notificationConfigured: false,
    notificationStatus: "disabled",
    notificationText: "开启周报提醒",
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
      const notification = await fitnessRepository.getNotificationSettings();
      const deliveries = deliveryResult.items.map((item) => Object.assign({}, item, {
        generatedDate: dateText(item.generatedAt),
        periodText: item.report && item.report.period ? `${item.report.period.start} — ${item.report.period.end}` : "",
        decisionText: item.decision ? (item.decision.status === "accepted" ? "已采纳" : "已拒绝") : (item.planPatch ? "待确认" : "仅报告")
      }));
      this.setData({
        deliveries,
        bodyMeasurements: bodyMeasurements.slice(0, 3).map((item) => Object.assign({}, item, { measuredDate: dateText(item.measuredAt) })),
        unreadCount: deliveries.filter((item) => !item.readAt).length,
        notificationConfigured: notification.configured,
        notificationStatus: notification.status,
        notificationText: notification.status === "granted" ? "下次周报将提醒" : "开启周报提醒",
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
  },

  async enableWeeklyReminder() {
    try {
      const settings = await fitnessRepository.getNotificationSettings();
      if (!settings.configured || !settings.templateId) {
        wx.showModal({
          title: "周报提醒尚未配置",
          content: settings.message || "请先在云函数环境配置微信订阅消息模板。",
          showCancel: false
        });
        return;
      }
      const result = await wx.requestSubscribeMessage({ tmplIds: [settings.templateId] });
      if (result[settings.templateId] !== "accept") {
        wx.showToast({ title: "未获得本次提醒授权", icon: "none" });
        return;
      }
      await fitnessRepository.subscribeWeeklyReport(settings.templateId);
      this.setData({ notificationStatus: "granted", notificationText: "下次周报将提醒" });
      wx.showToast({ title: "已开启一次提醒", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "开启提醒失败", icon: "none" });
    }
  }
});

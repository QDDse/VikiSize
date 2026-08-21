const fitnessRepository = require("../../services/fitnessRepository");

function dateText(value) {
  return value ? String(value).slice(0, 10) : "";
}

function decisionState(item) {
  if (item.decision) {
    return {
      text: item.decision.status === "accepted" ? "已采纳" : "未采纳",
      tone: "done"
    };
  }
  if (item.planPatch) {
    return { text: "待你确认", tone: "action" };
  }
  return { text: "可阅读", tone: "read" };
}

function reportInsights(delivery) {
  const insights = delivery && delivery.report && Array.isArray(delivery.report.insights)
    ? delivery.report.insights
    : [];
  return insights.slice(0, 3).map((text, index) => ({
    key: String(delivery.deliveryId || "report") + "-" + index,
    number: index + 1,
    text
  }));
}

function reportMetrics(delivery) {
  const metrics = delivery && delivery.report && Array.isArray(delivery.report.metrics)
    ? delivery.report.metrics
    : [];
  return metrics.slice(0, 3).map((item, index) => ({
    key: String(item.key || index),
    label: item.label || item.key || "指标",
    value: item.value === undefined || item.value === null || item.value === "" ? "—" : item.value,
    unit: item.unit || ""
  }));
}

function formatDelivery(item) {
  const state = decisionState(item);
  return Object.assign({}, item, {
    generatedDate: dateText(item.generatedAt),
    periodText: item.report && item.report.period ? item.report.period.start + " — " + item.report.period.end : "",
    reportTitle: item.report && item.report.summary ? item.report.summary : "本周训练回顾",
    decisionText: state.text,
    decisionTone: state.tone
  });
}

function selectedDelivery(deliveries, selectedId) {
  return deliveries.find((item) => item.deliveryId === selectedId)
    || deliveries.find((item) => !item.readAt)
    || deliveries[0]
    || null;
}

Page({
  data: {
    deliveries: [],
    bodyMeasurements: [],
    unreadCount: 0,
    pendingCount: 0,
    activeDeliveryId: "",
    activeDelivery: null,
    activeInsights: [],
    activeMetrics: [],
    notificationConfigured: false,
    notificationTemplateId: "",
    notificationMessage: "",
    notificationStatus: "disabled",
    notificationText: "开启提醒",
    cloudWarning: "",
    loadError: ""
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    try {
      const deliveryResult = await fitnessRepository.listDeliveries();
      const bodyMeasurements = await fitnessRepository.listBodyMeasurements();
      const notification = await fitnessRepository.getNotificationSettings();
      const deliveries = deliveryResult.items.map(formatDelivery);
      const activeDelivery = selectedDelivery(deliveries, this.data.activeDeliveryId);
      this.setData({
        deliveries,
        bodyMeasurements: bodyMeasurements.slice(0, 3).map((item) => Object.assign({}, item, { measuredDate: dateText(item.measuredAt) })),
        unreadCount: deliveries.filter((item) => !item.readAt).length,
        pendingCount: deliveries.filter((item) => item.planPatch && !item.decision).length,
        activeDeliveryId: activeDelivery ? activeDelivery.deliveryId : "",
        activeDelivery,
        activeInsights: reportInsights(activeDelivery),
        activeMetrics: reportMetrics(activeDelivery),
        notificationConfigured: notification.configured,
        notificationTemplateId: notification.templateId || "",
        notificationMessage: notification.message || "",
        notificationStatus: notification.status,
        notificationText: notification.status === "granted" ? "提醒已就绪" : "开启提醒",
        cloudWarning: deliveryResult.warning,
        loadError: ""
      });
    } catch (error) {
      this.setData({ loadError: error.message || "健身数据加载失败" });
    }
  },

  selectDelivery(event) {
    const deliveryId = event.currentTarget.dataset.id;
    const activeDelivery = this.data.deliveries.find((item) => item.deliveryId === deliveryId);
    if (!activeDelivery) return;
    this.setData({
      activeDeliveryId: deliveryId,
      activeDelivery,
      activeInsights: reportInsights(activeDelivery),
      activeMetrics: reportMetrics(activeDelivery)
    });
  },

  openDelivery(event) {
    wx.navigateTo({ url: "/pages/fitness-detail/index?id=" + event.currentTarget.dataset.id });
  },

  openActiveDelivery() {
    if (!this.data.activeDeliveryId) return;
    wx.navigateTo({ url: "/pages/fitness-detail/index?id=" + this.data.activeDeliveryId });
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
          title: "数据接入凭证已复制",
          content: "发布凭证只展示这一次。请保存到受控的发布环境；再次生成会使旧凭证失效。",
          showCancel: false
        })
      });
    } catch (error) {
      wx.showToast({ title: error.message || "创建失败", icon: "none" });
    }
  },

  async enableWeeklyReminder() {
    try {
      const templateId = this.data.notificationTemplateId;
      if (!this.data.notificationConfigured || !templateId) {
        wx.showModal({
          title: "提醒尚未配置",
          content: this.data.notificationMessage || "请先在云函数环境配置微信订阅消息模板。",
          showCancel: false
        });
        return;
      }
      const result = await wx.requestSubscribeMessage({ tmplIds: [templateId] });
      if (result[templateId] !== "accept") {
        wx.showToast({ title: "未获得本次提醒授权", icon: "none" });
        return;
      }
      await fitnessRepository.subscribeWeeklyReport(templateId);
      this.setData({ notificationStatus: "granted", notificationText: "提醒已就绪" });
      wx.showToast({ title: "已开启一次提醒", icon: "success" });
    } catch (error) {
      const errCode = error && error.errCode !== undefined ? "错误码：" + error.errCode + "\n" : "";
      const errMsg = error && (error.errMsg || error.message) || "微信订阅接口调用失败";
      wx.showModal({
        title: "开启提醒失败",
        content: errCode + errMsg,
        showCancel: false
      });
    }
  }
});

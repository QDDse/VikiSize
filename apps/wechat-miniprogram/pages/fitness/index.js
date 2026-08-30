const fitnessRepository = require("../../services/fitnessRepository");

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function dateText(value) {
  return value ? String(value).slice(0, 10) : "";
}

function localDate(value) {
  const text = dateText(value);
  return text ? new Date(`${text}T12:00:00`) : null;
}

function monthDay(value) {
  const date = localDate(value);
  return date && !Number.isNaN(date.getTime()) ? `${date.getMonth() + 1}月${date.getDate()}日` : "";
}

function weekday(value) {
  const date = localDate(value);
  return date && !Number.isNaN(date.getTime()) ? WEEKDAYS[date.getDay()] : "";
}

function currentWeekRange(now) {
  const current = new Date(now || Date.now());
  current.setHours(12, 0, 0, 0);
  const offset = (current.getDay() + 6) % 7;
  const start = new Date(current);
  start.setDate(current.getDate() - offset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const endText = start.getMonth() === end.getMonth()
    ? `${end.getDate()}日`
    : `${end.getMonth() + 1}月${end.getDate()}日`;
  return `${start.getMonth() + 1}月${start.getDate()}日–${endText}`;
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

function formatDelivery(item, index) {
  const state = decisionState(item);
  const generatedDate = dateText(item.generatedAt);
  return Object.assign({}, item, {
    generatedDate,
    archiveDate: monthDay(generatedDate),
    archiveWeekday: weekday(generatedDate),
    archiveTitle: index === 0 ? "本周训练周报" : index === 1 ? "上周训练周报" : "训练周报",
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
    weekRangeText: "",
    weeklyStatusTitle: "本周无需处理",
    weeklyStatusCopy: "暂无待确认项目",
    latestMeasurement: null,
    measurementCount: 0,
    activeDeliveryId: "",
    notificationConfigured: false,
    notificationTemplateId: "",
    notificationMessage: "",
    notificationStatus: "disabled",
    notificationText: "开启提醒",
    reminderNote: "订阅消息仅授权一次",
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
      const formattedMeasurements = bodyMeasurements.slice(0, 3).map((item) => Object.assign({}, item, {
        measuredDate: dateText(item.measuredAt),
        measuredDisplayDate: monthDay(item.measuredAt)
      }));
      const pendingCount = deliveries.filter((item) => item.planPatch && !item.decision).length;
      this.setData({
        deliveries,
        bodyMeasurements: formattedMeasurements,
        latestMeasurement: formattedMeasurements[0] || null,
        measurementCount: bodyMeasurements.length,
        unreadCount: deliveries.filter((item) => !item.readAt).length,
        pendingCount,
        weekRangeText: currentWeekRange(new Date()),
        weeklyStatusTitle: pendingCount ? `${pendingCount} 项待你确认` : "本周无需处理",
        weeklyStatusCopy: `${deliveries.length} 份周报已归档，${pendingCount ? `${pendingCount} 项待确认` : "暂无待确认项目"}`,
        activeDeliveryId: activeDelivery ? activeDelivery.deliveryId : "",
        notificationConfigured: notification.configured,
        notificationTemplateId: notification.templateId || "",
        notificationMessage: notification.message || "",
        notificationStatus: notification.status,
        notificationText: notification.status === "granted" ? "提醒已就绪" : "开启提醒",
        reminderNote: notification.status === "granted" ? "一次提醒已就绪，发送后可再次开启" : "订阅消息仅授权一次",
        cloudWarning: deliveryResult.warning,
        loadError: ""
      });
    } catch (error) {
      this.setData({ loadError: error.message || "健身数据加载失败" });
    }
  },

  openDelivery(event) {
    wx.navigateTo({ url: "/pages/fitness-detail/index?id=" + event.currentTarget.dataset.id });
  },

  openActiveDelivery() {
    if (!this.data.activeDeliveryId) return;
    wx.navigateTo({ url: "/pages/fitness-detail/index?id=" + this.data.activeDeliveryId });
  },

  async toggleWeeklyReminder(event) {
    if (!event.detail.value || this.data.notificationStatus === "granted") return;
    await this.enableWeeklyReminder();
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
      this.setData({
        notificationStatus: "granted",
        notificationText: "提醒已就绪",
        reminderNote: "一次提醒已就绪，发送后可再次开启"
      });
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

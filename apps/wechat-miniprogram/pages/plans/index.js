const store = require("../../services/localStore");
const { Modules, RoleLabels } = require("../../domain/constants");
const { toMiniProgramCoordinate } = require("../../services/mapAdapter");
const { safeRefresh } = require("../../utils/pageGuard");

function shortDate(value) {
  const parts = String(value || "").split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return "";
  return `${parts[1]}月${parts[2]}日`;
}

function dateRange(instance) {
  const days = instance && Array.isArray(instance.days) ? instance.days : [];
  if (!days.length) return "";
  const first = days[0].date;
  const last = days[days.length - 1].date;
  const firstParts = String(first || "").split("-").map(Number);
  const lastParts = String(last || "").split("-").map(Number);
  if (firstParts.length !== 3 || lastParts.length !== 3) return `${shortDate(first)}–${shortDate(last)}`;
  const lastText = firstParts[1] === lastParts[1] ? `${lastParts[2]}日` : `${lastParts[1]}月${lastParts[2]}日`;
  return `${firstParts[1]}月${firstParts[2]}日–${lastText}`;
}

function numberText(value) {
  return String(Math.round(Number(value || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function primaryAction(summary, instance) {
  if (summary.travelState === "during") {
    const node = summary.nextTravelNode || summary.currentTravelNode;
    return {
      label: summary.nextTravelNode ? "下一站" : "当前行程",
      title: node ? `${node.startTime || ""}${node.startTime ? " · " : ""}${node.title}` : "查看今日行程",
      meta: node && (node.locationName || node.address) || "打开行程查看详情",
      text: node ? "查看位置" : "查看行程",
      kind: node ? "location" : "plan"
    };
  }
  if (summary.travelState === "after") {
    return {
      label: "旅行已结束",
      title: "回看这次行程",
      meta: `${instance && instance.days ? instance.days.length : 0} 天行程已完成`,
      text: "查看行程",
      kind: "plan"
    };
  }
  const firstDay = instance && instance.days && instance.days[0];
  const isTokyo = firstDay && String(firstDay.theme || "").includes("东京");
  return {
    label: "下一步",
    title: "确认第一天交通",
    meta: isTokyo ? "成田/羽田 → 新宿" : firstDay && firstDay.theme || "补充第一天交通安排",
    text: "去确认",
    kind: "plan"
  };
}

Page({
  data: {
    context: {},
    roleLabel: "",
    tab: "itinerary",
    cards: [],
    budget: {},
    instance: null,
    previewDays: [],
    tripDateRange: "",
    budgetDisplay: "0",
    primaryAction: {},
    activities: [],
    summary: {},
    loadError: ""
  },

  onShow() {
    safeRefresh(this, () => this.refresh());
  },

  refresh() {
    const context = store.getCurrentContext();
    const instance = context.space ? store.getTravelInstance(context.space.id) : null;
    const cards = context.space ? store.getCards(context.space.id, Modules.PLANS) : [];
    const budget = context.space ? store.getBudgetSummary(context.space.id) : {};
    const summary = context.space ? store.getTodaySummary(context.space.id) : {};
    this.setData({
      context,
      roleLabel: context.member ? RoleLabels[context.member.role] : "",
      cards,
      budget,
      instance,
      previewDays: instance && instance.days ? instance.days.slice(0, 2).map((day) => Object.assign({}, day, {
        displayDate: shortDate(day.date)
      })) : [],
      tripDateRange: dateRange(instance),
      budgetDisplay: numberText(budget.estimatedTotal),
      primaryAction: primaryAction(summary, instance),
      summary,
      activities: context.space ? context.state.collections.activities.filter((item) => item.spaceId === context.space.id).slice(0, 8) : []
    });
  },

  setTab(event) {
    this.setData({ tab: event.currentTarget.dataset.tab });
  },

  openSpaces() {
    wx.navigateTo({ url: "/pages/spaces/index" });
  },

  openSettings() {
    wx.navigateTo({ url: "/pages/space-settings/index" });
  },

  openTravelPlan() {
    wx.navigateTo({ url: "/pages/travel-plan/index" });
  },

  openTravelTemplates() {
    wx.navigateTo({ url: "/pages/travel-templates/index" });
  },

  openTravelLocation(event) {
    const node = event.currentTarget.dataset.kind === "current"
      ? this.data.summary.currentTravelNode
      : this.data.summary.nextTravelNode;
    this.openNodeLocation(node);
  },

  openPrimaryAction() {
    if (this.data.primaryAction.kind !== "location") {
      this.openTravelPlan();
      return;
    }
    this.openNodeLocation(this.data.summary.nextTravelNode || this.data.summary.currentTravelNode);
  },

  openNodeLocation(node) {
    const coordinate = node && toMiniProgramCoordinate(node.coordinate);
    if (!coordinate) {
      wx.showToast({ title: "该行程暂无坐标", icon: "none" });
      return;
    }
    wx.openLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      name: node.title,
      address: node.address || node.locationName || "",
      fail: () => wx.setClipboardData({ data: node.address || node.locationName || node.title })
    });
  },

  openCard(event) {
    wx.navigateTo({ url: `/pages/card-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  createPlanCard() {
    if (!this.data.context.canWrite) {
      wx.showToast({ title: "访客只能查看", icon: "none" });
      return;
    }
    const card = store.upsertCard({
      spaceId: this.data.context.space.id,
      module: Modules.PLANS,
      title: "新的旅行任务",
      description: "补充任务说明、负责人、截止时间和提醒。",
      status: "todo",
      details: { category: "confirmations", estimatedCost: 0 }
    });
    wx.navigateTo({ url: `/pages/card-detail/index?id=${card.id}` });
  },

  archiveTravel() {
    wx.showToast({ title: "请在卡片内归档具体任务", icon: "none" });
  }
});

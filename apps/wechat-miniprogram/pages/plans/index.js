const store = require("../../services/localStore");
const { Modules, RoleLabels } = require("../../domain/constants");

Page({
  data: {
    context: {},
    roleLabel: "",
    tab: "itinerary",
    cards: [],
    budget: {},
    instance: null,
    activities: []
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const context = store.getCurrentContext();
    const instance = context.space ? store.getTravelInstance(context.space.id) : null;
    this.setData({
      context,
      roleLabel: context.member ? RoleLabels[context.member.role] : "",
      cards: context.space ? store.getCards(context.space.id, Modules.PLANS) : [],
      budget: context.space ? store.getBudgetSummary(context.space.id) : {},
      instance,
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

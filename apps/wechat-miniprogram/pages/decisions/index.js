const store = require("../../services/localStore");
const { Modules, RoleLabels } = require("../../domain/constants");

Page({
  data: {
    context: {},
    roleLabel: "",
    cards: []
  },

  onShow() {
    const context = store.getCurrentContext();
    this.setData({
      context,
      roleLabel: context.member ? RoleLabels[context.member.role] : "",
      cards: context.space ? store.getCards(context.space.id, Modules.DECISIONS) : []
    });
  },

  openSpaces() {
    wx.navigateTo({ url: "/pages/spaces/index" });
  },

  openSettings() {
    wx.navigateTo({ url: "/pages/space-settings/index" });
  },

  openCard(event) {
    wx.navigateTo({ url: `/pages/card-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  createDecisionCard() {
    if (!this.data.context.canWrite) {
      wx.showToast({ title: "Guest 只能查看", icon: "none" });
      return;
    }
    const card = store.upsertCard({
      spaceId: this.data.context.space.id,
      module: Modules.DECISIONS,
      title: "新的购买决策",
      description: "记录候选项、目标价、当前价和成员意见。",
      status: "pending_confirmation",
      details: { targetPrice: 0, currentPrice: 0, candidates: [] }
    });
    wx.navigateTo({ url: `/pages/card-detail/index?id=${card.id}` });
  }
});

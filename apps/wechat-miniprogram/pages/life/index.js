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
      cards: context.space ? store.getCards(context.space.id, Modules.LIFE) : []
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

  createLifeCard() {
    if (!this.data.context.canWrite) {
      wx.showToast({ title: "访客只能查看", icon: "none" });
      return;
    }
    const card = store.upsertCard({
      spaceId: this.data.context.space.id,
      module: Modules.LIFE,
      title: "新的生活清单",
      description: "记录食谱、采购、家务或共享待办。",
      status: "todo",
      details: { checklist: ["待补充"], quantity: "1" }
    });
    wx.navigateTo({ url: `/pages/card-detail/index?id=${card.id}` });
  }
});

const store = require("../../services/localStore");
const { RoleLabels } = require("../../domain/constants");

Page({
  data: {
    context: {},
    roleLabel: "",
    summary: {},
    searchKeyword: "",
    searchResults: []
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const context = store.getCurrentContext();
    this.setData({
      context,
      roleLabel: context.member ? RoleLabels[context.member.role] : "",
      summary: context.space ? store.getTodaySummary(context.space.id) : {},
      searchResults: []
    });
  },

  openSpaces() {
    wx.navigateTo({ url: "/pages/spaces/index" });
  },

  openSettings() {
    wx.navigateTo({ url: "/pages/space-settings/index" });
  },

  openPlans() {
    wx.switchTab({ url: "/pages/plans/index" });
  },

  openCard(event) {
    wx.navigateTo({ url: `/pages/card-detail/index?id=${event.currentTarget.dataset.id}` });
  },

  onSearchInput(event) {
    const keyword = event.detail.value;
    this.setData({
      searchKeyword: keyword,
      searchResults: store.searchCurrentSpace(keyword)
    });
  }
});

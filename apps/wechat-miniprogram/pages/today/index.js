const store = require("../../services/localStore");
const { RoleLabels } = require("../../domain/constants");
const { toMiniProgramCoordinate } = require("../../services/mapAdapter");

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

  openTravelPlan() { wx.navigateTo({ url: "/pages/travel-plan/index" }); },

  openTravelLocation(event) {
    const node = event.currentTarget.dataset.kind === "current" ? this.data.summary.currentTravelNode : this.data.summary.nextTravelNode;
    const coordinate = node && toMiniProgramCoordinate(node.coordinate);
    if (!coordinate) { wx.showToast({ title: "该行程暂无坐标", icon: "none" }); return; }
    wx.openLocation({ latitude: coordinate.latitude, longitude: coordinate.longitude, name: node.title, address: node.address || node.locationName || "", fail: () => wx.setClipboardData({ data: node.address || node.locationName || node.title }) });
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

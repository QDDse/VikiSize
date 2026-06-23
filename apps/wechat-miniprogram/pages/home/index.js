const {
  getHomeStats,
  getPipeline,
  getProjectMeta,
  getQuickActions
} = require("../../utils/state");

Page({
  data: {
    actions: [],
    highlights: [],
    meta: getProjectMeta(),
    stats: []
  },

  onLoad() {
    this.setData({
      actions: getQuickActions(),
      highlights: getPipeline().slice(0, 3),
      stats: getHomeStats()
    });
  },

  openIdeas() {
    wx.switchTab({
      url: "/pages/ideas/index"
    });
  },

  openProgress() {
    wx.switchTab({
      url: "/pages/progress/index"
    });
  },

  openAction(event) {
    const target = event.currentTarget.dataset.target;

    if (target) {
      wx.switchTab({ url: target });
    }
  }
});

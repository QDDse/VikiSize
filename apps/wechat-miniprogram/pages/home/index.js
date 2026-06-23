const { getPipeline, getProjectMeta } = require("../../utils/state");

Page({
  data: {
    meta: getProjectMeta(),
    highlights: []
  },

  onLoad() {
    this.setData({
      highlights: getPipeline().slice(0, 3)
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
  }
});

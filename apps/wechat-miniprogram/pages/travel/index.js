const { getTravelPlan } = require("../../utils/state");

Page({
  data: {
    plan: {}
  },

  onLoad() {
    this.setData({
      plan: getTravelPlan()
    });
  },

  showPreparing() {
    wx.showToast({
      title: "功能准备中",
      icon: "none"
    });
  }
});

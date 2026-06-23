const { getHomeData } = require("../../utils/state");

Page({
  data: {
    recentRecords: [],
    shortcuts: []
  },

  onLoad() {
    const data = getHomeData();
    this.setData(data);
  },

  openTarget(event) {
    const target = event.currentTarget.dataset.target;
    if (target) {
      wx.switchTab({ url: target });
    }
  },

  showPreparing() {
    wx.showToast({
      title: "功能准备中",
      icon: "none"
    });
  }
});

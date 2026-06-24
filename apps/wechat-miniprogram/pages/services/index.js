const { getServicesData } = require("../../utils/state");

Page({
  data: {
    categories: [],
    services: []
  },

  onLoad() {
    this.setData(getServicesData());
  },

  openService(event) {
    const target = event.currentTarget.dataset.target;
    if (target) {
      wx.navigateTo({ url: target });
      return;
    }

    this.showPreparing();
  },

  showPreparing() {
    wx.showToast({
      title: "功能准备中",
      icon: "none"
    });
  }
});

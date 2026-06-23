const { getServicesData } = require("../../utils/state");

Page({
  data: {
    categories: [],
    services: []
  },

  onLoad() {
    this.setData(getServicesData());
  },

  showPreparing() {
    wx.showToast({
      title: "功能准备中",
      icon: "none"
    });
  }
});

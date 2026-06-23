const { getProfileData } = require("../../utils/state");

Page({
  data: {
    menus: [],
    profile: {},
    stats: []
  },

  onLoad() {
    this.setData(getProfileData());
  },

  showPreparing() {
    wx.showToast({
      title: "功能准备中",
      icon: "none"
    });
  }
});

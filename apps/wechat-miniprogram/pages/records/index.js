const { getRecordsData } = require("../../utils/state");

Page({
  data: {
    profile: {},
    purchaseRecords: [],
    trendBars: []
  },

  onLoad() {
    this.setData(getRecordsData());
  },

  showPreparing() {
    wx.showToast({
      title: "功能准备中",
      icon: "none"
    });
  }
});

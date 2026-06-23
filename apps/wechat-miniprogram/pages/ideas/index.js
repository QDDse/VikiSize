const { groupIdeasByStatus } = require("../../utils/state");

Page({
  data: {
    groups: []
  },

  onLoad() {
    this.setData({
      groups: groupIdeasByStatus()
    });
  }
});

const store = require("../../services/localStore");
const { TemplateOptions } = require("../../domain/constants");

Page({
  data: {
    spaces: [],
    templates: TemplateOptions
  },

  onShow() {
    this.setData({ spaces: store.listSpaces() });
  },

  switchSpace(event) {
    store.switchSpace(event.currentTarget.dataset.id);
    wx.showToast({ title: "已切换空间", icon: "success" });
    wx.switchTab({ url: "/pages/today/index" });
  },

  createSpace(event) {
    const templateType = event.currentTarget.dataset.type;
    store.createSpace({ templateType });
    wx.showToast({ title: "已创建空间", icon: "success" });
    wx.switchTab({ url: "/pages/today/index" });
  }
});

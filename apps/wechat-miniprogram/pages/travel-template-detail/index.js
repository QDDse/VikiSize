const templateService = require("../../services/travelTemplateService");
const store = require("../../services/localStore");
const { TemplateTypes } = require("../../domain/constants");

Page({
  data: { template: null, error: "", action: "" },

  onLoad(options) {
    const template = templateService.getTravelTemplateSummary(options.id, options.version);
    if (!template) {
      this.setData({ error: "旅行模板不存在" });
      return;
    }
    this.setData({ template, action: options.action || "" });
  },

  openPreview() {
    const { id, version } = this.data.template;
    wx.navigateTo({ url: `/pages/travel-preview/index?id=${id}&version=${version}` });
  },

  useTemplate() {
    const context = store.getCurrentContext();
    const currentInstance = context.space ? store.getTravelInstance(context.space.id) : null;
    if (currentInstance && currentInstance.sourceTemplateId === this.data.template.id) {
      wx.navigateTo({ url: "/pages/travel-plan/index" });
      return;
    }
    store.createSpace({
      templateType: TemplateTypes.TRAVEL_TEAM,
      name: this.data.template.title.replace("计划", "小队")
    });
    wx.showToast({ title: "旅行计划已创建", icon: "success" });
    wx.switchTab({ url: "/pages/plans/index" });
  }
});

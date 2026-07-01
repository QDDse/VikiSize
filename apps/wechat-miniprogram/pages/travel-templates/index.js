const templateService = require("../../services/travelTemplateService");
const store = require("../../services/localStore");

Page({
  data: { templates: [], loading: true, error: "" },

  onShow() {
    this.loadTemplates();
  },

  loadTemplates() {
    try {
      const context = store.getCurrentContext();
      const instance = context.space ? store.getTravelInstance(context.space.id) : null;
      const templates = templateService.listTravelTemplates().map((template) => Object.assign({}, template, {
        tags: template.destinationLabels.concat(template.audienceLabels).slice(0, 3),
        instanceState: instance && (instance.sourceTemplateId === template.id || instance.sourceVersion === template.version)
          ? "current_space"
          : "none"
      }));
      this.setData({ templates, loading: false, error: "" });
    } catch (error) {
      this.setData({ templates: [], loading: false, error: "旅行模板加载失败" });
    }
  },

  openDetail(event) {
    const { id, version } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/travel-template-detail/index?id=${id}&version=${version}` });
  },

  openPreview(event) {
    const { id, version } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/travel-preview/index?id=${id}&version=${version}` });
  },

  useTemplate(event) {
    const { id, version, state } = event.currentTarget.dataset;
    if (state === "current_space") {
      wx.navigateTo({ url: "/pages/travel-plan/index" });
      return;
    }
    wx.navigateTo({ url: `/pages/travel-template-detail/index?id=${id}&version=${version}&action=use` });
  }
});

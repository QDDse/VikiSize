const templateService = require("../../services/travelTemplateService");

Page({
  data: { templateId: "", version: "", previewUrl: "", failed: false },

  onLoad(options) {
    const previewUrl = templateService.getSafePreviewUrl(options.id, options.version);
    this.setData({ templateId: options.id || "", version: options.version || "", previewUrl, failed: !previewUrl });
  },

  onError() {
    this.setData({ failed: true });
  },

  retry() {
    const previewUrl = templateService.getSafePreviewUrl(this.data.templateId, this.data.version);
    this.setData({ previewUrl: "", failed: false });
    setTimeout(() => this.setData({ previewUrl, failed: !previewUrl }), 50);
  },

  useTemplate() {
    wx.redirectTo({ url: `/pages/travel-template-detail/index?id=${this.data.templateId}&version=${this.data.version}&action=use` });
  },

  onMessage(event) {
    const messages = event.detail && event.detail.data || [];
    const message = messages[messages.length - 1];
    if (message && message.type === "use-template" && message.templateId === this.data.templateId) this.useTemplate();
  }
});

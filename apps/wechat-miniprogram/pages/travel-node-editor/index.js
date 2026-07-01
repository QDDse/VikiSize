const store = require("../../services/localStore");
const emptyForm = { type: "place", period: "", startTime: "", endTime: "", title: "", locationName: "", address: "", photoUrl: "", ticketPrice: "", estimatedCost: "", notes: "", needsBooking: false, transport: { mode: "", fare: "", duration: "" }, sensitiveFields: { confirmationCode: "", internalBudgetNote: "", documentAttachmentIds: [] } };

Page({
  data: { instanceId: "", dayId: "", nodeId: "", spaceId: "", form: emptyForm, attachments: [], dirty: false },
  onLoad(query) {
    const context = store.getCurrentContext();
    const instance = store.getTravelInstance(context.space.id);
    const day = instance && instance.days.find((item) => item.id === query.dayId);
    const node = query.nodeId && day ? day.nodes.find((item) => item.id === query.nodeId) : null;
    this.setData({ instanceId: query.instanceId, dayId: query.dayId, nodeId: query.nodeId || "", spaceId: context.space.id, form: node || emptyForm, attachments: node ? store.listAttachmentsForScope(context.space.id, node.id) : [] });
  },
  markDirty() { if (!this.data.dirty && wx.enableAlertBeforeUnload) wx.enableAlertBeforeUnload({ message: "行程尚未保存，确定离开吗？" }); },
  change(event) { this.markDirty(); this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value, dirty: true }); },
  changeTransport(event) { this.markDirty(); this.setData({ [`form.transport.${event.currentTarget.dataset.field}`]: event.detail.value, dirty: true }); },
  toggleBooking(event) { this.markDirty(); this.setData({ "form.needsBooking": event.detail.value, dirty: true }); },
  save() {
    try {
      if (!this.data.form.title) throw new Error("请输入行程名称");
      const form = Object.assign({}, this.data.form, { estimatedCost: Number(this.data.form.estimatedCost || 0) });
      if (this.data.nodeId) store.updateTravelNode(this.data.instanceId, this.data.dayId, this.data.nodeId, form);
      else store.createTravelNode(this.data.instanceId, this.data.dayId, form);
      this.setData({ dirty: false }); if (wx.disableAlertBeforeUnload) wx.disableAlertBeforeUnload(); wx.navigateBack();
    } catch (error) { wx.showToast({ title: error.message, icon: "none" }); }
  },
  chooseImage() {
    if (!this.data.nodeId) { wx.showToast({ title: "请先保存行程再添加图片", icon: "none" }); return; }
    wx.chooseMedia({ count: Math.max(0, 9 - this.data.attachments.length), mediaType: ["image"], success: async ({ tempFiles }) => {
      for (const file of tempFiles) {
        const extension = (file.tempFilePath.split(".").pop() || "jpg").toLowerCase(); const mimeType = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg"; let cloudFileId = file.tempFilePath;
        if (wx.cloud && wx.cloud.uploadFile) { const path = `spaces/${this.data.spaceId}/travel/${this.data.nodeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`; const uploaded = await wx.cloud.uploadFile({ cloudPath: path, filePath: file.tempFilePath }); cloudFileId = uploaded.fileID; }
        store.createAttachmentRecord({ spaceId: this.data.spaceId, scopeType: "travel_node", scopeId: this.data.nodeId, category: "image", cloudFileId, mimeType, sizeBytes: file.size || 0 });
      }
      this.setData({ attachments: store.listAttachmentsForScope(this.data.spaceId, this.data.nodeId) });
    } });
  },
  previewImage(event) { wx.previewImage({ current: event.currentTarget.dataset.url, urls: this.data.attachments.map((item) => item.cloudFileId) }); },
  deleteImage(event) { store.deleteAttachment(event.currentTarget.dataset.id); this.setData({ attachments: store.listAttachmentsForScope(this.data.spaceId, this.data.nodeId) }); },
  createTask() { const result = store.createTravelTaskFromNode(this.data.instanceId, this.data.dayId, this.data.nodeId, this.data.form.needsBooking ? "tickets" : "confirmations"); wx.showToast({ title: result.created ? "任务已创建" : "任务已存在", icon: "none" }); },
  remove() { wx.showModal({ title: "删除行程", content: "删除后不可恢复。", success: ({ confirm }) => { if (confirm) { store.deleteTravelNode(this.data.instanceId, this.data.dayId, this.data.nodeId); if (wx.disableAlertBeforeUnload) wx.disableAlertBeforeUnload(); wx.navigateBack(); } } }); }
});

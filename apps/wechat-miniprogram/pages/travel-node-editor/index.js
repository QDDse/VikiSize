const store = require("../../services/localStore");

const EMPTY_FORM = {
  type: "place", period: "", startTime: "", endTime: "", title: "", locationName: "", address: "",
  coordinate: null, photoUrl: "", ticketPrice: "", estimatedCost: "", notes: "", needsBooking: false,
  transport: { mode: "", fare: "", duration: "" },
  sensitiveFields: { confirmationCode: "", internalBudgetNote: "", documentAttachmentIds: [] }
};
const TYPE_OPTIONS = [
  { value: "place", label: "景点" }, { value: "meal", label: "餐饮" }, { value: "activity", label: "活动" },
  { value: "transport", label: "交通" }, { value: "hotel", label: "住宿" }, { value: "note", label: "备注" }
];
const TRANSPORT_OPTIONS = ["步行", "地铁", "公交", "出租车", "自驾", "铁路", "飞机", "轮船"];

function clone(value) { return JSON.parse(JSON.stringify(value)); }

Page({
  data: {
    instanceId: "", dayId: "", nodeId: "", spaceId: "", form: clone(EMPTY_FORM), attachments: [], dirty: false, uploading: false,
    typeOptions: TYPE_OPTIONS, transportOptions: TRANSPORT_OPTIONS, advancedOpen: false
  },
  onLoad(query) {
    const context = store.getCurrentContext();
    if (!context.space) { wx.redirectTo({ url: "/pages/spaces/index" }); return; }
    const instance = store.getTravelInstance(context.space.id);
    const day = instance && instance.days.find((item) => item.id === query.dayId);
    const node = query.nodeId && day ? day.nodes.find((item) => item.id === query.nodeId) : null;
    const form = node ? clone(node) : clone(EMPTY_FORM);
    form.transport = Object.assign({}, EMPTY_FORM.transport, form.transport || {});
    form.sensitiveFields = Object.assign({}, EMPTY_FORM.sensitiveFields, form.sensitiveFields || {});
    this.setData({
      instanceId: query.instanceId, dayId: query.dayId, nodeId: query.nodeId || "", spaceId: context.space.id,
      form, attachments: node ? store.listAttachmentsForScope(context.space.id, node.id) : [],
      advancedOpen: Boolean(node && ((node.attachmentIds || []).length || node.sensitiveFields && node.sensitiveFields.confirmationCode))
    });
  },
  markDirty() {
    if (!this.data.dirty && wx.enableAlertBeforeUnload) wx.enableAlertBeforeUnload({ message: "行程尚未保存，确定离开吗？" });
  },
  updateField(path, value) {
    this.markDirty();
    this.setData({ [path]: value, dirty: true });
  },
  change(event) { this.updateField("form." + event.currentTarget.dataset.field, event.detail.value); },
  changeTransport(event) { this.updateField("form.transport." + event.currentTarget.dataset.field, event.detail.value); },
  changeTime(event) { this.updateField("form." + event.currentTarget.dataset.field, event.detail.value); },
  selectType(event) { this.updateField("form.type", event.currentTarget.dataset.value); },
  chooseTransport(event) { this.updateField("form.transport.mode", TRANSPORT_OPTIONS[Number(event.detail.value)]); },
  toggleBooking(event) { this.updateField("form.needsBooking", event.detail.value); },
  toggleAdvanced() { this.setData({ advancedOpen: !this.data.advancedOpen }); },
  chooseLocation() {
    if (!wx.chooseLocation) { wx.showToast({ title: "当前微信版本不支持地图选点", icon: "none" }); return; }
    wx.chooseLocation({
      success: ({ name, address, latitude, longitude }) => {
        this.markDirty();
        this.setData({
          "form.locationName": name, "form.address": address,
          "form.coordinate": { latitude, longitude, system: "gcj02" }, dirty: true
        });
      },
      fail: ({ errMsg }) => {
        if (!String(errMsg).includes("cancel")) wx.showToast({ title: "暂时无法打开地图选点", icon: "none" });
      }
    });
  },
  save() {
    try {
      if (!this.data.form.title.trim()) throw new Error("请输入行程名称");
      if (this.data.form.endTime && this.data.form.startTime && this.data.form.endTime < this.data.form.startTime) throw new Error("结束时间不能早于开始时间");
      const form = Object.assign({}, this.data.form, {
        title: this.data.form.title.trim(),
        estimatedCost: Number(this.data.form.estimatedCost || 0)
      });
      if (this.data.nodeId) store.updateTravelNode(this.data.instanceId, this.data.dayId, this.data.nodeId, form);
      else store.createTravelNode(this.data.instanceId, this.data.dayId, form);
      this.setData({ dirty: false });
      if (wx.disableAlertBeforeUnload) wx.disableAlertBeforeUnload();
      wx.navigateBack();
    } catch (error) { wx.showToast({ title: error.message, icon: "none" }); }
  },
  chooseImage() {
    if (!this.data.nodeId) { wx.showToast({ title: "请先保存行程再添加图片", icon: "none" }); return; }
    if (this.data.uploading) return;
    const remaining = Math.max(0, 9 - this.data.attachments.length);
    if (!remaining) { wx.showToast({ title: "每条行程最多添加 9 张图片", icon: "none" }); return; }
    this.setData({ uploading: true });
    wx.chooseMedia({
      count: remaining, mediaType: ["image"],
      success: async ({ tempFiles }) => {
        try {
          for (const file of tempFiles) {
            const extension = (file.tempFilePath.split(".").pop() || "jpg").toLowerCase();
            const mimeType = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
            let cloudFileId = file.tempFilePath;
            if (wx.cloud && wx.cloud.uploadFile) {
              const path = "spaces/" + this.data.spaceId + "/travel/" + this.data.nodeId + "/" + Date.now() + "-" + Math.random().toString(36).slice(2) + "." + extension;
              const uploaded = await wx.cloud.uploadFile({ cloudPath: path, filePath: file.tempFilePath });
              cloudFileId = uploaded.fileID;
            }
            store.createAttachmentRecord({ spaceId: this.data.spaceId, scopeType: "travel_node", scopeId: this.data.nodeId, category: "image", cloudFileId, mimeType, sizeBytes: file.size || 0 });
          }
          this.setData({ attachments: store.listAttachmentsForScope(this.data.spaceId, this.data.nodeId) });
        } catch (error) { wx.showToast({ title: "图片上传失败，请重试", icon: "none" }); }
        finally { this.setData({ uploading: false }); }
      },
      fail: () => this.setData({ uploading: false })
    });
  },
  previewImage(event) { wx.previewImage({ current: event.currentTarget.dataset.url, urls: this.data.attachments.map((item) => item.cloudFileId) }); },
  deleteImage(event) {
    store.deleteAttachment(event.currentTarget.dataset.id);
    this.setData({ attachments: store.listAttachmentsForScope(this.data.spaceId, this.data.nodeId) });
  },
  createTask() {
    const result = store.createTravelTaskFromNode(this.data.instanceId, this.data.dayId, this.data.nodeId, this.data.form.needsBooking ? "tickets" : "confirmations");
    wx.showToast({ title: result.created ? "任务已创建" : "任务已存在", icon: "none" });
  },
  remove() {
    wx.showModal({
      title: "删除这条行程", content: "删除后无法恢复，关联任务会保留来源失效标记。", confirmColor: "#b42318",
      success: ({ confirm }) => {
        if (!confirm) return;
        store.deleteTravelNode(this.data.instanceId, this.data.dayId, this.data.nodeId);
        if (wx.disableAlertBeforeUnload) wx.disableAlertBeforeUnload();
        wx.navigateBack();
      }
    });
  }
});

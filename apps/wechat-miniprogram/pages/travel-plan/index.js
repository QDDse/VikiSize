const store = require("../../services/localStore");
const { buildMapViewModel, toMiniProgramCoordinate } = require("../../services/mapAdapter");
const companion = require("../../services/travelCompanion");
const { safeRefresh } = require("../../utils/pageGuard");

Page({
  data: {
    context: {}, instance: null, selectedDayId: "", selectedDay: null,
    tab: "itinerary", viewMode: "timeline", mapView: { markers: [], polyline: [] },
    activeNodeId: "", activeNode: null, timelineNodes: [], today: "", overview: {},
    receiptCategories: companion.receiptCategories, ledger: {}, receiptDate: "",
    receiptForm: null, receiptError: "", savingReceipt: false,
    phraseCategories: companion.phraseCategories, phraseCategory: "transport",
    phrases: companion.phraseCategories[0].phrases, delayMinutes: 0, delayRows: [], loadError: ""
  },

  onLoad(options) {
    if (["itinerary", "receipts", "phrases"].includes(options.tab)) this.setData({ tab: options.tab });
    if (options.dayId) this.setData({ selectedDayId: options.dayId });
  },

  onShow() { safeRefresh(this, () => this.refresh()); },
  onHide() { this.clearTransient(); },
  onUnload() { this.clearTransient(); },

  clearTransient() {
    this.setData({ delayMinutes: 0, delayRows: [], activeNodeId: "", activeNode: null, receiptForm: null, receiptError: "" });
  },

  refresh() {
    const context = store.getCurrentContext();
    const instance = context.space ? store.getTravelInstance(context.space.id) : null;
    const today = companion.dateInZone(new Date(), instance && instance.timezone);
    const changedTrip = this.data.instance && (!instance || this.data.instance.id !== instance.id);
    if (changedTrip) this.clearTransient();
    const days = instance && instance.days || [];
    const selectedDay = (!changedTrip && days.find((day) => day.id === this.data.selectedDayId)) || days.find((day) => day.date === today) || days[0] || null;
    const receiptDate = changedTrip ? selectedDay && selectedDay.date || today : this.data.receiptDate || selectedDay && selectedDay.date || today;
    this.setData({ context, instance, today, receiptDate });
    this.showDay(selectedDay);
  },

  showDay(selectedDay) {
    this.setData({
      selectedDay, selectedDayId: selectedDay ? selectedDay.id : "",
      timelineNodes: (selectedDay && selectedDay.nodes || []).map(companion.nodeDetails),
      mapView: buildMapViewModel(selectedDay), activeNodeId: "", activeNode: null,
      overview: companion.dayOverview(selectedDay, this.data.today, new Date(), this.data.instance && this.data.instance.timezone),
      ledger: companion.summarizeReceipts(this.data.instance && this.data.instance.receipts, this.data.receiptDate)
    });
  },

  selectDay(event) {
    const day = this.data.instance && this.data.instance.days.find((item) => item.id === event.currentTarget.dataset.id);
    if (!day) return;
    this.clearTransient();
    this.setData({ receiptDate: day.date });
    this.showDay(day);
  },

  selectToday() {
    const day = this.data.instance && this.data.instance.days.find((item) => item.date === this.data.today);
    if (!day) { wx.showToast({ title: "今天没有安排旅行行程", icon: "none" }); return; }
    this.selectDay({ currentTarget: { dataset: { id: day.id } } });
  },

  setTab(event) {
    const tab = event.currentTarget.dataset.tab;
    if (!["itinerary", "receipts", "phrases"].includes(tab)) return;
    this.clearTransient();
    this.setData({ tab });
  },
  switchView(event) { this.setData({ viewMode: event.currentTarget.dataset.mode }); },
  activateNode(event) {
    const activeNodeId = event.currentTarget.dataset.id;
    const node = this.data.selectedDay && this.data.selectedDay.nodes.find((item) => item.id === activeNodeId);
    if (node) this.setData({ activeNodeId, activeNode: companion.nodeDetails(node), mapView: buildMapViewModel(this.data.selectedDay, activeNodeId) });
  },
  closeDetails() { this.setData({ activeNodeId: "", activeNode: null }); },
  stopPropagation() {},
  markerTap(event) {
    const marker = this.data.mapView.markers.find((item) => item.id === event.detail.markerId);
    if (marker) this.activateNode({ currentTarget: { dataset: { id: marker.nodeId } } });
  },
  openLocation(event) {
    const node = this.data.selectedDay && this.data.selectedDay.nodes.find((item) => item.id === event.currentTarget.dataset.id);
    if (!node) return;
    const coordinate = toMiniProgramCoordinate(node.coordinate);
    if (!coordinate) { wx.showToast({ title: "请先补充地点坐标", icon: "none" }); return; }
    wx.openLocation({ latitude: coordinate.latitude, longitude: coordinate.longitude, name: node.title, address: node.address || node.locationName || "", fail: () => wx.setClipboardData({ data: node.address || node.locationName || node.title }) });
  },
  canEdit() {
    if (!this.data.context.canWrite) { wx.showToast({ title: "访客只能查看", icon: "none" }); return false; }
    return Boolean(this.data.instance);
  },
  openDayEditor(event) {
    if (!this.canEdit()) return;
    wx.navigateTo({ url: `/pages/travel-day-editor/index?instanceId=${this.data.instance.id}&dayId=${event.currentTarget.dataset.id || ""}` });
  },
  openNodeEditor(event) {
    if (!this.canEdit() || !this.data.selectedDay) return;
    wx.navigateTo({ url: `/pages/travel-node-editor/index?instanceId=${this.data.instance.id}&dayId=${this.data.selectedDay.id}&nodeId=${event.currentTarget.dataset.id || ""}` });
  },
  openCandidates() {
    if (this.data.instance) wx.navigateTo({ url: `/pages/travel-candidates/index?instanceId=${this.data.instance.id}` });
  },
  moveNode(event) {
    if (!this.canEdit() || !this.data.selectedDay) return;
    const { id, direction } = event.currentTarget.dataset;
    const ids = this.data.selectedDay.nodes.map((item) => item.id);
    const index = ids.indexOf(id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try { store.reorderTravelNodes(this.data.instance.id, this.data.selectedDay.id, ids); this.refresh(); }
    catch (error) { wx.showToast({ title: error.message, icon: "none" }); }
  },
  changeReceiptDate(event) {
    this.setData({ receiptDate: event.detail.value, ledger: companion.summarizeReceipts(this.data.instance.receipts, event.detail.value) });
  },
  openReceiptForm() {
    if (!this.canEdit()) return;
    this.setData({ receiptForm: { date: this.data.receiptDate, merchant: "", amount: "", category: companion.receiptCategories[0] }, receiptError: "" });
  },
  closeReceiptForm() { this.setData({ receiptForm: null, receiptError: "" }); },
  editReceipt(event) {
    const field = event.currentTarget.dataset.field;
    if (!this.data.receiptForm || !["date", "merchant", "amount"].includes(field)) return;
    this.setData({ receiptForm: Object.assign({}, this.data.receiptForm, { [field]: event.detail.value }), receiptError: "" });
  },
  changeReceiptCategory(event) {
    this.setData({ receiptForm: Object.assign({}, this.data.receiptForm, { category: companion.receiptCategories[Number(event.detail.value)] }) });
  },
  saveReceipt() {
    if (!this.canEdit() || !this.data.receiptForm || this.data.savingReceipt) return;
    this.setData({ savingReceipt: true, receiptError: "" });
    try {
      const receipt = store.addTravelReceipt(this.data.instance.id, this.data.receiptForm);
      this.setData({ receiptDate: receipt.date, receiptForm: null });
      this.refresh();
      wx.showToast({ title: "小票已保存", icon: "success" });
    } catch (error) { this.setData({ receiptError: error.message || "保存失败，请重试" }); }
    finally { this.setData({ savingReceipt: false }); }
  },
  deleteReceipt(event) {
    if (!this.canEdit()) return;
    const instanceId = this.data.instance.id;
    const receipt = (this.data.instance.receipts || []).find((item) => item.id === event.currentTarget.dataset.id);
    if (!receipt) return;
    wx.showModal({ title: "删除这张小票？", content: `${receipt.date} · ${receipt.merchant} · ¥${receipt.amount} JPY，删除后无法恢复。`, confirmText: "删除", confirmColor: "#b64e36", success: ({ confirm }) => {
      if (!confirm) return;
      try { store.deleteTravelReceipt(instanceId, receipt.id); this.refresh(); }
      catch (error) { wx.showToast({ title: error.message, icon: "none" }); }
    } });
  },
  selectPhraseCategory(event) {
    const category = companion.phraseCategories.find((item) => item.id === event.currentTarget.dataset.id);
    if (category) this.setData({ phraseCategory: category.id, phrases: category.phrases });
  },
  copyPhrase(event) {
    const phrase = this.data.phrases.find((item) => item.id === event.currentTarget.dataset.id);
    if (phrase) wx.setClipboardData({ data: phrase.japanese, fail: () => wx.showToast({ title: "复制失败，请重试", icon: "none" }) });
  },
  previewDelay(event) {
    const delayMinutes = Number(event.currentTarget.dataset.minutes);
    this.setData({ delayMinutes, delayRows: companion.delayPreview(this.data.selectedDay, delayMinutes) });
  },
  closeDelay() { this.setData({ delayMinutes: 0, delayRows: [] }); }
});

const store = require("../../services/localStore");
const { buildMapViewModel, toMiniProgramCoordinate } = require("../../services/mapAdapter");

Page({
  data: {
    context: {},
    instance: null,
    selectedDayId: "",
    selectedDay: null,
    viewMode: "timeline",
    mapView: { markers: [], polyline: [] },
    activeNodeId: ""
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const context = store.getCurrentContext();
    const instance = context.space ? store.getTravelInstance(context.space.id) : null;
    const selectedDayId = this.data.selectedDayId || (instance && instance.days[0] ? instance.days[0].id : "");
    const selectedDay = instance ? instance.days.find((day) => day.id === selectedDayId) : null;
    this.setData({ context, instance, selectedDayId, selectedDay, mapView: buildMapViewModel(selectedDay, this.data.activeNodeId) });
  },

  selectDay(event) {
    const selectedDayId = event.currentTarget.dataset.id;
    const selectedDay = this.data.instance.days.find((day) => day.id === selectedDayId);
    this.setData({ selectedDayId, selectedDay, activeNodeId: "", mapView: buildMapViewModel(selectedDay) });
  },

  switchView(event) { this.setData({ viewMode: event.currentTarget.dataset.mode }); },

  activateNode(event) {
    const activeNodeId = event.currentTarget.dataset.id;
    this.setData({ activeNodeId, mapView: buildMapViewModel(this.data.selectedDay, activeNodeId) });
  },

  markerTap(event) {
    const marker = this.data.mapView.markers.find((item) => item.id === event.detail.markerId);
    if (marker) this.setData({ activeNodeId: marker.nodeId, viewMode: "timeline", mapView: buildMapViewModel(this.data.selectedDay, marker.nodeId) });
  },

  openLocation(event) {
    const node = this.data.selectedDay.nodes.find((item) => item.id === event.currentTarget.dataset.id);
    const coordinate = node && toMiniProgramCoordinate(node.coordinate);
    if (!coordinate) { wx.showToast({ title: "请先补充地点坐标", icon: "none" }); return; }
    wx.openLocation({ latitude: coordinate.latitude, longitude: coordinate.longitude, name: node.title, address: node.address || node.locationName || "", fail: () => { if (node.address || node.locationName) wx.setClipboardData({ data: node.address || node.locationName }); } });
  },

  openDayEditor(event) {
    const dayId = event.currentTarget.dataset.id || "";
    wx.navigateTo({ url: `/pages/travel-day-editor/index?instanceId=${this.data.instance.id}&dayId=${dayId}` });
  },

  openNodeEditor(event) {
    if (!this.data.context.canWrite) {
      wx.showToast({ title: "访客只能查看", icon: "none" });
      return;
    }
    const nodeId = event.currentTarget.dataset.id || "";
    wx.navigateTo({ url: `/pages/travel-node-editor/index?instanceId=${this.data.instance.id}&dayId=${this.data.selectedDay.id}&nodeId=${nodeId}` });
  },

  openCandidates() {
    wx.navigateTo({ url: `/pages/travel-candidates/index?instanceId=${this.data.instance.id}` });
  },

  moveNode(event) {
    if (!this.data.context.canWrite) return;
    const { id, direction } = event.currentTarget.dataset;
    const ids = this.data.selectedDay.nodes.map((item) => item.id);
    const index = ids.indexOf(id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    store.reorderTravelNodes(this.data.instance.id, this.data.selectedDay.id, ids);
    this.refresh();
  }
});

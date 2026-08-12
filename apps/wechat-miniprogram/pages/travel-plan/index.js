const store = require("../../services/localStore");
const { buildMapViewModel, toMiniProgramCoordinate } = require("../../services/mapAdapter");
const { optimizeRoute } = require("../../services/routeOptimizer");

function shortDate(value) {
  const parts = String(value || "").split("-");
  return parts.length === 3 ? `${Number(parts[1])}/${Number(parts[2])}` : value;
}

function buildDayTabs(instance) {
  return (instance && instance.days || []).map((day, index) => ({
    id: day.id,
    dayNumber: index + 1,
    shortDate: shortDate(day.date),
    nodeCount: (day.nodes || []).length
  }));
}

function buildTripStats(instance) {
  const nodes = (instance && instance.days || []).reduce((all, day) => all.concat(day.nodes || []), []);
  return {
    placeCount: nodes.length,
    bookingCount: nodes.filter((node) => node.needsBooking).length,
    estimatedCost: nodes.reduce((total, node) => total + Number(node.estimatedCost || 0), 0)
  };
}

function buildDayStats(day) {
  const nodes = day && day.nodes || [];
  return {
    nodeCount: nodes.length,
    timedCount: nodes.filter((node) => node.startTime || node.time).length,
    estimatedCost: nodes.reduce((total, node) => total + Number(node.estimatedCost || 0), 0)
  };
}

function buildTimelineNodes(day) {
  const nodes = day && day.nodes || [];
  return nodes.map((node, index) => Object.assign({}, node, {
    order: index + 1,
    displayTime: node.startTime || node.time || "待定",
    isLast: index === nodes.length - 1,
    transportMode: node.transport && node.transport.mode || node.route || "",
    transportDuration: node.transport && node.transport.duration || ""
  }));
}

Page({
  data: {
    context: {},
    instance: null,
    selectedDayId: "",
    selectedDay: null,
    viewMode: "timeline",
    mapView: { markers: [], polyline: [] },
    activeNodeId: "",
    activeNode: null,
    dayTabs: [],
    timelineNodes: [],
    dayStats: {},
    tripStats: {},
    roleLabel: "",
    unscheduledCount: 0
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const context = store.getCurrentContext();
    const instance = context.space ? store.getTravelInstance(context.space.id) : null;
    if (!instance) {
      wx.showToast({ title: "当前空间没有旅行计划", icon: "none" });
      wx.navigateBack();
      return;
    }
    const hasSelectedDay = instance.days.some((day) => day.id === this.data.selectedDayId);
    const selectedDayId = hasSelectedDay ? this.data.selectedDayId : (instance.days[0] ? instance.days[0].id : "");
    this.updateView({ context, instance, selectedDayId, activeNodeId: this.data.activeNodeId });
  },

  updateView({ context, instance, selectedDayId, activeNodeId }) {
    const selectedDay = instance.days.find((day) => day.id === selectedDayId) || null;
    const activeNode = selectedDay && selectedDay.nodes.find((node) => node.id === activeNodeId) || null;
    const memberRole = context.member && context.member.role;
    this.setData({
      context,
      instance,
      selectedDayId,
      selectedDay,
      activeNodeId: activeNode ? activeNodeId : "",
      activeNode,
      mapView: buildMapViewModel(selectedDay, activeNodeId),
      dayTabs: buildDayTabs(instance),
      timelineNodes: buildTimelineNodes(selectedDay),
      dayStats: buildDayStats(selectedDay),
      tripStats: buildTripStats(instance),
      roleLabel: memberRole === "owner" ? "管理员" : memberRole === "member" ? "成员" : "访客",
      unscheduledCount: (instance.candidatePlaces || []).filter((candidate) => !candidate.scheduledNodeId).length
    });
  },

  selectDay(event) {
    this.updateView({
      context: this.data.context,
      instance: this.data.instance,
      selectedDayId: event.currentTarget.dataset.id,
      activeNodeId: ""
    });
  },

  switchView(event) {
    this.setData({ viewMode: event.currentTarget.dataset.mode });
  },

  activateNode(event) {
    const activeNodeId = event.currentTarget.dataset.id;
    const activeNode = this.data.selectedDay.nodes.find((node) => node.id === activeNodeId) || null;
    this.setData({ activeNodeId, activeNode, mapView: buildMapViewModel(this.data.selectedDay, activeNodeId) });
  },

  markerTap(event) {
    const marker = this.data.mapView.markers.find((item) => item.id === event.detail.markerId);
    if (!marker) return;
    const activeNode = this.data.selectedDay.nodes.find((node) => node.id === marker.nodeId) || null;
    this.setData({ activeNodeId: marker.nodeId, activeNode });
  },

  openLocationById(nodeId) {
    const node = this.data.selectedDay.nodes.find((item) => item.id === nodeId);
    const coordinate = node && toMiniProgramCoordinate(node.coordinate);
    if (!coordinate) {
      wx.showToast({ title: "请先为这个地点补充坐标", icon: "none" });
      return;
    }
    wx.openLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      name: node.title,
      address: node.address || node.locationName || "",
      fail: () => {
        if (node.address || node.locationName) wx.setClipboardData({ data: node.address || node.locationName });
      }
    });
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
    const nodeId = event && event.currentTarget.dataset.id || "";
    wx.navigateTo({ url: `/pages/travel-node-editor/index?instanceId=${this.data.instance.id}&dayId=${this.data.selectedDay.id}&nodeId=${nodeId}` });
  },

  openCandidates() {
    wx.navigateTo({ url: `/pages/travel-candidates/index?instanceId=${this.data.instance.id}` });
  },

  optimizeDayRoute() {
    const result = optimizeRoute(this.data.selectedDay.nodes);
    if (this.data.selectedDay.nodes.length < 3) {
      wx.showToast({ title: "至少添加 3 个地点才能整理路线", icon: "none" });
      return;
    }
    if (result.missingCoordinateCount) {
      wx.showToast({ title: `还有 ${result.missingCoordinateCount} 个地点未选坐标`, icon: "none" });
      return;
    }
    if (!result.changed) {
      wx.showToast({ title: "当前路线已经比较顺", icon: "none" });
      return;
    }
    const savedKm = Math.max(0, result.beforeKm - result.afterKm).toFixed(1);
    wx.showModal({
      title: "按距离整理当天路线",
      content: `以第一站为起点，按地点间直线距离重排，预计少走约 ${savedKm} 公里。交通时刻和预约顺序仍需你确认。`,
      confirmText: "应用排序",
      success: ({ confirm }) => {
        if (!confirm) return;
        store.reorderTravelNodes(this.data.instance.id, this.data.selectedDay.id, result.orderedIds);
        this.refresh();
        wx.showToast({ title: "路线已整理", icon: "success" });
      }
    });
  },

  openNodeActions(event) {
    const nodeId = event.currentTarget.dataset.id;
    const node = this.data.selectedDay.nodes.find((item) => item.id === nodeId);
    if (!node) return;
    const actions = this.data.context.canWrite
      ? ["编辑行程", "在地图中打开", "复制到当天", "上移一位", "下移一位", "删除行程"]
      : ["在地图中打开"];
    wx.showActionSheet({
      itemList: actions,
      success: ({ tapIndex }) => {
        const action = actions[tapIndex];
        if (action === "编辑行程") this.openNodeEditor({ currentTarget: { dataset: { id: nodeId } } });
        if (action === "在地图中打开") this.openLocationById(nodeId);
        if (action === "复制到当天") {
          store.duplicateTravelNode(this.data.instance.id, this.data.selectedDay.id, nodeId);
          this.refresh();
        }
        if (action === "上移一位") this.moveNodeById(nodeId, "up");
        if (action === "下移一位") this.moveNodeById(nodeId, "down");
        if (action === "删除行程") this.confirmDeleteNode(node);
      }
    });
  },

  moveNodeById(id, direction) {
    const ids = this.data.selectedDay.nodes.map((item) => item.id);
    const index = ids.indexOf(id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= ids.length) {
      wx.showToast({ title: direction === "up" ? "已经是第一站" : "已经是最后一站", icon: "none" });
      return;
    }
    [ids[index], ids[target]] = [ids[target], ids[index]];
    store.reorderTravelNodes(this.data.instance.id, this.data.selectedDay.id, ids);
    this.refresh();
  },

  confirmDeleteNode(node) {
    wx.showModal({
      title: `删除「${node.title}」`,
      content: "删除后无法恢复，已关联的任务会保留来源失效标记。",
      confirmColor: "#b42318",
      success: ({ confirm }) => {
        if (!confirm) return;
        store.deleteTravelNode(this.data.instance.id, this.data.selectedDay.id, node.id);
        this.refresh();
      }
    });
  }
});

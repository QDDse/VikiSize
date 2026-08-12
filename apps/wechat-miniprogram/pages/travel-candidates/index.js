const store = require("../../services/localStore");

const CATEGORY_OPTIONS = [
  { value: "place", label: "景点" },
  { value: "meal", label: "餐厅" },
  { value: "hotel", label: "住宿" },
  { value: "activity", label: "购物" }
];
const CATEGORY_LABELS = CATEGORY_OPTIONS.reduce((labels, item) => Object.assign(labels, { [item.value]: item.label }), {});

Page({
  data: {
    instance: null, title: "", locationName: "", address: "", coordinate: null, category: "place",
    categoryOptions: CATEGORY_OPTIONS, canWrite: false, formOpen: false, filter: "unscheduled",
    selecting: false, selectedIds: [], visibleCandidates: [], counts: { unscheduled: 0, scheduled: 0 }
  },
  onLoad(query) { this.instanceId = query.instanceId; },
  onShow() { this.refresh(); },
  refresh() {
    const context = store.getCurrentContext();
    if (!context.space) { wx.redirectTo({ url: "/pages/spaces/index" }); return; }
    const instance = store.getTravelInstance(context.space.id);
    const selectedIds = this.data.selectedIds.filter((id) => instance.candidatePlaces.some((item) => item.id === id && !item.scheduledNodeId));
    this.setData({ instance, canWrite: context.canWrite, selectedIds });
    this.updateVisibleCandidates(instance, selectedIds);
  },
  updateVisibleCandidates(instance, selectedIds, filter = this.data.filter) {
    const daysById = new Map(instance.days.map((day, index) => [day.id, "D" + (index + 1) + " " + day.theme]));
    const candidates = instance.candidatePlaces.map((candidate) => Object.assign({}, candidate, {
      selected: selectedIds.includes(candidate.id),
      categoryLabel: CATEGORY_LABELS[candidate.category] || "地点",
      scheduledDayLabel: candidate.scheduledDayId ? daysById.get(candidate.scheduledDayId) || "已安排" : ""
    }));
    const unscheduled = candidates.filter((candidate) => !candidate.scheduledNodeId);
    const scheduled = candidates.filter((candidate) => candidate.scheduledNodeId);
    this.setData({
      visibleCandidates: filter === "scheduled" ? scheduled : unscheduled,
      counts: { unscheduled: unscheduled.length, scheduled: scheduled.length }
    });
  },
  toggleForm() { this.setData({ formOpen: !this.data.formOpen }); },
  change(event) { this.setData({ [event.currentTarget.dataset.field]: event.detail.value }); },
  selectCategory(event) { this.setData({ category: event.currentTarget.dataset.value }); },
  chooseLocation() {
    if (!wx.chooseLocation) { wx.showToast({ title: "当前微信版本不支持地图选点", icon: "none" }); return; }
    wx.chooseLocation({
      success: ({ name, address, latitude, longitude }) => {
        this.setData({
          title: this.data.title || name, locationName: name, address,
          coordinate: { latitude, longitude, system: "gcj02" }
        });
      },
      fail: ({ errMsg }) => {
        if (!String(errMsg).includes("cancel")) wx.showToast({ title: "暂时无法打开地图选点", icon: "none" });
      }
    });
  },
  add() {
    try {
      if (!this.data.title.trim()) throw new Error("请填写地点名称");
      store.upsertTravelCandidate(this.instanceId, {
        title: this.data.title.trim(), locationName: this.data.locationName, address: this.data.address,
        coordinate: this.data.coordinate, category: this.data.category
      });
      this.setData({ title: "", locationName: "", address: "", coordinate: null, category: "place", formOpen: false });
      this.refresh();
      wx.showToast({ title: "已收藏", icon: "success" });
    } catch (error) { wx.showToast({ title: error.message, icon: "none" }); }
  },
  setFilter(event) {
    const filter = event.currentTarget.dataset.filter;
    this.setData({ filter, selecting: false, selectedIds: [] });
    this.updateVisibleCandidates(this.data.instance, [], filter);
  },
  toggleSelecting() {
    const selecting = !this.data.selecting;
    this.setData({ selecting, selectedIds: selecting ? this.data.selectedIds : [] });
    this.updateVisibleCandidates(this.data.instance, selecting ? this.data.selectedIds : []);
  },
  toggleCandidate(event) {
    if (!this.data.selecting) return;
    const id = event.currentTarget.dataset.id;
    const selectedIds = this.data.selectedIds.includes(id) ? this.data.selectedIds.filter((value) => value !== id) : this.data.selectedIds.concat(id);
    this.setData({ selectedIds });
    this.updateVisibleCandidates(this.data.instance, selectedIds);
  },
  chooseDay(callback) {
    const days = this.data.instance.days;
    if (!days.length) { wx.showToast({ title: "请先创建旅行日期", icon: "none" }); return; }
    wx.showActionSheet({
      itemList: days.map((item, index) => "D" + (index + 1) + "　" + item.date + "　" + item.theme),
      success: ({ tapIndex }) => callback(days[tapIndex])
    });
  },
  schedule(event) {
    const candidateId = event.currentTarget.dataset.id;
    this.chooseDay((day) => {
      store.scheduleTravelCandidate(this.instanceId, candidateId, day.id);
      this.refresh();
      wx.showToast({ title: "已安排到 " + day.date, icon: "success" });
    });
  },
  scheduleSelected() {
    const ids = this.data.selectedIds.slice();
    this.chooseDay((day) => {
      try {
        ids.forEach((candidateId) => store.scheduleTravelCandidate(this.instanceId, candidateId, day.id));
        this.setData({ selecting: false, selectedIds: [] });
        this.refresh();
        wx.showToast({ title: "已安排 " + ids.length + " 个地点", icon: "success" });
      } catch (error) {
        this.refresh();
        wx.showToast({ title: error.message, icon: "none" });
      }
    });
  },
  unschedule(event) {
    try {
      store.unscheduleTravelCandidate(this.instanceId, event.currentTarget.dataset.id);
      this.refresh();
      wx.showToast({ title: "已移回地点库", icon: "success" });
    } catch (error) { wx.showToast({ title: error.message, icon: "none" }); }
  }
});

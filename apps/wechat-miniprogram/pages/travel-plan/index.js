const store = require("../../services/localStore");

Page({
  data: {
    context: {},
    instance: null,
    selectedDayId: "",
    selectedDay: null
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const context = store.getCurrentContext();
    const instance = context.space ? store.getTravelInstance(context.space.id) : null;
    const selectedDayId = this.data.selectedDayId || (instance && instance.days[0] ? instance.days[0].id : "");
    const selectedDay = instance ? instance.days.find((day) => day.id === selectedDayId) : null;
    this.setData({ context, instance, selectedDayId, selectedDay });
  },

  selectDay(event) {
    const selectedDayId = event.currentTarget.dataset.id;
    const selectedDay = this.data.instance.days.find((day) => day.id === selectedDayId);
    this.setData({ selectedDayId, selectedDay });
  },

  markNodeChecked(event) {
    if (!this.data.context.canWrite) {
      wx.showToast({ title: "访客只能查看", icon: "none" });
      return;
    }
    const nodeId = event.currentTarget.dataset.id;
    try {
      store.updateTravelNode(this.data.instance.id, this.data.selectedDay.id, nodeId, { notes: "已确认：" + new Date().toLocaleDateString() });
      wx.showToast({ title: "行程已更新", icon: "success" });
      this.refresh();
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" });
    }
  }
});

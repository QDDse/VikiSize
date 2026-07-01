const store = require("../../services/localStore");

Page({
  data: { instanceId: "", dayId: "", form: { date: "", weekday: "", theme: "" } },
  onLoad(query) {
    const context = store.getCurrentContext();
    const instance = store.getTravelInstance(context.space.id);
    const day = query.dayId && instance ? instance.days.find((item) => item.id === query.dayId) : null;
    this.setData({ instanceId: query.instanceId, dayId: query.dayId || "", form: day || this.data.form });
  },
  change(event) { this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value }); },
  save() {
    try {
      if (!this.data.form.date) throw new Error("请选择日期");
      if (this.data.dayId) store.updateTravelDay(this.data.instanceId, this.data.dayId, this.data.form);
      else store.createTravelDay(this.data.instanceId, this.data.form);
      wx.navigateBack();
    } catch (error) { wx.showToast({ title: error.message, icon: "none" }); }
  },
  remove() {
    wx.showModal({ title: "删除日期", content: "仅可删除没有行程节点的日期。", success: ({ confirm }) => {
      if (!confirm) return;
      try { store.deleteTravelDay(this.data.instanceId, this.data.dayId); wx.navigateBack(); }
      catch (error) { wx.showToast({ title: error.message, icon: "none" }); }
    } });
  }
});

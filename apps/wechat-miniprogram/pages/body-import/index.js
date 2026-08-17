const fitnessRepository = require("../../services/fitnessRepository");

function today() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

Page({
  data: {
    reportDate: today(),
    tempFilePath: "",
    weightKg: "",
    bodyFatPct: "",
    submitting: false
  },

  chooseReport() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: ({ tempFiles }) => this.setData({ tempFilePath: tempFiles[0].tempFilePath })
    });
  },

  previewReport() {
    if (this.data.tempFilePath) wx.previewImage({ urls: [this.data.tempFilePath] });
  },

  onDateChange(event) { this.setData({ reportDate: event.detail.value }); },
  onWeightInput(event) { this.setData({ weightKg: event.detail.value }); },
  onBodyFatInput(event) { this.setData({ bodyFatPct: event.detail.value }); },

  submit() {
    const weightKg = Number(this.data.weightKg);
    const bodyFatPct = Number(this.data.bodyFatPct);
    if (!this.data.tempFilePath || !weightKg || !bodyFatPct) {
      wx.showToast({ title: "请补全报告图、体重和体脂率", icon: "none" });
      return;
    }
    wx.showModal({
      title: "确认导入体测数据",
      content: `${this.data.reportDate}\n体重 ${weightKg} kg\n体脂率 ${bodyFatPct}%\n\n数据来自体脂秤微信小程序报告图，由你人工核对。`,
      confirmText: "确认导入",
      success: (result) => { if (result.confirm) this.persist(weightKg, bodyFatPct); }
    });
  },

  async persist(weightKg, bodyFatPct) {
    this.setData({ submitting: true });
    try {
      const measurementId = `body-${this.data.reportDate.replace(/-/g, "")}-${Date.now().toString(36)}`;
      await fitnessRepository.importBodyMeasurement({
        measurementId,
        measuredAt: `${this.data.reportDate}T12:00:00+08:00`,
        tempFilePath: this.data.tempFilePath,
        metrics: { weightKg, bodyFatPct }
      });
      wx.showToast({ title: "已导入", icon: "success" });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (error) {
      wx.showToast({ title: error.message || "导入失败", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  }
});

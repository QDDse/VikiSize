// 读路径守卫：本地状态读取可能抛错（例如数据迁移失败、版本无法识别）。
// 页面刷新必须捕获并给出可见反馈，而不是让 onShow 抛错导致白屏。
function safeRefresh(page, refresh) {
  try {
    refresh();
    if (page.data.loadError) {
      page.setData({ loadError: "" });
    }
  } catch (error) {
    const message = (error && error.message) || "数据加载失败";
    page.setData({ loadError: message });
    wx.showToast({ title: message, icon: "none" });
  }
}

module.exports = { safeRefresh };

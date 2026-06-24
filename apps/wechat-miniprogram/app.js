App({
  onLaunch() {
    this.version = "0.1.0";
    this.cloudReady = false;

    if (wx.cloud) {
      wx.cloud.init({
        traceUser: true
      });
      this.cloudReady = true;
    }
  }
});

const { getChecklist, getPipeline, getProjectMeta } = require("../../utils/state");

Page({
  data: {
    checklist: [],
    meta: getProjectMeta(),
    pipeline: []
  },

  onLoad() {
    this.setData({
      checklist: getChecklist(),
      pipeline: getPipeline()
    });
  }
});

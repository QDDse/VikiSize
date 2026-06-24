const store = require("../../services/localStore");
const { RoleLabels } = require("../../domain/constants");

Page({
  data: {
    token: "",
    spaceId: "",
    space: null,
    invitation: null,
    roleLabel: ""
  },

  onLoad(options) {
    const state = store.getState();
    const invitation = state.collections.invitations.find((item) => item.token === options.token);
    const space = state.collections.spaces.find((item) => item.id === options.spaceId);
    this.setData({
      token: options.token || "",
      spaceId: options.spaceId || "",
      invitation,
      space,
      roleLabel: invitation ? RoleLabels[invitation.role] || invitation.role : ""
    });
  },

  accept() {
    try {
      store.acceptInvitation(this.data.token);
      wx.showToast({ title: "已加入空间", icon: "success" });
      wx.switchTab({ url: "/pages/today/index" });
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" });
    }
  }
});

const store = require("../../services/localStore");
const { RoleLabels, Roles } = require("../../domain/constants");

Page({
  data: {
    context: {},
    roleLabel: "",
    members: [],
    invitation: null,
    sharePath: ""
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const context = store.getCurrentContext();
    const members = context.space
      ? context.state.collections.space_members
        .filter((item) => item.spaceId === context.space.id)
        .map((member) => {
          const user = context.state.collections.users.find((item) => item.id === member.userId) || {};
          return Object.assign({}, member, {
            displayName: user.displayName || "微信用户",
            roleLabel: RoleLabels[member.role]
          });
        })
      : [];

    this.setData({
      context,
      roleLabel: context.member ? RoleLabels[context.member.role] : "",
      members
    });
  },

  createMemberInvite() {
    this.createInvite(Roles.MEMBER);
  },

  createGuestInvite() {
    this.createInvite(Roles.GUEST);
  },

  createInvite(role) {
    try {
      const invitation = store.createInvitation(role);
      this.setData({
        invitation,
        sharePath: `/pages/invitation/index?spaceId=${invitation.spaceId}&token=${invitation.token}`
      });
      wx.showToast({ title: "邀请已生成", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" });
    }
  },

  onShareAppMessage() {
    const invitation = this.data.invitation || store.createInvitation(Roles.MEMBER);
    return {
      title: `加入 ${this.data.context.space.name}`,
      path: `/pages/invitation/index?spaceId=${invitation.spaceId}&token=${invitation.token}`
    };
  }
});

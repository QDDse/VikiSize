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
    // 分享回调必须保持只读：写操作（生成邀请）在 createInvite 按钮里完成，
    // 这里只消费已生成的邀请；未生成或无空间时降级为普通分享。
    const invitation = this.data.invitation;
    const space = this.data.context && this.data.context.space;
    if (!invitation || !space) {
      return { title: "VikiSize 生活助手", path: "/pages/today/index" };
    }
    return {
      title: `加入 ${space.name}`,
      path: `/pages/invitation/index?spaceId=${invitation.spaceId}&token=${invitation.token}`
    };
  }
});

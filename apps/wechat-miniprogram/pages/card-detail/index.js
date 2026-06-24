const store = require("../../services/localStore");
const { ReminderTypes } = require("../../domain/constants");

Page({
  data: {
    cardId: "",
    detail: null,
    context: {},
    commentText: ""
  },

  onLoad(options) {
    this.setData({ cardId: options.id || "" });
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    this.setData({
      context: store.getCurrentContext(),
      detail: store.getCardDetail(this.data.cardId)
    });
  },

  advanceStatus() {
    this.writeAction(() => store.advanceCardStatus(this.data.cardId), "状态已更新");
  },

  archiveCard() {
    this.writeAction(() => store.archiveCard(this.data.cardId, !this.data.detail.card.archivedAt), this.data.detail.card.archivedAt ? "已恢复" : "已归档");
  },

  scheduleAssigned() {
    this.writeAction(() => store.scheduleReminder(this.data.cardId, ReminderTypes.ASSIGNED_TO_ME), "提醒已记录");
  },

  scheduleDueSoon() {
    this.writeAction(() => store.scheduleReminder(this.data.cardId, ReminderTypes.DUE_SOON), "提醒已记录");
  },

  setAgree() {
    this.writeAction(() => store.setMemberOpinion(this.data.cardId, "agree"), "意见已更新");
  },

  onCommentInput(event) {
    this.setData({ commentText: event.detail.value });
  },

  addComment() {
    const body = this.data.commentText.trim();
    if (!body) {
      wx.showToast({ title: "请输入评论", icon: "none" });
      return;
    }
    this.writeAction(() => store.addComment(this.data.cardId, body), "评论已添加");
    this.setData({ commentText: "" });
  },

  writeAction(action, message) {
    try {
      action();
      wx.showToast({ title: message, icon: "success" });
      this.refresh();
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" });
    }
  }
});

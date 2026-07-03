const { collection, now } = require("./_shared/cloud");
const { assertPermission } = require("./_shared/permissions");
const { addWithId, notFound } = require("./_shared/repo");

const supportedTypes = ["assigned_to_me", "due_soon", "needs_confirmation"];

exports.main = async (event) => {
  if (!supportedTypes.includes(event.type)) {
    throw new Error("不支持的提醒类型");
  }
  const card = (await collection("cards").doc(event.cardId).get()).data;
  if (!card) {
    throw notFound("卡片不存在");
  }
  const { user } = await assertPermission(card.spaceId, event.profile || {});
  const timestamp = now();

  // 派发用的是订阅消息 touser=openid，必须在创建提醒时就解析好接收者 openid，
  // dispatchReminders 运行在定时器上下文里拿不到调用者身份。
  const recipientUserId = event.recipientUserId || user.id;
  let recipientOpenid = user.openid;
  if (recipientUserId !== user.id) {
    const recipients = await collection("users").where({ id: recipientUserId }).limit(1).get();
    if (!recipients.data.length) {
      throw notFound("提醒接收人不存在");
    }
    recipientOpenid = recipients.data[0].openid;
  }

  const reminder = {
    spaceId: card.spaceId,
    cardId: event.cardId,
    recipientUserId,
    recipientOpenid,
    type: event.type,
    scheduledAt: event.scheduledAt || card.reminderAt || card.dueAt || timestamp,
    status: "pending",
    wechatTemplateId: event.wechatTemplateId || "",
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const reminderId = await addWithId("reminders", reminder);
  return { reminder: Object.assign({}, reminder, { id: reminderId }) };
};

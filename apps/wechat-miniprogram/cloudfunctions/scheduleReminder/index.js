const { collection, now } = require("../_shared/cloud");
const { assertPermission } = require("../_shared/permissions");

const supportedTypes = ["assigned_to_me", "due_soon", "needs_confirmation"];

exports.main = async (event) => {
  if (!supportedTypes.includes(event.type)) {
    throw new Error("不支持的提醒类型");
  }
  const card = (await collection("cards").doc(event.cardId).get()).data;
  const { user } = await assertPermission(card.spaceId, event.profile || {});
  const timestamp = now();
  const reminder = {
    id: "",
    spaceId: card.spaceId,
    cardId: event.cardId,
    recipientUserId: event.recipientUserId || user.id,
    type: event.type,
    scheduledAt: event.scheduledAt || card.reminderAt || card.dueAt || timestamp,
    status: "pending",
    wechatTemplateId: event.wechatTemplateId || "",
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const result = await collection("reminders").add({ data: reminder });
  await collection("reminders").doc(result._id).update({ data: { id: result._id } });
  return { reminder: Object.assign({}, reminder, { id: result._id }) };
};

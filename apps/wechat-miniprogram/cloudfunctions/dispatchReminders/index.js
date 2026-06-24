const { _, cloud, collection, now } = require("../_shared/cloud");

exports.main = async () => {
  const timestamp = now();
  const due = await collection("reminders").where({
    status: "pending",
    scheduledAt: _.lte(timestamp)
  }).limit(50).get();

  const results = [];
  for (const reminder of due.data) {
    try {
      if (reminder.wechatTemplateId) {
        await cloud.openapi.subscribeMessage.send({
          touser: reminder.recipientOpenid,
          templateId: reminder.wechatTemplateId,
          page: `/pages/card-detail/index?id=${reminder.cardId}`,
          data: {
            thing1: { value: reminder.type },
            time2: { value: timestamp }
          }
        });
      }
      await collection("reminders").doc(reminder._id).update({ data: { status: "sent", updatedAt: timestamp } });
      results.push({ id: reminder.id || reminder._id, status: "sent" });
    } catch (error) {
      await collection("reminders").doc(reminder._id).update({ data: { status: "failed", updatedAt: timestamp } });
      results.push({ id: reminder.id || reminder._id, status: "failed", message: error.message });
    }
  }

  return { results };
};

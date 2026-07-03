const { _, cloud, collection, now } = require("./_shared/cloud");

const BATCH_LIMIT = 50;

exports.main = async () => {
  // 只允许定时触发器驱动：该函数无空间级权限模型，
  // 若放开给 callFunction，任何用户都能驱动全量提醒派发。
  const source = cloud.getWXContext().SOURCE;
  if (source !== "wx_trigger") {
    const error = new Error("仅允许定时触发器调用");
    error.code = "FORBIDDEN_SOURCE";
    throw error;
  }

  const timestamp = now();
  const results = [];

  // 分批循环直到没有到期提醒，避免每次运行只处理 50 条导致积压
  for (;;) {
    const due = await collection("reminders").where({
      status: "pending",
      scheduledAt: _.lte(timestamp)
    }).limit(BATCH_LIMIT).get();

    if (!due.data.length) {
      break;
    }

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

    if (due.data.length < BATCH_LIMIT) {
      break;
    }
  }

  return { results };
};

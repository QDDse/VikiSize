const { _, collection, now } = require("./_shared/cloud");
const { currentUser } = require("./_shared/permissions");
const { notificationConfig } = require("./_shared/fitnessNotifications");

exports.main = async (event) => {
  const user = await currentUser(event.profile || {});
  const config = notificationConfig();
  if (!config.configured) throw new Error(config.error);
  if (event.templateId !== config.templateId || event.accepted !== true) throw new Error("周报订阅授权无效");
  const timestamp = now();
  const subscription = {
    status: "granted",
    templateId: config.templateId,
    grantedAt: timestamp,
    consumedAt: null,
    deliveryId: null
  };
  await collection("users").doc(user._id).update({
    data: { fitnessWeeklySubscription: _.set(subscription), updatedAt: timestamp }
  });
  return { configured: true, templateId: config.templateId, status: "granted" };
};

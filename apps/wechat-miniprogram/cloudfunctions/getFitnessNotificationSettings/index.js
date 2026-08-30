const { currentUser } = require("./_shared/permissions");
const { notificationConfig } = require("./_shared/fitnessNotifications");

exports.main = async (event) => {
  const user = await currentUser(event.profile || {});
  const config = notificationConfig();
  const subscription = user.fitnessWeeklySubscription || {};
  return {
    configured: config.configured,
    templateId: config.templateId,
    status: subscription.templateId === config.templateId ? (subscription.status || "disabled") : "disabled",
    message: config.error || ""
  };
};

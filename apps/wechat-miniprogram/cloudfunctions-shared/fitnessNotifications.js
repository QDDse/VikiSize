function truncate(value, maxLength) {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 1))}…` : text;
}

function overallNotificationStatus(channels) {
  const statuses = Object.values(channels).map((channel) => channel.status);
  if (statuses.includes("sent")) return "sent";
  if (statuses.includes("failed")) return "failed";
  if (statuses.includes("not_subscribed")) return "not_subscribed";
  return "not_configured";
}

async function sendFitnessDeliveryNotifications({
  cloud,
  collection,
  _,
  delivery,
  userId,
  timestamp,
  env,
  sendWechat,
  sendServerChan
}) {
  const [wechat, serverChan] = await Promise.all([
    (sendWechat || sendFitnessWeeklyNotification)({ cloud, collection, _, delivery, userId, timestamp, env }),
    (sendServerChan || require("./serverChanClient").sendServerChanNotification)({ delivery, timestamp, env })
  ]);
  const channels = { wechat, serverChan };
  return { status: overallNotificationStatus(channels), channels };
}

function notificationConfig(env) {
  const source = env || process.env;
  const templateId = String(source.FITNESS_WEEKLY_REPORT_TEMPLATE_ID || "").trim();
  const requestedState = String(source.FITNESS_MINIPROGRAM_STATE || "formal").trim();
  const miniprogramState = ["developer", "trial", "formal"].includes(requestedState) ? requestedState : "formal";
  let bindings = {};
  try {
    bindings = JSON.parse(source.FITNESS_WEEKLY_REPORT_TEMPLATE_BINDINGS || "{}");
  } catch (error) {
    return { configured: false, templateId, bindings: {}, error: "周报模板字段映射不是合法 JSON" };
  }
  const configured = Boolean(templateId && bindings && typeof bindings === "object" && Object.keys(bindings).length);
  return {
    configured,
    templateId,
    miniprogramState,
    bindings: configured ? bindings : {},
    error: configured ? "" : "周报订阅消息模板尚未配置"
  };
}

function bindingValue(delivery, source) {
  const report = delivery.report || {};
  const period = report.period || {};
  const values = {
    title: "健身周报已生成",
    summary: truncate(report.summary, 20),
    period: `${period.start || ""}~${period.end || ""}`.replaceAll("-", "."),
    generatedAt: String(delivery.generatedAt || "").replace("T", " ").slice(0, 16)
  };
  return values[source] || truncate(source, 20);
}

function buildNotificationData(delivery, bindings) {
  return Object.entries(bindings).reduce((data, entry) => {
    const [templateKey, source] = entry;
    data[templateKey] = { value: bindingValue(delivery, source) };
    return data;
  }, {});
}

async function sendFitnessWeeklyNotification({ cloud, collection, _, delivery, userId, timestamp, env }) {
  const config = notificationConfig(env);
  if (!config.configured) return { status: "not_configured", message: config.error };
  const users = await collection("users").where({ id: userId }).limit(1).get();
  const user = users.data[0];
  const subscription = user && user.fitnessWeeklySubscription;
  if (!user || !subscription || subscription.status !== "granted" || subscription.templateId !== config.templateId) {
    return { status: "not_subscribed" };
  }

  try {
    await cloud.openapi.subscribeMessage.send({
      touser: user.openid,
      templateId: config.templateId,
      page: `/pages/fitness-detail/index?id=${encodeURIComponent(delivery.deliveryId)}`,
      miniprogramState: config.miniprogramState,
      data: buildNotificationData(delivery, config.bindings)
    });
    await collection("users").doc(user._id).update({
      data: {
        fitnessWeeklySubscription: _.set(Object.assign({}, subscription, {
          status: "consumed",
          consumedAt: timestamp,
          deliveryId: delivery.deliveryId
        })),
        updatedAt: timestamp
      }
    });
    return { status: "sent", sentAt: timestamp };
  } catch (error) {
    return { status: "failed", message: truncate(error.message || "订阅消息发送失败", 120) };
  }
}

module.exports = {
  buildNotificationData,
  notificationConfig,
  overallNotificationStatus,
  sendFitnessDeliveryNotifications,
  sendFitnessWeeklyNotification
};

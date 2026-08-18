const { collection, now } = require("./_shared/cloud");
const { permissionDenied } = require("./_shared/repo");
const { secureHashEqual, sha256, tokenHash, validateFitnessDelivery } = require("./_shared/fitnessSchema");
const { sendFitnessDeliveryNotifications, sendFitnessWeeklyNotification } = require("./_shared/fitnessNotifications");
const { sendServerChanNotification } = require("./_shared/serverChanClient");
const { renderFitnessReportPage } = require("./_shared/fitnessReportPage");
const { _, cloud } = require("./_shared/cloud");

function requestPayload(event) {
  if (!event.httpMethod) return event;
  if (event.httpMethod !== "POST") {
    const error = new Error("Fitness Delivery 仅支持 POST");
    error.code = "METHOD_NOT_ALLOWED";
    throw error;
  }
  const body = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : event.body;
  return typeof body === "string" ? JSON.parse(body || "{}") : (body || {});
}

async function ingest(event, dependencies) {
  const channels = await collection("fitness_channels").where({ id: event.channelId, revokedAt: null }).limit(1).get();
  const channel = channels.data[0];
  if (!channel || !secureHashEqual(channel.publishTokenHash, tokenHash(event.publishToken))) {
    throw permissionDenied("Fitness 发布凭证无效");
  }
  validateFitnessDelivery(event.delivery);
  const existing = await collection("fitness_deliveries").where({ userId: channel.userId, deliveryId: event.delivery.deliveryId }).limit(1).get();
  if (existing.data.length) {
    if (existing.data[0].contentHash !== event.delivery.contentHash) throw new Error("Delivery 内容冲突");
    return { delivery: existing.data[0], created: false };
  }
  const timestamp = now();
  const id = `fit_${sha256(`${channel.userId}:${event.delivery.deliveryId}`).slice(7, 31)}`;
  const recordData = Object.assign({}, event.delivery, {
    _id: id,
    id,
    userId: channel.userId,
    channelId: channel.id,
    readAt: null,
    decision: null,
    receivedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  try {
    await collection("fitness_deliveries").add({ data: recordData });
  } catch (error) {
    const raced = (await collection("fitness_deliveries").doc(id).get()).data;
    if (!raced) throw error;
    if (raced.contentHash !== event.delivery.contentHash) throw new Error("Delivery 内容冲突");
    return { delivery: raced, created: false };
  }
  let notification;
  try {
    notification = await sendFitnessDeliveryNotifications({
      cloud,
      collection,
      _,
      delivery: recordData,
      userId: channel.userId,
      timestamp,
      env: process.env,
      sendWechat: dependencies.sendFitnessWeeklyNotification,
      sendServerChan: dependencies.sendServerChanNotification
    });
    await collection("fitness_deliveries").doc(id).update({ data: { notification: _.set(notification), updatedAt: now() } });
  } catch (error) {
    notification = { status: "failed", message: String(error.message || "订阅消息发送失败").slice(0, 120) };
  }
  return { delivery: Object.assign({}, recordData, { notification }), created: true };
}

function errorStatus(error) {
  if (error.code === "PERMISSION_DENIED") return 401;
  if (error.code === "METHOD_NOT_ALLOWED") return 405;
  if (/冲突/.test(error.message || "")) return 409;
  if (error instanceof SyntaxError || /schema|不完整|缺少|哈希|仅支持/.test(error.message || "")) return 400;
  return 500;
}

function httpResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload)
  };
}

function reportPageResponse() {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff"
    },
    body: renderFitnessReportPage()
  };
}

function createHandler(overrides) {
  const dependencies = Object.assign({ sendFitnessWeeklyNotification, sendServerChanNotification }, overrides);
  return async (event) => {
    const isHttp = Boolean(event.httpMethod);
    try {
      if (event.httpMethod === "GET" && event.queryStringParameters && event.queryStringParameters.view === "report") {
        return reportPageResponse();
      }
      const result = await ingest(requestPayload(event), dependencies);
      return isHttp ? httpResponse(200, result) : result;
    } catch (error) {
      if (!isHttp) throw error;
      const statusCode = errorStatus(error);
      return httpResponse(statusCode, {
        error: statusCode === 500 ? "Fitness Delivery 服务暂不可用" : error.message,
        code: error.code || "INVALID_DELIVERY"
      });
    }
  };
}

exports.createHandler = createHandler;
exports.main = createHandler();

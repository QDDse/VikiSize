const { collection, now } = require("./_shared/cloud");
const { permissionDenied } = require("./_shared/repo");
const { secureHashEqual, sha256, tokenHash, validateFitnessDelivery } = require("./_shared/fitnessSchema");

function requestPayload(event) {
  if (!event.httpMethod) return event;
  if (event.httpMethod !== "POST") throw new Error("Fitness Delivery 仅支持 POST");
  const body = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : event.body;
  return typeof body === "string" ? JSON.parse(body || "{}") : (body || {});
}

exports.main = async (event) => {
  event = requestPayload(event);
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
    return { delivery: recordData, created: true };
  } catch (error) {
    const raced = (await collection("fitness_deliveries").doc(id).get()).data;
    if (!raced) throw error;
    if (raced.contentHash !== event.delivery.contentHash) throw new Error("Delivery 内容冲突");
    return { delivery: raced, created: false };
  }
};

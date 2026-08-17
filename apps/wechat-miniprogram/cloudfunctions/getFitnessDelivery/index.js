const { collection, now } = require("./_shared/cloud");
const { currentUser } = require("./_shared/permissions");
const { notFound } = require("./_shared/repo");

exports.main = async (event) => {
  const user = await currentUser(event.profile || {});
  const result = await collection("fitness_deliveries").where({ userId: user.id, deliveryId: event.deliveryId }).limit(1).get();
  const delivery = result.data[0];
  if (!delivery) throw notFound("Fitness 报告不存在");
  if (event.markRead && !delivery.readAt) {
    delivery.readAt = now();
    await collection("fitness_deliveries").doc(delivery._id).update({ data: { readAt: delivery.readAt, updatedAt: delivery.readAt } });
  }
  return { delivery };
};

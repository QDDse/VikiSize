const { collection, now } = require("../_shared/cloud");
const { assertPermission } = require("../_shared/permissions");

exports.main = async (event) => {
  const card = (await collection("cards").doc(event.cardId).get()).data;
  const { user } = await assertPermission(card.spaceId, event.profile || {});
  const timestamp = now();
  const existing = await collection("member_opinions").where({ cardId: event.cardId, userId: user.id }).limit(1).get();

  if (existing.data.length) {
    await collection("member_opinions").doc(existing.data[0]._id).update({ data: { value: event.value, updatedAt: timestamp } });
  } else {
    const opinionResult = await collection("member_opinions").add({
      data: {
        id: "",
        spaceId: card.spaceId,
        cardId: event.cardId,
        userId: user.id,
        value: event.value,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    });
    await collection("member_opinions").doc(opinionResult._id).update({ data: { id: opinionResult._id } });
  }

  const activityResult = await collection("activities").add({
    data: {
      id: "",
      spaceId: card.spaceId,
      cardId: event.cardId,
      actorUserId: user.id,
      type: "opinion_changed",
      summary: `更新了意见：${event.value}`,
      createdAt: timestamp
    }
  });
  await collection("activities").doc(activityResult._id).update({ data: { id: activityResult._id } });
  return { ok: true };
};

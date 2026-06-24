const { collection, now } = require("../_shared/cloud");
const { assertPermission } = require("../_shared/permissions");

exports.main = async (event) => {
  const cards = await collection("cards").doc(event.cardId).get();
  const card = cards.data;
  const { user } = await assertPermission(card.spaceId, event.profile || {});
  const timestamp = now();
  await collection("cards").doc(event.cardId).update({
    data: {
      archivedAt: event.archived ? timestamp : null,
      updatedAt: timestamp
    }
  });
  const activityResult = await collection("activities").add({
    data: {
      id: "",
      spaceId: card.spaceId,
      cardId: event.cardId,
      actorUserId: user.id,
      type: event.archived ? "card_archived" : "card_unarchived",
      summary: event.archived ? `归档了「${card.title}」` : `恢复了「${card.title}」`,
      createdAt: timestamp
    }
  });
  await collection("activities").doc(activityResult._id).update({ data: { id: activityResult._id } });
  return { ok: true };
};

const { collection, now } = require("../_shared/cloud");
const { assertPermission } = require("../_shared/permissions");

exports.main = async (event) => {
  const { user } = await assertPermission(event.spaceId, event.profile || {});
  const timestamp = now();
  const card = Object.assign({
    id: "",
    spaceId: event.spaceId,
    module: event.module,
    title: event.title,
    description: event.description || "",
    ownerUserId: event.ownerUserId || user.id,
    participantUserIds: event.participantUserIds || [user.id],
    status: event.status || "todo",
    dueAt: event.dueAt || null,
    reminderAt: event.reminderAt || null,
    createdBy: user.id,
    createdAt: timestamp,
    updatedAt: timestamp,
    archivedAt: null,
    details: event.details || {}
  }, event.card || {});

  if (event.id) {
    await collection("cards").doc(event.id).update({
      data: {
        title: card.title,
        description: card.description,
        status: card.status,
        dueAt: card.dueAt,
        reminderAt: card.reminderAt,
        details: card.details,
        updatedAt: timestamp
      }
    });
    return { id: event.id };
  }

  const result = await collection("cards").add({ data: card });
  await collection("cards").doc(result._id).update({ data: { id: result._id } });
  const activityResult = await collection("activities").add({
    data: {
      id: "",
      spaceId: event.spaceId,
      cardId: result._id,
      actorUserId: user.id,
      type: "card_created",
      summary: `创建了卡片「${card.title}」`,
      createdAt: timestamp
    }
  });
  await collection("activities").doc(activityResult._id).update({ data: { id: activityResult._id } });
  return { card: Object.assign({}, card, { id: result._id }) };
};

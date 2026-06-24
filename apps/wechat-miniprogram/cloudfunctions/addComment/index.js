const { collection, now } = require("../_shared/cloud");
const { assertPermission } = require("../_shared/permissions");

exports.main = async (event) => {
  const card = (await collection("cards").doc(event.cardId).get()).data;
  const { user } = await assertPermission(card.spaceId, event.profile || {});
  const timestamp = now();
  const comment = {
    id: "",
    spaceId: card.spaceId,
    cardId: event.cardId,
    authorUserId: user.id,
    body: event.body,
    createdAt: timestamp,
    deletedAt: null
  };
  const result = await collection("comments").add({ data: comment });
  await collection("comments").doc(result._id).update({ data: { id: result._id } });
  const activityResult = await collection("activities").add({
    data: {
      id: "",
      spaceId: card.spaceId,
      cardId: event.cardId,
      actorUserId: user.id,
      type: "comment_created",
      summary: "添加了一条评论",
      createdAt: timestamp
    }
  });
  await collection("activities").doc(activityResult._id).update({ data: { id: activityResult._id } });
  return { comment: Object.assign({}, comment, { id: result._id }) };
};

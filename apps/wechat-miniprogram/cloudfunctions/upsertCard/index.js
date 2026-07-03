const { collection, now } = require("./_shared/cloud");
const { assertPermission } = require("./_shared/permissions");
const { addWithId, logActivity, notFound, permissionDenied } = require("./_shared/repo");

exports.main = async (event) => {
  const timestamp = now();

  if (event.id) {
    // 更新必须以库内卡片的 spaceId 为准做权限校验：
    // 客户端传入的 spaceId 只用于一致性核对，防止跨空间越权更新（IDOR）。
    const existing = (await collection("cards").doc(event.id).get()).data;
    if (!existing) {
      throw notFound("卡片不存在");
    }
    if (event.spaceId && event.spaceId !== existing.spaceId) {
      throw permissionDenied("卡片不属于该空间");
    }
    await assertPermission(existing.spaceId, event.profile || {});
    await collection("cards").doc(event.id).update({
      data: {
        title: event.title !== undefined ? event.title : existing.title,
        description: event.description !== undefined ? event.description : existing.description,
        status: event.status !== undefined ? event.status : existing.status,
        dueAt: event.dueAt !== undefined ? event.dueAt : existing.dueAt,
        reminderAt: event.reminderAt !== undefined ? event.reminderAt : existing.reminderAt,
        details: event.details !== undefined ? event.details : existing.details,
        updatedAt: timestamp
      }
    });
    return { id: event.id };
  }

  const { user } = await assertPermission(event.spaceId, event.profile || {});
  const card = Object.assign({
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

  const cardId = await addWithId("cards", card);
  await logActivity({
    spaceId: event.spaceId,
    cardId,
    actorUserId: user.id,
    type: "card_created",
    summary: `创建了卡片「${card.title}」`
  });
  return { card: Object.assign({}, card, { id: cardId }) };
};

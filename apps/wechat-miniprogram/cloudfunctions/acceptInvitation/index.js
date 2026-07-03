const { collection, now } = require("./_shared/cloud");
const { currentUser } = require("./_shared/permissions");
const { addWithId } = require("./_shared/repo");

function invalidInvitation() {
  const error = new Error("邀请无效或已使用");
  error.code = "INVITATION_INVALID";
  return error;
}

exports.main = async (event) => {
  const user = await currentUser(event.profile || {});
  const invitations = await collection("invitations").where({ token: event.token, status: "pending" }).limit(1).get();
  const invitation = invitations.data[0];

  if (!invitation) {
    throw invalidInvitation();
  }

  const timestamp = now();
  if (invitation.expiresAt && invitation.expiresAt < timestamp) {
    await collection("invitations").doc(invitation._id).update({ data: { status: "expired", updatedAt: timestamp } });
    const error = new Error("邀请已过期");
    error.code = "INVITATION_EXPIRED";
    throw error;
  }

  // 已是成员时幂等成功，不重复写入 space_members
  const existingMembers = await collection("space_members")
    .where({ spaceId: invitation.spaceId, userId: user.id })
    .limit(1)
    .get();
  if (existingMembers.data.length) {
    return { spaceId: invitation.spaceId, role: existingMembers.data[0].role, alreadyMember: true };
  }

  // 条件更新原子地消费邀请：并发接受时只有一个调用能把 pending 翻成 accepted
  const consumed = await collection("invitations")
    .where({ token: event.token, status: "pending" })
    .update({ data: { status: "accepted", acceptedBy: user.id, updatedAt: timestamp } });
  const updatedCount = consumed.stats ? consumed.stats.updated : consumed.updated;
  if (!updatedCount) {
    throw invalidInvitation();
  }

  await addWithId("space_members", {
    spaceId: invitation.spaceId,
    userId: user.id,
    role: invitation.role,
    invitedBy: invitation.invitedBy,
    joinedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  return { spaceId: invitation.spaceId, role: invitation.role };
};

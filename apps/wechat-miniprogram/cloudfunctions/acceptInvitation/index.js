const { collection, now } = require("../_shared/cloud");
const { currentUser } = require("../_shared/permissions");

exports.main = async (event) => {
  const user = await currentUser(event.profile || {});
  const invitations = await collection("invitations").where({ token: event.token, status: "pending" }).limit(1).get();
  const invitation = invitations.data[0];

  if (!invitation) {
    throw new Error("邀请无效或已使用");
  }

  const timestamp = now();
  const memberResult = await collection("space_members").add({
    data: {
      id: "",
      spaceId: invitation.spaceId,
      userId: user.id,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
      joinedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  });
  await collection("space_members").doc(memberResult._id).update({ data: { id: memberResult._id } });
  await collection("invitations").doc(invitation._id).update({ data: { status: "accepted", updatedAt: timestamp } });
  return { spaceId: invitation.spaceId, role: invitation.role };
};

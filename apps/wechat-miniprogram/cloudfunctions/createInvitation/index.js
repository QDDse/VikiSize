const { collection, now } = require("../_shared/cloud");
const { assertPermission } = require("../_shared/permissions");

exports.main = async (event) => {
  const { user } = await assertPermission(event.spaceId, event.profile || {});
  const timestamp = now();
  const invitation = {
    id: "",
    spaceId: event.spaceId,
    token: `token-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    invitedBy: user.id,
    role: event.role === "guest" ? "guest" : "member",
    status: "pending",
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const result = await collection("invitations").add({ data: invitation });
  await collection("invitations").doc(result._id).update({ data: { id: result._id } });
  return { invitation: Object.assign({}, invitation, { id: result._id }) };
};

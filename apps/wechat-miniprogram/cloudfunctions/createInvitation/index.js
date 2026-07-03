const { now } = require("./_shared/cloud");
const { assertPermission } = require("./_shared/permissions");
const { addWithId, generateToken } = require("./_shared/repo");

const INVITATION_TTL_MS = 72 * 60 * 60 * 1000;

exports.main = async (event) => {
  const { user } = await assertPermission(event.spaceId, event.profile || {});
  const timestamp = now();
  const invitation = {
    spaceId: event.spaceId,
    // token 是加入空间的唯一凭证：加密随机 + 过期时间
    token: generateToken(),
    invitedBy: user.id,
    role: event.role === "guest" ? "guest" : "member",
    status: "pending",
    expiresAt: new Date(Date.now() + INVITATION_TTL_MS).toISOString(),
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const invitationId = await addWithId("invitations", invitation);
  return { invitation: Object.assign({}, invitation, { id: invitationId }) };
};

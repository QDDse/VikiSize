const { collection, now } = require("./_shared/cloud");
const { currentUser } = require("./_shared/permissions");
const { addWithId, generateToken } = require("./_shared/repo");
const { tokenHash } = require("./_shared/fitnessSchema");

exports.main = async (event) => {
  const user = await currentUser(event.profile || {});
  const timestamp = now();
  await collection("fitness_channels").where({ userId: user.id, revokedAt: null }).update({ data: { revokedAt: timestamp, updatedAt: timestamp } });
  const publishToken = generateToken();
  const channelId = await addWithId("fitness_channels", {
    userId: user.id,
    publishTokenHash: tokenHash(publishToken),
    revokedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  return { channelId, publishToken };
};

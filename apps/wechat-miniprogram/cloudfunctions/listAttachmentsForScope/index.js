const { collection } = require("./_shared/cloud");
const { currentUser } = require("./_shared/permissions");
const { MAX_QUERY_LIMIT } = require("./_shared/repo");

exports.main = async (event) => {
  const user = await currentUser(event.profile || {});
  const members = await collection("space_members").where({ spaceId: event.spaceId, userId: user.id }).limit(1).get();
  if (!members.data.length) {
    const error = new Error("无权访问该空间");
    error.code = "PERMISSION_DENIED";
    throw error;
  }
  const result = await collection("attachments")
    .where({ spaceId: event.spaceId, scopeId: event.scopeId, deletedAt: null })
    .limit(MAX_QUERY_LIMIT)
    .get();
  return { attachments: members.data[0].role === "guest" ? result.data.filter((item) => !item.sensitive) : result.data };
};

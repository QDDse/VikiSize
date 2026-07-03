const { collection, getOrCreateUser } = require("./cloud");

async function currentUser(profile) {
  return getOrCreateUser(profile || {});
}

async function assertPermission(spaceId, profile) {
  const user = await currentUser(profile);
  const members = await collection("space_members").where({ spaceId, userId: user.id }).limit(1).get();
  const member = members.data[0];

  if (!member || member.role === "guest") {
    const error = new Error("访客只能查看，不能修改");
    error.code = "PERMISSION_DENIED";
    throw error;
  }

  return { user, member };
}

async function assertOwner(spaceId, profile) {
  const result = await assertPermission(spaceId, profile);
  if (result.member.role !== "owner") {
    const error = new Error("只有管理员可以管理成员");
    error.code = "OWNER_REQUIRED";
    throw error;
  }
  return result;
}

module.exports = {
  assertOwner,
  assertPermission,
  currentUser
};

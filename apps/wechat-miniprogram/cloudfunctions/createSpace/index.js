const { now } = require("./_shared/cloud");
const { currentUser } = require("./_shared/permissions");
const { addWithId } = require("./_shared/repo");

exports.main = async (event) => {
  const templateType = event.templateType || "travel_team";
  if (templateType !== "travel_team") throw new Error("当前版本只支持旅行空间");
  const user = await currentUser(event.profile || {});
  const timestamp = now();
  const space = {
    id: "",
    name: event.name || "新的旅行空间",
    templateType,
    ownerUserId: user.id,
    currentTemplateInstanceId: "",
    createdAt: timestamp,
    updatedAt: timestamp,
    archivedAt: null
  };
  const spaceId = await addWithId("spaces", space);
  await addWithId("space_members", {
    spaceId,
    userId: user.id,
    role: "owner",
    invitedBy: user.id,
    joinedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  return { space: Object.assign({}, space, { id: spaceId }) };
};

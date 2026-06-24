const { collection, now } = require("../_shared/cloud");
const { currentUser } = require("../_shared/permissions");

exports.main = async (event) => {
  const user = await currentUser(event.profile || {});
  const timestamp = now();
  const space = {
    id: "",
    name: event.name || "New Life Space",
    templateType: event.templateType || "blank",
    ownerUserId: user.id,
    currentTemplateInstanceId: "",
    createdAt: timestamp,
    updatedAt: timestamp,
    archivedAt: null
  };
  const result = await collection("spaces").add({ data: space });
  await collection("spaces").doc(result._id).update({ data: { id: result._id } });
  const memberResult = await collection("space_members").add({
    data: {
      id: "",
      spaceId: result._id,
      userId: user.id,
      role: "owner",
      invitedBy: user.id,
      joinedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  });
  await collection("space_members").doc(memberResult._id).update({ data: { id: memberResult._id } });
  return { space: Object.assign({}, space, { id: result._id }) };
};

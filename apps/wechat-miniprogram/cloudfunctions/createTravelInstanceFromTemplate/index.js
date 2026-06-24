const { collection, now } = require("../_shared/cloud");
const { assertPermission } = require("../_shared/permissions");

exports.main = async (event) => {
  const { user } = await assertPermission(event.spaceId, event.profile || {});
  const timestamp = now();
  const templates = await collection("travel_templates").where({ id: event.templateId || "template-travel-tokyo-8d-v1" }).limit(1).get();
  const template = templates.data[0];

  if (!template) {
    throw new Error("旅行模板不存在");
  }

  const instance = {
    id: "",
    spaceId: event.spaceId,
    sourceTemplateId: template.id,
    sourceName: template.sourceName,
    sourceVersion: template.version,
    importedAt: timestamp,
    initialSnapshot: template,
    days: template.days,
    budgetCategories: template.budgetCategories || [],
    createdAt: timestamp,
    updatedAt: timestamp,
    archivedAt: null
  };
  const result = await collection("travel_plan_instances").add({ data: instance });
  await collection("travel_plan_instances").doc(result._id).update({ data: { id: result._id } });
  await collection("spaces").doc(event.spaceId).update({ data: { currentTemplateInstanceId: result._id, updatedAt: timestamp } });
  const activityResult = await collection("activities").add({
    data: {
      id: "",
      spaceId: event.spaceId,
      cardId: "",
      actorUserId: user.id,
      type: "travel_instance_created",
      summary: "从旅行模板创建了实例",
      createdAt: timestamp
    }
  });
  await collection("activities").doc(activityResult._id).update({ data: { id: activityResult._id } });
  return { instance: Object.assign({}, instance, { id: result._id }) };
};

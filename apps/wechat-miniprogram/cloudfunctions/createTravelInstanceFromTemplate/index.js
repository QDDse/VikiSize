const { collection, now } = require("../_shared/cloud");
const { assertPermission } = require("../_shared/permissions");

exports.main = async (event) => {
  const { user } = await assertPermission(event.spaceId, event.profile || {});
  const timestamp = now();
  const templateQuery = { id: event.templateId || "tokyo-kanto-8d" };
  if (event.templateVersion) templateQuery.version = event.templateVersion;
  const templates = await collection("travel_templates").where(templateQuery).limit(1).get();
  const template = templates.data[0];

  if (!template) {
    throw new Error("旅行模板不存在");
  }

  const existing = await collection("travel_plan_instances").where({
    spaceId: event.spaceId,
    sourceTemplateId: template.id,
    sourceVersion: template.version,
    archivedAt: null
  }).limit(1).get();
  if (existing.data.length) {
    return { instance: existing.data[0], created: false };
  }

  const instance = {
    id: "",
    spaceId: event.spaceId,
    sourceTemplateId: template.id,
    sourceName: template.sourceName,
    sourceVersion: template.version,
    importedAt: timestamp,
    initialSnapshot: template,
    title: template.title,
    startDate: template.startDate,
    endDate: template.days.length ? template.days[template.days.length - 1].date : "",
    timezone: "Asia/Tokyo",
    status: "planning",
    candidatePlaces: [],
    modules: [],
    days: template.days,
    budgetCategories: template.budgetCategories || [],
    createdBy: user.id,
    revision: 1,
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
  return { instance: Object.assign({}, instance, { id: result._id }), created: true };
};

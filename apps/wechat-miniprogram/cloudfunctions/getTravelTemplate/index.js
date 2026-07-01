const { collection } = require("../_shared/cloud");

exports.main = async (event) => {
  const query = { id: event.templateId, status: "published" };
  if (event.version) query.version = event.version;
  const result = await collection("travel_templates").where(query).limit(1).get();
  if (!result.data.length) throw new Error("旅行模板不存在");
  return { template: result.data[0] };
};

const { collection } = require("./_shared/cloud");
const { MAX_QUERY_LIMIT } = require("./_shared/repo");

exports.main = async () => {
  // 服务端 get 默认只返回 20 条，必须显式 limit，否则超过 20 个模板会被静默截断
  const result = await collection("travel_templates").where({ status: "published" }).limit(MAX_QUERY_LIMIT).get();
  return {
    templates: result.data.map((template) => ({
      id: template.id,
      version: template.version,
      title: template.title || template.name,
      desc: template.desc || template.summary || "",
      coverImageUrl: template.coverImageUrl || "",
      durationDays: template.durationDays || (template.days || []).length,
      destinationLabels: template.destinationLabels || [],
      audienceLabels: template.audienceLabels || [],
      seasonLabels: template.seasonLabels || [],
      updatedAt: template.updatedAt || template.createdAt,
      previewUrl: template.previewUrl || ""
    }))
  };
};

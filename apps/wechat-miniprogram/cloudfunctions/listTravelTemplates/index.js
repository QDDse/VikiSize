const { collection } = require("../_shared/cloud");

exports.main = async () => {
  const result = await collection("travel_templates").where({ status: "published" }).get();
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

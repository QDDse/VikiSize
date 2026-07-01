const registry = require("../data/travelTemplateRegistry");

const ALLOWED_PREVIEW_HOSTS = ["qddse.github.io"];

function summarize(template) {
  const nodes = template.days.flatMap((day) => day.nodes || []);
  return {
    id: template.id,
    version: template.version,
    title: template.title,
    desc: template.desc,
    coverImageUrl: template.coverImageUrl,
    durationDays: template.durationDays,
    destinationLabels: template.destinationLabels,
    audienceLabels: template.audienceLabels,
    seasonLabels: template.seasonLabels,
    updatedAt: template.updatedAt,
    previewAvailable: isAllowedPreviewUrl(template.previewUrl),
    previewUrl: template.previewUrl,
    dayThemes: template.days.map((day) => ({ id: day.id, order: day.order, date: day.date, theme: day.theme })),
    estimatedBudget: (template.budgetCategories || []).reduce((sum, item) => sum + Number(item.estimatedCost || 0), 0),
    placeCount: nodes.length,
    bookingCount: nodes.filter((node) => node.needsBooking).length,
    disclaimer: template.disclaimer
  };
}

function isAllowedPreviewUrl(value) {
  const match = /^https:\/\/([^/]+)(?:\/|$)/.exec(value || "");
  return Boolean(match && ALLOWED_PREVIEW_HOSTS.includes(match[1].toLowerCase()));
}

function listTravelTemplates() {
  return registry.listPublished().map(summarize);
}

function getTravelTemplate(id, version) {
  return registry.getById(id, version);
}

function getTravelTemplateSummary(id, version) {
  const template = getTravelTemplate(id, version);
  return template ? summarize(template) : null;
}

function getSafePreviewUrl(id, version) {
  const summary = getTravelTemplateSummary(id, version);
  return summary && summary.previewAvailable ? summary.previewUrl : "";
}

module.exports = {
  getSafePreviewUrl,
  getTravelTemplate,
  getTravelTemplateSummary,
  isAllowedPreviewUrl,
  listTravelTemplates
};

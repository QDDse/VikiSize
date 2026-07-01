const { templates } = require("./generatedTravelTemplates");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function resolveTemplate(id, version) {
  return templates.find((template) => {
    const matchesId = template.id === id || (template.aliases || []).includes(id);
    return matchesId && (!version || template.version === version);
  });
}

function listPublished() {
  return templates.filter((template) => template.status === "published").map((template) => clone(template));
}

function getById(id, version) {
  const template = resolveTemplate(id, version);
  return template ? clone(template) : null;
}

module.exports = { getById, listPublished };

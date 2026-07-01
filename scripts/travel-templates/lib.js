const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const templatesDir = path.join(root, "apps/wechat-miniprogram/data/travel-templates");

function listTemplateFiles() {
  return fs.readdirSync(templatesDir)
    .filter((name) => name.endsWith(".json") && name !== "schema.json")
    .map((name) => path.join(templatesDir, name));
}

function readTemplates() {
  return listTemplateFiles().map((filePath) => JSON.parse(fs.readFileSync(filePath, "utf8")));
}

function collectIds(value, ids = new Map(), location = "template") {
  if (!value || typeof value !== "object") return ids;
  if (!Array.isArray(value) && typeof value.id === "string") {
    if (ids.has(value.id)) throw new Error(`Duplicate id ${value.id}: ${ids.get(value.id)} and ${location}`);
    ids.set(value.id, location);
  }
  Object.entries(value).forEach(([key, child]) => collectIds(child, ids, `${location}.${key}`));
  return ids;
}

function validateTemplate(template) {
  const errors = [];
  const required = ["schemaVersion", "id", "version", "title", "desc", "status", "startDate", "durationDays", "updatedAt", "days"];
  required.forEach((field) => {
    if (template[field] === undefined || template[field] === "") errors.push(`Missing ${field}`);
  });
  if (!Array.isArray(template.days) || template.days.length !== template.durationDays) errors.push("durationDays must match days.length");
  try { collectIds(template); } catch (error) { errors.push(error.message); }
  let previousDate = "";
  (template.days || []).forEach((day, dayIndex) => {
    if (day.order !== dayIndex + 1) errors.push(`${day.id}: invalid day order`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date)) errors.push(`${day.id}: invalid date`);
    if (previousDate && day.date < previousDate) errors.push(`${day.id}: dates out of order`);
    previousDate = day.date;
    (day.nodes || []).forEach((node, nodeIndex) => {
      if (node.order !== nodeIndex + 1) errors.push(`${node.id}: invalid node order`);
      if (node.startTime && node.endTime && node.startTime >= node.endTime) errors.push(`${node.id}: startTime must be before endTime`);
      if (node.coordinate) {
        const { latitude, longitude, system } = node.coordinate;
        if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) errors.push(`${node.id}: invalid latitude`);
        if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) errors.push(`${node.id}: invalid longitude`);
        if (!["wgs84", "gcj02"].includes(system)) errors.push(`${node.id}: invalid coordinate system`);
      }
      if (node.needsBooking && (!Number.isInteger(node.leadDays) || node.leadDays < 0)) errors.push(`${node.id}: invalid leadDays`);
      if (node.photoUrl && !node.photoUrl.startsWith("https://")) errors.push(`${node.id}: photoUrl must use HTTPS`);
    });
  });
  (template.sources || []).forEach((source) => {
    if (!source.url.startsWith("https://")) errors.push(`${source.id}: source URL must use HTTPS`);
  });
  return errors;
}

module.exports = { root, readTemplates, validateTemplate };

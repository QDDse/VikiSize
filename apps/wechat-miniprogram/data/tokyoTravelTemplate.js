const registry = require("./travelTemplateRegistry");

// Compatibility export for existing callers. The generated registry is authoritative.
const tokyoTravelTemplate = registry.getById("tokyo-kanto-8d", "1.0.0");

module.exports = { tokyoTravelTemplate };

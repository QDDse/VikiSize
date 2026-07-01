const assert = require("assert");
const service = require("../apps/wechat-miniprogram/services/travelTemplateService");

const templates = service.listTravelTemplates();
assert.strictEqual(templates.length, 1);
assert.strictEqual(templates[0].id, "tokyo-kanto-8d");
assert.ok(templates[0].desc.includes("东京"));
assert.strictEqual(templates[0].durationDays, 8);
assert.strictEqual(templates[0].dayThemes.length, 8);
assert.strictEqual(Object.prototype.hasOwnProperty.call(templates[0], "days"), false);
assert.strictEqual(service.isAllowedPreviewUrl("https://qddse.github.io/VikiSize/"), true);
assert.strictEqual(service.isAllowedPreviewUrl("https://evil.example.com/"), false);
assert.strictEqual(service.isAllowedPreviewUrl("javascript:alert(1)"), false);
assert.ok(service.getSafePreviewUrl("tokyo-kanto-8d", "1.0.0"));

console.log("Travel template browse tests passed.");

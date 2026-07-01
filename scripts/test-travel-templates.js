const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { readTemplates, root, validateTemplate } = require("./travel-templates/lib");

const templates = readTemplates();
assert.strictEqual(templates.length, 1);

const template = templates[0];
assert.deepStrictEqual(validateTemplate(template), []);
assert.strictEqual(template.id, "tokyo-kanto-8d");
assert.strictEqual(template.version, "1.0.0");
assert.strictEqual(template.days.length, 8);
assert.ok(template.days.every((day) => day.nodes.length >= 3));
assert.ok(template.days.flatMap((day) => day.nodes).every((node) => node.id && node.order));

const registry = require("../apps/wechat-miniprogram/data/travelTemplateRegistry");
const canonical = registry.getById("tokyo-kanto-8d", "1.0.0");
const alias = registry.getById("template-travel-tokyo-8d-v1");
assert.strictEqual(canonical.id, template.id);
assert.strictEqual(alias.id, template.id);
canonical.title = "modified";
assert.strictEqual(registry.getById(template.id).title, template.title);

const previewPath = path.join(root, "generated/travel-previews/tokyo-kanto-8d/1.0.0/index.html");
assert.ok(fs.existsSync(previewPath));
const preview = fs.readFileSync(previewPath, "utf8");
assert.ok(preview.includes("关东东京 8 天旅行计划"));
assert.ok(preview.includes('"templateId":"tokyo-kanto-8d"'));
assert.ok(!preview.includes("__TRIP_DATA__"));

console.log("Travel template tests passed.");

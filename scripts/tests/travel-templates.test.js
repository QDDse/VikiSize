// 模板数据与构建产物测试：由 scripts/test-travel-templates.js 迁移到 node:test。
// H5 预览是构建产物（不进 git），npm test 前由 pretest 生成。
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { readTemplates, root, validateTemplate } = require("../travel-templates/lib");

const templates = readTemplates();
const template = templates[0];

test("模板 JSON 通过 schema 校验", () => {
  assert.strictEqual(templates.length, 1);
  assert.deepStrictEqual(validateTemplate(template), []);
  assert.strictEqual(template.id, "tokyo-kanto-8d");
  assert.strictEqual(template.version, "1.0.0");
  assert.strictEqual(template.days.length, 8);
  assert.ok(template.days.every((day) => day.nodes.length >= 3));
  assert.ok(template.days.flatMap((day) => day.nodes).every((node) => node.id && node.order));
});

test("注册表按 id 与别名解析，且返回副本", () => {
  const registry = require("../../apps/wechat-miniprogram/data/travelTemplateRegistry");
  const canonical = registry.getById("tokyo-kanto-8d", "1.0.0");
  const alias = registry.getById("template-travel-tokyo-8d-v1");
  assert.strictEqual(canonical.id, template.id);
  assert.strictEqual(alias.id, template.id);
  canonical.title = "modified";
  assert.strictEqual(registry.getById(template.id).title, template.title);
});

test("H5 预览构建产物内容完整", () => {
  const previewPath = path.join(root, "generated/travel-previews/tokyo-kanto-8d/1.0.0/index.html");
  assert.ok(fs.existsSync(previewPath), "先运行 npm run build:travel-previews");
  const preview = fs.readFileSync(previewPath, "utf8");
  assert.ok(preview.includes("关东东京 8 天旅行计划"));
  assert.ok(preview.includes('"templateId":"tokyo-kanto-8d"'));
  assert.ok(!preview.includes("__TRIP_DATA__"));
});

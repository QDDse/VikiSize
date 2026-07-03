// 模板浏览服务测试：由 scripts/test-travel-template-browse.js 迁移到 node:test。
const test = require("node:test");
const assert = require("node:assert");
const service = require("../../apps/wechat-miniprogram/services/travelTemplateService");

test("模板列表返回摘要而不是全量数据", () => {
  const templates = service.listTravelTemplates();
  assert.strictEqual(templates.length, 1);
  assert.strictEqual(templates[0].id, "tokyo-kanto-8d");
  assert.ok(templates[0].desc.includes("东京"));
  assert.strictEqual(templates[0].durationDays, 8);
  assert.strictEqual(templates[0].dayThemes.length, 8);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(templates[0], "days"), false);
});

test("预览 URL 白名单：拒绝外域和 javascript: 协议", () => {
  assert.strictEqual(service.isAllowedPreviewUrl("https://qddse.github.io/VikiSize/"), true);
  assert.strictEqual(service.isAllowedPreviewUrl("https://evil.example.com/"), false);
  assert.strictEqual(service.isAllowedPreviewUrl("javascript:alert(1)"), false);
  assert.ok(service.getSafePreviewUrl("tokyo-kanto-8d", "1.0.0"));
});

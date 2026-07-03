// 地图与今日执行测试：由 scripts/test-travel-map-today.js 迁移到 node:test。
const test = require("node:test");
const assert = require("node:assert");
const { buildMapViewModel, toMiniProgramCoordinate } = require("../../apps/wechat-miniprogram/services/mapAdapter");
const { resolveExecutionState, resolveTravelDay } = require("../../apps/wechat-miniprogram/services/travelExecution");
const template = require("../../apps/wechat-miniprogram/data/travelTemplateRegistry").getById("tokyo-kanto-8d", "1.0.0");

test("坐标适配：WGS84 直通与非法输入拒绝", () => {
  const tokyo = toMiniProgramCoordinate({ latitude: 35.6812, longitude: 139.7671, system: "wgs84" });
  assert.deepStrictEqual(tokyo, { latitude: 35.6812, longitude: 139.7671 });
  assert.strictEqual(toMiniProgramCoordinate({ latitude: "bad", longitude: 10 }), null);
});

test("地图视图与时间线同源", () => {
  const map = buildMapViewModel(template.days[0]);
  const nodesWithCoordinate = template.days[0].nodes.filter((node) => node.coordinate);
  assert.strictEqual(map.markers.length, nodesWithCoordinate.length);
  assert.deepStrictEqual(map.markers.map((item) => item.nodeId), nodesWithCoordinate.map((node) => node.id));
});

test("旅行状态按时区解析：行前/行中/行后/已归档", () => {
  const instance = { timezone: "Asia/Tokyo", days: template.days, archivedAt: null };
  assert.strictEqual(resolveTravelDay(instance, new Date("2026-09-20T00:00:00Z")).travelState, "before");
  assert.strictEqual(resolveTravelDay(instance, new Date("2026-09-24T03:00:00Z")).travelState, "during");
  assert.strictEqual(resolveTravelDay(instance, new Date("2026-10-10T00:00:00Z")).travelState, "after");
  assert.strictEqual(resolveTravelDay(Object.assign({}, instance, { archivedAt: "2026-01-01" }), new Date()).travelState, "none");
});

test("今日执行：当前节点与下一节点", () => {
  const execution = resolveExecutionState({
    nodes: [
      { id: "a", startTime: "09:00", endTime: "10:00", status: "planned" },
      { id: "b", startTime: "11:00", endTime: "", status: "planned" }
    ]
  }, new Date("2026-09-24T00:30:00Z"), "Asia/Tokyo");
  assert.strictEqual(execution.currentNode.id, "a");
  assert.strictEqual(execution.nextNode.id, "b");
});

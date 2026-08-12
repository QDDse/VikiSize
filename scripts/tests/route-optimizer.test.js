const test = require("node:test");
const assert = require("node:assert");
const { distanceKm, optimizeRoute, routeDistanceKm } = require("../../apps/wechat-miniprogram/services/routeOptimizer");

function node(id, latitude, longitude) {
  return { id, coordinate: { latitude, longitude, system: "wgs84" } };
}

test("路线距离使用地球曲面距离", () => {
  const distance = distanceKm(node("tokyo", 35.6812, 139.7671), node("ueno", 35.7138, 139.7773));
  assert.ok(distance > 3 && distance < 5);
});

test("路线整理保留起点并缩短直线距离", () => {
  const nodes = [
    node("start", 35.6812, 139.7671),
    node("far", 35.7101, 139.8107),
    node("near", 35.6896, 139.7006),
    node("middle", 35.6938, 139.7034)
  ];
  const result = optimizeRoute(nodes);
  assert.strictEqual(result.orderedIds[0], "start");
  assert.ok(result.afterKm <= result.beforeKm);
  assert.ok(routeDistanceKm(nodes) >= result.afterKm);
});

test("坐标不完整时不擅自重排行程", () => {
  const nodes = [node("a", 35.6, 139.7), { id: "b", coordinate: null }, node("c", 35.7, 139.8)];
  const result = optimizeRoute(nodes);
  assert.deepStrictEqual(result.orderedIds, ["a", "b", "c"]);
  assert.strictEqual(result.missingCoordinateCount, 1);
  assert.strictEqual(result.changed, false);
});

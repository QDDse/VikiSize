function outsideChina(latitude, longitude) { return longitude < 72.004 || longitude > 137.8347 || latitude < 0.8293 || latitude > 55.8271; }
function transformLatitude(x, y) { let value = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x)); value += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3; value += (20 * Math.sin(y * Math.PI) + 40 * Math.sin(y / 3 * Math.PI)) * 2 / 3; return value; }
function transformLongitude(x, y) { let value = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x)); value += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3; value += (20 * Math.sin(x * Math.PI) + 40 * Math.sin(x / 3 * Math.PI)) * 2 / 3; return value; }
function wgs84ToGcj02(latitude, longitude) {
  if (outsideChina(latitude, longitude)) return { latitude, longitude };
  const a = 6378245; const ee = 0.006693421622965943; let dLat = transformLatitude(longitude - 105, latitude - 35); let dLng = transformLongitude(longitude - 105, latitude - 35); const radLat = latitude / 180 * Math.PI; let magic = Math.sin(radLat); magic = 1 - ee * magic * magic; const sqrtMagic = Math.sqrt(magic); dLat = (dLat * 180) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI); dLng = (dLng * 180) / (a / sqrtMagic * Math.cos(radLat) * Math.PI); return { latitude: latitude + dLat, longitude: longitude + dLng };
}
function toMiniProgramCoordinate(coordinate) {
  if (!coordinate || !Number.isFinite(Number(coordinate.latitude)) || !Number.isFinite(Number(coordinate.longitude))) return null;
  const value = { latitude: Number(coordinate.latitude), longitude: Number(coordinate.longitude) };
  if (coordinate.system === "gcj02") return value;
  if (!coordinate.system || coordinate.system === "wgs84") return wgs84ToGcj02(value.latitude, value.longitude);
  return null;
}
function buildMapViewModel(day, activeNodeId) {
  const markers = (day && day.nodes || []).map((node) => ({ node, coordinate: toMiniProgramCoordinate(node.coordinate) })).filter((item) => item.coordinate).map((item, index) => ({ id: index + 1, nodeId: item.node.id, latitude: item.coordinate.latitude, longitude: item.coordinate.longitude, title: item.node.title, label: { content: String(index + 1), color: "#ffffff", bgColor: "#2f7dff", borderRadius: 10, padding: 4 }, width: 24, height: 24 }));
  const first = markers[0];
  return { latitude: first ? first.latitude : 35.6812, longitude: first ? first.longitude : 139.7671, scale: markers.length ? 11 : 9, markers, polyline: markers.length > 1 ? [{ points: markers.map(({ latitude, longitude }) => ({ latitude, longitude })), color: "#2f7dff", width: 4, dottedLine: true }] : [], activeNodeId: activeNodeId || "" };
}
module.exports = { buildMapViewModel, toMiniProgramCoordinate };

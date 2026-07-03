const { collection, now } = require("./cloud");
const { assertOwner, assertPermission } = require("./permissions");

function id(prefix) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
function pick(source, fields) { return fields.reduce((out, field) => { if (source[field] !== undefined) out[field] = source[field]; return out; }, {}); }
async function load(instanceId, profile, ownerOnly) {
  const result = await collection("travel_plan_instances").doc(instanceId).get();
  const instance = result.data;
  if (!instance) throw new Error("旅行实例不存在");
  const auth = ownerOnly ? await assertOwner(instance.spaceId, profile || {}) : await assertPermission(instance.spaceId, profile || {});
  return { instance, auth };
}
async function save(instanceId, instance, auth, type, summary) {
  instance.updatedAt = now(); instance.revision = Number(instance.revision || 0) + 1;
  await collection("travel_plan_instances").doc(instanceId).set({ data: instance });
  await collection("activities").add({ data: { id: id("activity"), spaceId: instance.spaceId, cardId: "", actorUserId: auth.user.id, type, summary, createdAt: now() } });
  return { instance };
}
function normalizeNode(input, order, userId) {
  const timestamp = now();
  return Object.assign({ id: id("travel-node"), order, type: "place", period: "", startTime: "", endTime: "", title: "未命名行程", locationName: "", address: "", coordinate: null, photoUrl: "", transport: { mode: "", fare: "", duration: "" }, needsBooking: false, leadDays: 0, estimatedCost: 0, notes: "", status: "planned", sensitiveFields: { confirmationCode: "", internalBudgetNote: "", documentAttachmentIds: [] }, attachmentIds: [], linkedCardIds: [], revision: 1, createdBy: userId, updatedBy: userId, createdAt: timestamp, updatedAt: timestamp }, input, { order });
}

async function handle(operation, event) {
  const { instance, auth } = await load(event.instanceId, event.profile, operation === "archiveTravelInstance");
  if (event.expectedRevision !== undefined && Number(event.expectedRevision) !== Number(instance.revision || 1)) { const error = new Error("内容已被其他成员更新，请刷新后重试"); error.code = "CONFLICT"; throw error; }
  instance.days = instance.days || []; instance.candidatePlaces = instance.candidatePlaces || []; instance.modules = instance.modules || [];
  const input = event.input || event;
  let result;
  if (operation === "createTravelDay") { if (instance.days.some((d) => d.date === input.date)) throw new Error("该日期已存在"); result = { id: id("travel-day"), order: instance.days.length + 1, date: input.date, weekday: input.weekday || "", theme: input.theme || "新的一天", tips: [], alternatives: [], nodes: [], dining: [] }; instance.days.push(result); }
  else if (operation === "updateTravelDay") { result = instance.days.find((d) => d.id === input.dayId); if (!result) throw new Error("旅行日期不存在"); Object.assign(result, pick(input, ["date", "weekday", "theme"])); }
  else if (operation === "deleteTravelDay") { const i = instance.days.findIndex((d) => d.id === input.dayId); if (i < 0) throw new Error("旅行日期不存在"); if ((instance.days[i].nodes || []).length) throw new Error("请先清空当天行程"); result = instance.days.splice(i, 1)[0]; }
  else if (operation === "reorderTravelDays") { const map = new Map(instance.days.map((d) => [d.id, d])); if ((input.orderedIds || []).length !== instance.days.length || input.orderedIds.some((value) => !map.has(value))) throw new Error("日期排序数据无效"); instance.days = input.orderedIds.map((value, i) => Object.assign(map.get(value), { order: i + 1 })); result = instance.days; }
  else if (["createTravelNode", "updateTravelNode", "deleteTravelNode", "duplicateTravelNode", "reorderTravelNodes"].includes(operation)) { const day = instance.days.find((d) => d.id === input.dayId); if (!day) throw new Error("旅行日期不存在"); day.nodes = day.nodes || []; if (operation === "createTravelNode") { result = normalizeNode(pick(input, ["type", "period", "startTime", "endTime", "title", "locationName", "address", "coordinate", "photoUrl", "transport", "needsBooking", "leadDays", "estimatedCost", "notes", "status", "sensitiveFields"]), day.nodes.length + 1, auth.user.id); day.nodes.push(result); } else { const index = day.nodes.findIndex((n) => n.id === input.nodeId); if (index < 0 && operation !== "reorderTravelNodes") throw new Error("行程节点不存在"); if (operation === "updateTravelNode") { result = day.nodes[index]; Object.assign(result, pick(input, ["type", "period", "startTime", "endTime", "title", "locationName", "address", "coordinate", "photoUrl", "transport", "needsBooking", "leadDays", "estimatedCost", "notes", "status", "sensitiveFields"]), { updatedBy: auth.user.id, updatedAt: now() }); } if (operation === "deleteTravelNode") result = day.nodes.splice(index, 1)[0]; if (operation === "duplicateTravelNode") { result = normalizeNode(Object.assign({}, day.nodes[index], { id: id("travel-node"), title: `${day.nodes[index].title}（副本）`, attachmentIds: [], linkedCardIds: [] }), day.nodes.length + 1, auth.user.id); day.nodes.push(result); } if (operation === "reorderTravelNodes") { const map = new Map(day.nodes.map((n) => [n.id, n])); if ((input.orderedIds || []).length !== day.nodes.length || input.orderedIds.some((value) => !map.has(value))) throw new Error("行程排序数据无效"); day.nodes = input.orderedIds.map((value, i) => Object.assign(map.get(value), { order: i + 1 })); result = day.nodes; } } }
  else if (operation === "upsertTravelCandidate") { result = input.id ? instance.candidatePlaces.find((c) => c.id === input.id) : null; if (!result) { result = Object.assign({ id: id("travel-candidate"), scheduledDayId: null, scheduledNodeId: null, createdBy: auth.user.id, createdAt: now() }, pick(input, ["title", "locationName", "address", "coordinate", "category", "photoUrl", "notes", "sourceUrl"])); instance.candidatePlaces.push(result); } else Object.assign(result, pick(input, ["title", "locationName", "address", "coordinate", "category", "photoUrl", "notes", "sourceUrl"])); result.updatedAt = now(); }
  else if (operation === "scheduleTravelCandidate") { const candidate = instance.candidatePlaces.find((c) => c.id === input.candidateId); const day = instance.days.find((d) => d.id === input.dayId); if (!candidate || !day) throw new Error("候选地点或日期不存在"); if (candidate.scheduledNodeId) throw new Error("该地点已安排"); result = normalizeNode({ title: candidate.title, locationName: candidate.locationName, address: candidate.address, coordinate: candidate.coordinate, photoUrl: candidate.photoUrl, notes: candidate.notes, sourceCandidateId: candidate.id }, day.nodes.length + 1, auth.user.id); day.nodes.push(result); candidate.scheduledDayId = day.id; candidate.scheduledNodeId = result.id; }
  else if (operation === "unscheduleTravelCandidate") { result = instance.candidatePlaces.find((c) => c.id === input.candidateId); if (!result) throw new Error("候选地点不存在"); const day = instance.days.find((d) => d.id === result.scheduledDayId); if (day) { const node = day.nodes.find((n) => n.id === result.scheduledNodeId); if (node && ((node.attachmentIds || []).length || (node.linkedCardIds || []).length)) throw new Error("该行程已有附件或任务，暂不能撤回"); day.nodes = day.nodes.filter((n) => n.id !== result.scheduledNodeId); } result.scheduledDayId = null; result.scheduledNodeId = null; }
  else if (operation === "upsertTravelModule") { result = input.id ? instance.modules.find((m) => m.id === input.id) : null; if (!result) { result = { id: id("travel-module"), createdBy: auth.user.id, createdAt: now() }; instance.modules.push(result); } Object.assign(result, pick(input, ["type", "title", "content", "dayId", "order"]), { updatedAt: now() }); }
  else if (operation === "deleteTravelModule") { const index = instance.modules.findIndex((m) => m.id === input.moduleId); if (index < 0) throw new Error("旅行模块不存在"); result = instance.modules.splice(index, 1)[0]; }
  else if (operation === "archiveTravelInstance") { instance.archivedAt = input.archived ? now() : null; instance.status = input.archived ? "archived" : "planning"; if (input.archived) await collection("spaces").doc(instance.spaceId).update({ data: { currentTemplateInstanceId: "", updatedAt: now() } }); result = instance; }
  else throw new Error("不支持的旅行编辑操作");
  instance.days.forEach((day, i) => { day.order = i + 1; (day.nodes || []).forEach((node, j) => { node.order = j + 1; }); });
  instance.startDate = instance.days[0] ? instance.days[0].date : ""; instance.endDate = instance.days.length ? instance.days[instance.days.length - 1].date : "";
  const labels = { createTravelDay: "新增了旅行日期", updateTravelDay: "更新了旅行日期", deleteTravelDay: "删除了旅行日期", reorderTravelDays: "调整了旅行日期顺序", createTravelNode: "新增了行程节点", updateTravelNode: "更新了行程节点", deleteTravelNode: "删除了行程节点", duplicateTravelNode: "复制了行程节点", reorderTravelNodes: "调整了行程顺序", upsertTravelCandidate: "更新了候选地点", scheduleTravelCandidate: "安排了候选地点", unscheduleTravelCandidate: "撤回了候选地点", upsertTravelModule: "更新了旅行模块", deleteTravelModule: "删除了旅行模块", archiveTravelInstance: input.archived ? "归档了旅行计划" : "恢复了旅行计划" };
  await save(event.instanceId, instance, auth, operation, labels[operation]);
  return { result, instance };
}
module.exports = { handle };

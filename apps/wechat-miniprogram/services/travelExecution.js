function dateInTimezone(date, timezone) { try { return new Intl.DateTimeFormat("en-CA", { timeZone: timezone || "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(date).replace(/\//g, "-"); } catch (error) { return date.toISOString().slice(0, 10); } }
function minutesInTimezone(date, timezone) { try { const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone || "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date); const values = Object.fromEntries(parts.map((part) => [part.type, part.value])); return Number(values.hour) * 60 + Number(values.minute); } catch (error) { return date.getHours() * 60 + date.getMinutes(); } }
function timeMinutes(value) { if (!/^\d{2}:\d{2}$/.test(value || "")) return null; const [hour, minute] = value.split(":").map(Number); return hour * 60 + minute; }
function resolveTravelDay(instance, currentTime) {
  if (!instance || instance.archivedAt || !instance.days || !instance.days.length) return { travelState: "none", day: null, daysUntilStart: null };
  const today = dateInTimezone(currentTime || new Date(), instance.timezone);
  const exact = instance.days.find((day) => day.date === today);
  if (exact) return { travelState: "during", day: exact, daysUntilStart: 0 };
  if (today < instance.days[0].date) return { travelState: "before", day: instance.days[0], daysUntilStart: Math.ceil((new Date(`${instance.days[0].date}T00:00:00Z`) - new Date(`${today}T00:00:00Z`)) / 86400000) };
  return { travelState: "after", day: instance.days[instance.days.length - 1], daysUntilStart: null };
}
function resolveExecutionState(day, currentTime, timezone) {
  const nowMinutes = minutesInTimezone(currentTime || new Date(), timezone); const scheduled = (day && day.nodes || []).filter((node) => node.status !== "cancelled" && timeMinutes(node.startTime) !== null); let currentNode = null; let nextNode = null;
  scheduled.forEach((node, index) => { const start = timeMinutes(node.startTime); const explicitEnd = timeMinutes(node.endTime); const nextStart = scheduled[index + 1] ? timeMinutes(scheduled[index + 1].startTime) : 1440; const end = explicitEnd === null ? nextStart : explicitEnd; if (nowMinutes >= start && nowMinutes < end) currentNode = node; if (!nextNode && start > nowMinutes) nextNode = node; });
  return { currentNode, nextNode, completedNodes: scheduled.filter((node) => timeMinutes(node.endTime || node.startTime) <= nowMinutes), upcomingNodes: scheduled.filter((node) => timeMinutes(node.startTime) > nowMinutes), otherNodes: (day && day.nodes || []).filter((node) => timeMinutes(node.startTime) === null && node.status !== "cancelled") };
}
function buildTodayTravelView(instance, currentTime) { const resolved = resolveTravelDay(instance, currentTime || new Date()); const execution = resolved.travelState === "during" ? resolveExecutionState(resolved.day, currentTime || new Date(), instance.timezone) : { currentNode: null, nextNode: resolved.day && resolved.day.nodes ? resolved.day.nodes[0] : null, completedNodes: [], upcomingNodes: [], otherNodes: [] }; return Object.assign({}, resolved, execution); }
module.exports = { buildTodayTravelView, resolveExecutionState, resolveTravelDay };

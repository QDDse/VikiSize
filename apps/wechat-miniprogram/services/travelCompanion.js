const { resolveExecutionState } = require("./travelExecution");

const receiptCategories = ["餐饮", "交通", "住宿", "购物", "其他"];
const phraseCategories = [
  { id: "transport", label: "交通", phrases: [
    { id: "station", chinese: "请问车站在哪里？", japanese: "駅はどこですか。" },
    { id: "train", chinese: "这班车去东京站吗？", japanese: "この電車は東京駅に行きますか。" }
  ] },
  { id: "food", label: "餐饮", phrases: [
    { id: "menu", chinese: "请给我菜单。", japanese: "メニューをお願いします。" },
    { id: "bill", chinese: "请结账。", japanese: "お会計をお願いします。" }
  ] },
  { id: "hotel", label: "住宿", phrases: [
    { id: "checkin", chinese: "我想办理入住。", japanese: "チェックインをお願いします。" },
    { id: "luggage", chinese: "可以寄存行李吗？", japanese: "荷物を預かっていただけますか。" }
  ] },
  { id: "help", label: "求助", phrases: [
    { id: "help", chinese: "请帮帮我。", japanese: "助けてください。" },
    { id: "hospital", chinese: "请叫救护车。", japanese: "救急車を呼んでください。" }
  ] }
];

function normalizeReceipt(input) {
  const date = String(input.date || "");
  const merchant = String(input.merchant || "").trim();
  const amountText = String(input.amount == null ? "" : input.amount).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) throw new Error("请选择有效日期");
  if (!merchant || merchant.length > 80) throw new Error("商家名称需为 1–80 个字");
  if (!/^\d+$/.test(amountText) || !Number.isSafeInteger(Number(amountText)) || Number(amountText) <= 0 || Number(amountText) > 999999999) throw new Error("请输入 1–999999999 的整数日元金额");
  if (!receiptCategories.includes(input.category)) throw new Error("请选择小票分类");
  return { date, merchant, category: input.category, amount: Number(amountText), currency: "JPY" };
}

function receiptKey(receipt) {
  return JSON.stringify([receipt.date, receipt.merchant.trim().toLowerCase(), receipt.amount]);
}

function summarizeReceipts(receipts, date) {
  const rows = (receipts || []).filter((item) => item.date === date);
  return {
    rows,
    dayTotal: rows.reduce((sum, item) => sum + item.amount, 0),
    tripTotal: (receipts || []).reduce((sum, item) => sum + item.amount, 0),
    count: (receipts || []).length,
    categories: receiptCategories.map((name) => ({ name, amount: rows.filter((item) => item.category === name).reduce((sum, item) => sum + item.amount, 0) }))
  };
}

function dateInZone(now, timezone) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone || "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch (error) { return now.toISOString().slice(0, 10); }
}

function nodeDetails(node) {
  if (!node) return null;
  const minutes = (time) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time || "") ? Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) : null;
  const start = minutes(node.startTime);
  const end = minutes(node.endTime);
  return Object.assign({}, node, {
    displayTime: node.startTime || node.time || "时间待定",
    stay: start !== null && end !== null && end > start ? `约 ${end - start} 分钟` : "待补充停留时间",
    transportText: node.transport && node.transport.mode || node.route || "交通方式待补充",
    transportDuration: node.transport && node.transport.duration || "",
    tip: node.notes || node.review || "暂无临场提示，出发前请确认营业时间与交通。"
  });
}

function dayOverview(day, today, now, timezone) {
  if (!day) return { label: "暂无日期", current: null, next: null };
  if (day.date === today) {
    const execution = resolveExecutionState(day, now, timezone);
    return { label: "今日", current: nodeDetails(execution.currentNode), next: nodeDetails(execution.nextNode) };
  }
  return { label: day.date < today ? "行程回顾" : "行程预告", current: null, next: nodeDetails((day.nodes || []).find((node) => node.status !== "cancelled")) };
}

// 演示模型只返回新对象；不写入 localStore，也不覆盖节点时间。
function delayPreview(day, minutes) {
  if (![15, 30, 60].includes(minutes)) throw new Error("请选择演示延误时长");
  return (day && day.nodes || []).filter((node) => node.status !== "cancelled").map((node) => {
    const time = node.startTime || "";
    let shifted = "时间待定";
    if (/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      const total = Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) + minutes;
      shifted = `${total >= 1440 ? "次日 " : ""}${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
    }
    return { id: node.id, title: node.title, original: time || node.time || "时间待定", shifted };
  });
}

module.exports = { receiptCategories, phraseCategories, normalizeReceipt, receiptKey, summarizeReceipts, dateInZone, nodeDetails, dayOverview, delayPreview };

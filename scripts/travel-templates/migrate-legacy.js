const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const htmlPath = path.join(root, "关东东京8天旅行计划.html");
const outputDir = path.join(root, "apps/wechat-miniprogram/data/travel-templates");
const outputPath = path.join(outputDir, "tokyo-kanto-8d.v1.json");
const templatePath = path.join(__dirname, "travel-preview-template.html");

function extractObjectLiteral(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Missing marker: ${marker}`);
  const start = source.indexOf("{", markerIndex);
  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return { literal: source.slice(start, index + 1), start, end: index + 1 };
    }
  }
  throw new Error("Unterminated trip object");
}

function splitTime(value) {
  const parts = String(value || "").split("-").map((item) => item.trim());
  return { startTime: parts[0] || "", endTime: parts[1] || "" };
}

function inferType(slot) {
  const text = `${slot.name} ${slot.transport && slot.transport.mode || ""}`;
  if (/机场|抵达|出发至|返程/.test(text)) return "transport";
  if (/酒店|住宿/.test(text)) return "hotel";
  return "place";
}

function inferReminderType(item) {
  if (/确认|抢|预约/.test(item)) return "needs_confirmation";
  if (/预订|购买/.test(item)) return "assigned_to_me";
  return "due_soon";
}

function canonicalize(legacy, seed) {
  const sources = [
    { id: "jma-climate", title: "日本气象厅：日本气候概况", url: "https://www.data.jma.go.jp/cpd/longfcst/en/tourist.html" },
    { id: "jr-east-nex", title: "JR East：Narita Express", url: "https://www.jreast.co.jp/en/multi/nex/" },
    { id: "tokyo-skytree", title: "东京晴空塔官方票务", url: "https://www.tokyo-skytree.jp/en/ticket/" },
    { id: "teamlab-planets", title: "teamLab Planets 官方页面", url: "https://www.teamlab.art/e/planets/" },
    { id: "ghibli-tickets", title: "三鹰之森吉卜力美术馆票务", url: "https://www.ghibli-museum.jp/en/tickets/" },
    { id: "tokyo-disney-tickets", title: "东京迪士尼度假区票务", url: "https://www.tokyodisneyresort.jp/en/ticket/" }
  ];

  return {
    schemaVersion: 1,
    id: "tokyo-kanto-8d",
    aliases: ["template-travel-tokyo-8d-v1"],
    version: "1.0.0",
    sourceName: "关东东京8天旅行计划.html",
    title: legacy.title,
    desc: "给两个人安排的东京进出方案，覆盖市区经典、台场夜景、镰仓海边、箱根温泉与迪士尼海洋；户外尽量安排在上午和傍晚。",
    status: "published",
    coverImageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Tokyo%20Tower%20and%20around%20Skyscrapers.jpg?width=1600",
    previewUrl: "https://qddse.github.io/VikiSize/",
    startDate: legacy.startDate,
    durationDays: legacy.days.length,
    destinationLabels: ["东京", "镰仓", "箱根"],
    audienceLabels: ["双人", "首次东京", "轻松节奏"],
    seasonLabels: ["9 月下旬"],
    colorScheme: legacy.colorScheme,
    updatedAt: "2026-07-01T00:00:00.000Z",
    preTrip: legacy.preTrip,
    flights: {
      booked: legacy.flights.booked.map((item, index) => ({ id: `flight-booked-${index + 1}`, ...item })),
      candidates: legacy.flights.candidates.map((item, index) => ({ id: `flight-candidate-${index + 1}`, ...item }))
    },
    hotelAreas: legacy.hotelAreas.map((area, areaIndex) => ({
      id: `hotel-area-${areaIndex + 1}`,
      ...area,
      options: area.options.map((option, optionIndex) => ({ id: `hotel-${areaIndex + 1}-${optionIndex + 1}`, ...option }))
    })),
    reminders: legacy.reminders.map((item, index) => ({
      id: `reminder-${index + 1}`,
      title: item.item,
      item: item.item,
      leadDays: item.leadDays,
      type: inferReminderType(item.item)
    })),
    budgetCategories: seed.budgetCategories,
    taskSeeds: seed.taskSeeds,
    days: legacy.days.map((day, dayIndex) => ({
      id: `day-${String(dayIndex + 1).padStart(2, "0")}`,
      order: dayIndex + 1,
      date: day.date,
      weekday: day.weekday,
      theme: day.theme,
      tips: day.tips || [],
      alternatives: (day.alternatives || []).map((item, index) => ({ id: `day-${dayIndex + 1}-alternative-${index + 1}`, ...item })),
      nodes: day.slots.map((slot, nodeIndex) => {
        const time = splitTime(slot.time);
        return {
          id: `day-${String(dayIndex + 1).padStart(2, "0")}-node-${String(nodeIndex + 1).padStart(2, "0")}`,
          order: nodeIndex + 1,
          type: inferType(slot),
          period: slot.period,
          startTime: time.startTime,
          endTime: time.endTime,
          title: slot.name,
          locationName: slot.name,
          address: "",
          coordinate: Number.isFinite(slot.lat) && Number.isFinite(slot.lng)
            ? { latitude: slot.lat, longitude: slot.lng, system: "wgs84" }
            : null,
          photoUrl: slot.photo || "",
          rating: slot.rating == null ? null : slot.rating,
          review: slot.review || "",
          openingHours: slot.openingHours || "",
          closedDays: slot.closedDays || "",
          ticketPrice: slot.ticketPrice || "",
          transport: slot.transport || { mode: "", fare: "", duration: "" },
          seasonal: slot.seasonal || "",
          needsBooking: Boolean(slot.needsBooking),
          leadDays: slot.needsBooking ? Number(slot.leadDays || 0) : 0,
          estimatedCost: 0,
          notes: "",
          sensitive: false
        };
      }),
      dining: (day.dining || []).map((item, diningIndex) => ({
        id: `day-${dayIndex + 1}-dining-${diningIndex + 1}`,
        ...item,
        dishes: item.dishes.map((dish, dishIndex) => ({ id: `day-${dayIndex + 1}-dish-${diningIndex + 1}-${dishIndex + 1}`, ...dish }))
      }))
    })),
    tips: legacy.tips,
    disclaimer: legacy.disclaimer,
    sources
  };
}

const html = fs.readFileSync(htmlPath, "utf8");
const extracted = extractObjectLiteral(html, "const trip =");
const legacy = Function(`"use strict"; return (${extracted.literal});`)();
const { tokyoTravelTemplate: seed } = require(path.join(root, "apps/wechat-miniprogram/data/tokyoTravelTemplate.js"));
const canonical = canonicalize(legacy, seed);

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(canonical, null, 2)}\n`);
fs.writeFileSync(templatePath, `${html.slice(0, extracted.start)}__TRIP_DATA__${html.slice(extracted.end)}`);
console.log(`Wrote ${path.relative(root, outputPath)}`);
console.log(`Wrote ${path.relative(root, templatePath)}`);

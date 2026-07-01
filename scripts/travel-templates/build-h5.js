const fs = require("fs");
const path = require("path");
const { root, readTemplates, validateTemplate } = require("./lib");

const htmlTemplate = fs.readFileSync(path.join(__dirname, "travel-preview-template.html"), "utf8");

function toLegacyView(template) {
  return {
    title: template.title,
    startDate: template.startDate,
    colorScheme: template.colorScheme,
    preTrip: template.preTrip,
    flights: template.flights,
    hotelAreas: template.hotelAreas,
    disclaimer: template.disclaimer,
    tips: template.tips,
    reminders: template.reminders,
    templateId: template.id,
    templateVersion: template.version,
    updatedAt: template.updatedAt,
    days: template.days.map((day) => ({
      id: day.id,
      date: day.date,
      weekday: day.weekday,
      theme: day.theme,
      tips: day.tips,
      alternatives: day.alternatives,
      slots: day.nodes.map((node) => ({
        id: node.id,
        period: node.period,
        name: node.title,
        time: [node.startTime, node.endTime].filter(Boolean).join("-"),
        lat: node.coordinate && node.coordinate.latitude,
        lng: node.coordinate && node.coordinate.longitude,
        photo: node.photoUrl,
        rating: node.rating,
        review: node.review,
        openingHours: node.openingHours,
        closedDays: node.closedDays,
        ticketPrice: node.ticketPrice,
        transport: node.transport,
        seasonal: node.seasonal,
        needsBooking: node.needsBooking,
        leadDays: node.leadDays
      })),
      dining: day.dining
    }))
  };
}

readTemplates().forEach((template) => {
  const errors = validateTemplate(template);
  if (errors.length) throw new Error(`${template.id}: ${errors.join("; ")}`);
  const outputDir = path.join(root, "generated/travel-previews", template.id, template.version);
  fs.mkdirSync(outputDir, { recursive: true });
  const serialized = JSON.stringify(toLegacyView(template)).replace(/</g, "\\u003c");
  const html = htmlTemplate.replace("__TRIP_DATA__", serialized);
  fs.writeFileSync(path.join(outputDir, "index.html"), html);
  console.log(`Wrote ${path.relative(root, path.join(outputDir, "index.html"))}`);
});

const { readTemplates, validateTemplate } = require("./lib");

let failed = false;
readTemplates().forEach((template) => {
  const errors = validateTemplate(template);
  const nodes = template.days.reduce((sum, day) => sum + day.nodes.length, 0);
  const bookingItems = template.days.reduce((sum, day) => sum + day.nodes.filter((node) => node.needsBooking).length, 0);
  console.log(`${template.id}@${template.version}: ${template.days.length} days, ${nodes} nodes, ${bookingItems} booking items`);
  errors.forEach((error) => console.error(`  - ${error}`));
  failed = failed || errors.length > 0;
});

if (failed) process.exitCode = 1;

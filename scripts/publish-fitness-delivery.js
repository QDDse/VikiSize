const fs = require("fs");
const path = require("path");
const { withFitnessHashes } = require("../apps/wechat-miniprogram/cloudfunctions-shared/fitnessSchema");

function parseArgs(argv) {
  const args = { file: "", dryRun: false };
  argv.forEach((value) => {
    if (value === "--dry-run") args.dryRun = true;
    else if (!args.file) args.file = value;
  });
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file) throw new Error("用法: npm run fitness:publish -- <delivery.json> [--dry-run]");
  const filePath = path.resolve(process.cwd(), args.file);
  const delivery = withFitnessHashes(JSON.parse(fs.readFileSync(filePath, "utf8")));

  if (args.dryRun) {
    console.log(JSON.stringify(delivery, null, 2));
    return;
  }

  const endpoint = process.env.FITNESS_DELIVERY_ENDPOINT;
  const channelId = process.env.FITNESS_CHANNEL_ID;
  const publishToken = process.env.FITNESS_PUBLISH_TOKEN;
  if (!endpoint || !channelId || !publishToken) {
    throw new Error("缺少 FITNESS_DELIVERY_ENDPOINT / FITNESS_CHANNEL_ID / FITNESS_PUBLISH_TOKEN");
  }

  const response = await globalThis.fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channelId, publishToken, delivery })
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Fitness Delivery 发布失败: HTTP ${response.status} ${text.slice(0, 300)}`);
  console.log(`Fitness Delivery 已发布: ${delivery.deliveryId} (${delivery.contentHash})`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = { main, parseArgs };

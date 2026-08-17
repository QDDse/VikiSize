const fs = require("fs");
const path = require("path");

function loadLocalEnv() {
  const envPath = path.resolve(__dirname, "../.env");
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, "utf8").split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  });
}

loadLocalEnv();
const ci = require("miniprogram-ci");
const projectConfig = require("../apps/wechat-miniprogram/project.config.json");

const functionNames = [
  "createFitnessChannel",
  "ingestFitnessDelivery",
  "listFitnessDeliveries",
  "getFitnessDelivery",
  "decideFitnessPlanPatch",
  "importBodyMeasurement",
  "listBodyMeasurements"
];
const appid = process.env.WECHAT_APPID || projectConfig.appid;
const env = process.env.WECHAT_CLOUD_ENV_ID;
const privateKeyFromEnv = process.env.WECHAT_UPLOAD_PRIVATE_KEY;
const privateKeyPath = process.env.WECHAT_PRIVATE_KEY_PATH;

if (!env) throw new Error("Missing WECHAT_CLOUD_ENV_ID.");
if (!privateKeyFromEnv && !privateKeyPath) throw new Error("Missing WECHAT_UPLOAD_PRIVATE_KEY or WECHAT_PRIVATE_KEY_PATH.");

const projectPath = path.resolve(__dirname, "../apps/wechat-miniprogram");
const project = new ci.Project({
  appid,
  type: "miniProgram",
  projectPath,
  privateKey: privateKeyFromEnv ? privateKeyFromEnv.replace(/\\n/g, "\n") : undefined,
  privateKeyPath,
  ignores: ["node_modules/**/*"]
});

async function main() {
  for (const name of functionNames) {
    await ci.cloud.uploadFunction({
      project,
      env,
      name,
      path: path.join(projectPath, "cloudfunctions", name),
      remoteNpmInstall: true
    });
    console.log(`Uploaded cloud function: ${name}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

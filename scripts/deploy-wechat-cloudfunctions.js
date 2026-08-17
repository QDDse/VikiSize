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
const {
  createMissingCloudFunction,
  updateCloudFunctionEnvironment,
  uploadWithCreateFallback
} = require("./lib/wechat-cloudfunction-deploy");

const functionNames = [
  "createFitnessChannel",
  "ingestFitnessDelivery",
  "listFitnessDeliveries",
  "getFitnessDelivery",
  "getFitnessNotificationSettings",
  "decideFitnessPlanPatch",
  "subscribeFitnessWeeklyReport",
  "importBodyMeasurement",
  "listBodyMeasurements"
];
const functionEnvironment = {
  getFitnessNotificationSettings: {
    FITNESS_WEEKLY_REPORT_TEMPLATE_ID: process.env.FITNESS_WEEKLY_REPORT_TEMPLATE_ID,
    FITNESS_WEEKLY_REPORT_TEMPLATE_BINDINGS: process.env.FITNESS_WEEKLY_REPORT_TEMPLATE_BINDINGS
  },
  subscribeFitnessWeeklyReport: {
    FITNESS_WEEKLY_REPORT_TEMPLATE_ID: process.env.FITNESS_WEEKLY_REPORT_TEMPLATE_ID,
    FITNESS_WEEKLY_REPORT_TEMPLATE_BINDINGS: process.env.FITNESS_WEEKLY_REPORT_TEMPLATE_BINDINGS
  },
  ingestFitnessDelivery: {
    FITNESS_WEEKLY_REPORT_TEMPLATE_ID: process.env.FITNESS_WEEKLY_REPORT_TEMPLATE_ID,
    FITNESS_WEEKLY_REPORT_TEMPLATE_BINDINGS: process.env.FITNESS_WEEKLY_REPORT_TEMPLATE_BINDINGS
  },
  decideFitnessPlanPatch: {
    XUNJI_TRAINING_API_KEY: process.env.XUNJI_TRAINING_API_KEY
  }
};
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
    const uploadOptions = {
      project,
      env,
      name,
      path: path.join(projectPath, "cloudfunctions", name),
      remoteNpmInstall: true
    };
    await uploadWithCreateFallback({
      upload: () => ci.cloud.uploadFunction(uploadOptions),
      create: async () => {
        console.log(`Cloud function does not exist; creating it first: ${name}`);
        await createMissingCloudFunction({
          project,
          env,
          name,
          functionPath: uploadOptions.path,
          remoteNpmInstall: uploadOptions.remoteNpmInstall
        });
      }
    });
    console.log(`Uploaded cloud function: ${name}`);
    const environmentResult = await updateCloudFunctionEnvironment({
      project,
      env,
      name,
      variables: functionEnvironment[name]
    });
    if (environmentResult.updated) console.log(`Updated cloud function environment keys: ${name} (${environmentResult.keys.join(", ")})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

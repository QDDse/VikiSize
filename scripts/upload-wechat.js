const fs = require("fs");
const path = require("path");

function loadLocalEnv() {
  const envPath = path.resolve(__dirname, "../.env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      return;
    }

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadLocalEnv();
let ci;
try {
  ci = require("miniprogram-ci");
} catch (error) {
  if (error && error.code === "MODULE_NOT_FOUND") {
    console.error("Missing dependency: miniprogram-ci. Run `npm install` before `npm run deploy:wechat`.");
    process.exit(1);
  }

  throw error;
}
const pkg = require("../package.json");
const projectConfig = require("../apps/wechat-miniprogram/project.config.json");

const appid = process.env.WECHAT_APPID || projectConfig.appid;
const privateKeyFromEnv = process.env.WECHAT_UPLOAD_PRIVATE_KEY;
const privateKeyPath = process.env.WECHAT_PRIVATE_KEY_PATH;
const version = process.env.WECHAT_VERSION || pkg.version;
const desc = process.env.WECHAT_DESC || `Automated upload ${version}`;
const robot = Number(process.env.WECHAT_ROBOT || 1);

if (!appid || appid === "touristappid") {
  throw new Error("Missing WECHAT_APPID. Set WECHAT_APPID or configure appid in apps/wechat-miniprogram/project.config.json.");
}

if (!privateKeyFromEnv && !privateKeyPath) {
  throw new Error("Missing WECHAT_UPLOAD_PRIVATE_KEY or WECHAT_PRIVATE_KEY_PATH. For local deploy, copy .env.example to .env and fill the code upload private key.");
}

const privateKey = privateKeyFromEnv
  ? privateKeyFromEnv.replace(/\\n/g, "\n")
  : undefined;

const projectPath = path.resolve(__dirname, "../apps/wechat-miniprogram");

const project = new ci.Project({
  appid,
  type: "miniProgram",
  projectPath,
  privateKey,
  privateKeyPath,
  ignores: ["node_modules/**/*"]
});

async function main() {
  await ci.upload({
    project,
    version,
    desc,
    robot,
    setting: {
      es6: true,
      es7: true,
      minify: true,
      autoPrefixWXSS: true
    },
    onProgressUpdate: console.log
  });

  console.log(`Uploaded WeChat Mini Program ${appid} version ${version}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

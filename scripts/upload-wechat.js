const path = require("path");
const ci = require("miniprogram-ci");
const pkg = require("../package.json");

const appid = process.env.WECHAT_APPID;
const privateKeyFromEnv = process.env.WECHAT_UPLOAD_PRIVATE_KEY;
const privateKeyPath = process.env.WECHAT_PRIVATE_KEY_PATH;
const version = process.env.WECHAT_VERSION || pkg.version;
const desc = process.env.WECHAT_DESC || `Automated upload ${version}`;
const robot = Number(process.env.WECHAT_ROBOT || 1);

if (!appid) {
  throw new Error("Missing WECHAT_APPID.");
}

if (!privateKeyFromEnv && !privateKeyPath) {
  throw new Error("Missing WECHAT_UPLOAD_PRIVATE_KEY or WECHAT_PRIVATE_KEY_PATH.");
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

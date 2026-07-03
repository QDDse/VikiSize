// 把云函数共享源码复制进每个函数目录，使函数可以独立打包部署。
// 背景与决策见 docs/adr/0001-cloudfunction-shared-packaging.md。
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sharedDir = path.join(root, "apps/wechat-miniprogram/cloudfunctions-shared");
const functionsDir = path.join(root, "apps/wechat-miniprogram/cloudfunctions");

function main() {
  const sharedFiles = fs.readdirSync(sharedDir).filter((name) => name.endsWith(".js"));
  if (!sharedFiles.length) {
    throw new Error(`共享目录为空：${sharedDir}`);
  }

  const functionNames = fs
    .readdirSync(functionsDir)
    .filter((name) => fs.existsSync(path.join(functionsDir, name, "index.js")));

  for (const name of functionNames) {
    const targetDir = path.join(functionsDir, name, "_shared");
    fs.rmSync(targetDir, { recursive: true, force: true });
    fs.mkdirSync(targetDir, { recursive: true });
    for (const file of sharedFiles) {
      fs.copyFileSync(path.join(sharedDir, file), path.join(targetDir, file));
    }
  }

  console.log(`Copied ${sharedFiles.length} shared modules into ${functionNames.length} cloud functions.`);
}

main();

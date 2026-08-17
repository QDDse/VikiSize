const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "../apps/wechat-miniprogram");
const appJsonPath = path.join(root, "app.json");
const projectConfigPath = path.join(root, "project.config.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function walkFiles(dir, result = []) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, result);
      return;
    }
    result.push(fullPath);
  });
  return result;
}

const appJson = readJson(appJsonPath);
const projectConfig = readJson(projectConfigPath);
const requiredPages = [
  "pages/plans/index",
  "pages/fitness/index",
  "pages/fitness-detail/index",
  "pages/body-import/index",
  "pages/spaces/index",
  "pages/space-settings/index",
  "pages/card-detail/index",
  "pages/travel-plan/index",
  "pages/travel-day-editor/index",
  "pages/travel-node-editor/index",
  "pages/travel-candidates/index",
  "pages/travel-templates/index",
  "pages/travel-template-detail/index",
  "pages/travel-preview/index",
  "pages/invitation/index"
];
const requiredCollections = [
  "users",
  "spaces",
  "space_members",
  "cards",
  "comments",
  "activities",
  "reminders",
  "attachments",
  "member_opinions",
  "travel_templates",
  "travel_plan_instances",
  "invitations",
  "fitness_deliveries",
  "body_measurement_imports"
];

requiredPages.forEach((page) => {
  assert(appJson.pages.includes(page), `app.json missing required page: ${page}`);
  [".js", ".json", ".wxml", ".wxss"].forEach((ext) => {
    assert(fs.existsSync(path.join(root, `${page}${ext}`)), `missing page file: ${page}${ext}`);
  });
});

const tabPages = appJson.tabBar.list.map((item) => item.pagePath);
assert(tabPages.length === 2, "tabBar must have exactly two tabs");
assert(tabPages.join(",") === "pages/plans/index,pages/fitness/index", "tabBar must be 旅行 / 健身");
assert(projectConfig.cloudfunctionRoot === "cloudfunctions/", "project.config.json must set cloudfunctionRoot");

requiredCollections.forEach((collectionName) => {
  const source = fs.readFileSync(path.join(root, "services/localStore.js"), "utf8");
  assert(source.includes(collectionName), `local store missing collection boundary: ${collectionName}`);
});

[
  "login",
  "createSpace",
  "createTravelInstanceFromTemplate",
  "listTravelTemplates",
  "getTravelTemplate",
  "createTravelDay",
  "updateTravelDay",
  "deleteTravelDay",
  "reorderTravelDays",
  "createTravelNode",
  "updateTravelNode",
  "deleteTravelNode",
  "duplicateTravelNode",
  "reorderTravelNodes",
  "upsertTravelCandidate",
  "scheduleTravelCandidate",
  "unscheduleTravelCandidate",
  "upsertTravelModule",
  "deleteTravelModule",
  "archiveTravelInstance",
  "createAttachmentRecord",
  "listAttachmentsForScope",
  "deleteAttachment",
  "createTravelTaskFromNode",
  "createInvitation",
  "acceptInvitation",
  "upsertCard",
  "archiveCard",
  "addComment",
  "setMemberOpinion",
  "scheduleReminder",
  "dispatchReminders",
  "createFitnessChannel",
  "ingestFitnessDelivery",
  "listFitnessDeliveries",
  "getFitnessDelivery",
  "decideFitnessPlanPatch",
  "importBodyMeasurement",
  "listBodyMeasurements"
].forEach((name) => {
  assert(fs.existsSync(path.join(root, "cloudfunctions", name, "index.js")), `missing cloud function: ${name}`);
});

// 每个 pages/ 子目录都必须注册在 app.json，防止死页面再次堆积。
fs.readdirSync(path.join(root, "pages"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .forEach((entry) => {
    assert(
      appJson.pages.includes(`pages/${entry.name}/index`),
      `pages/${entry.name} exists on disk but is not registered in app.json`
    );
  });

// 云函数按目录独立部署：禁止越出函数目录的 require，依赖必须锁版本。
// 共享代码走构建复制，见 docs/adr/0001-cloudfunction-shared-packaging.md。
const cloudfunctionsDir = path.join(root, "cloudfunctions");
fs.readdirSync(cloudfunctionsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .forEach((entry) => {
    const functionDir = path.join(cloudfunctionsDir, entry.name);
    assert(fs.existsSync(path.join(functionDir, "index.js")), `cloud function ${entry.name} missing index.js`);

    const pkgPath = path.join(functionDir, "package.json");
    assert(fs.existsSync(pkgPath), `cloud function ${entry.name} missing package.json`);
    Object.entries(readJson(pkgPath).dependencies || {}).forEach(([dep, version]) => {
      assert(
        version !== "latest" && version !== "*",
        `cloud function ${entry.name} has unpinned dependency: ${dep}@${version}`
      );
    });

    walkFiles(functionDir)
      .filter((filePath) => filePath.endsWith(".js"))
      .forEach((filePath) => {
        const content = fs.readFileSync(filePath, "utf8");
        assert(
          !/require\(\s*["']\.\.\//.test(content),
          `cloud function file escapes its deploy package with require("../"): ${path.relative(root, filePath)}`
        );
      });
  });

appJson.pages.flatMap((page) => [".json", ".wxml", ".js"].map((ext) => path.join(root, `${page}${ext}`))).forEach((filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  assert(!/AI|智能尺码助手|尺码计算|衣橱档案/.test(content), `old shell or AI entry text remains in ${path.relative(root, filePath)}`);
  if (filePath.endsWith(".json")) {
    JSON.parse(content);
  }
});

[
  path.join(root, "app.js"),
  path.join(root, "domain"),
  path.join(root, "data"),
  path.join(root, "services"),
  path.join(root, "cloudfunctions"),
  path.join(root, "cloudfunctions-shared"),
  path.resolve(__dirname)
].flatMap((target) => {
  if (!fs.existsSync(target)) {
    return [];
  }
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    return [target];
  }
  return walkFiles(target);
}).filter((filePath) => filePath.endsWith(".js")).forEach((filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  new vm.Script(content, { filename: filePath });
});

console.log("Mini program validation passed.");

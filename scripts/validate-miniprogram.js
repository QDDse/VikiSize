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
  "pages/today/index",
  "pages/plans/index",
  "pages/life/index",
  "pages/decisions/index",
  "pages/spaces/index",
  "pages/space-settings/index",
  "pages/card-detail/index",
  "pages/travel-plan/index",
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
  "invitations"
];

requiredPages.forEach((page) => {
  assert(appJson.pages.includes(page), `app.json missing required page: ${page}`);
  [".js", ".json", ".wxml", ".wxss"].forEach((ext) => {
    assert(fs.existsSync(path.join(root, `${page}${ext}`)), `missing page file: ${page}${ext}`);
  });
});

const tabPages = appJson.tabBar.list.map((item) => item.pagePath);
assert(tabPages.length === 4, "tabBar must have exactly four tabs");
assert(tabPages.join(",") === "pages/today/index,pages/plans/index,pages/life/index,pages/decisions/index", "tabBar must be Today / Plans / Life / Decisions");
assert(projectConfig.cloudfunctionRoot === "cloudfunctions/", "project.config.json must set cloudfunctionRoot");

requiredCollections.forEach((collectionName) => {
  const source = fs.readFileSync(path.join(root, "services/localStore.js"), "utf8");
  assert(source.includes(collectionName), `local store missing collection boundary: ${collectionName}`);
});

[
  "login",
  "createSpace",
  "createTravelInstanceFromTemplate",
  "createInvitation",
  "acceptInvitation",
  "upsertCard",
  "archiveCard",
  "addComment",
  "setMemberOpinion",
  "scheduleReminder",
  "dispatchReminders"
].forEach((name) => {
  assert(fs.existsSync(path.join(root, "cloudfunctions", name, "index.js")), `missing cloud function: ${name}`);
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

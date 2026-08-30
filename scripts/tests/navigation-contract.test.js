const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const MINIAPP_ROOT = path.resolve(__dirname, "../../apps/wechat-miniprogram");
const ROUTE_PROPERTY_PATTERN = /\b(?:url|path|page)\s*:\s*(["'`])(\/pages\/[^"'`?\s]+)[^"'`]*\1/g;

function walkJavaScriptFiles(directory, result = []) {
  fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    if (entry.name === "node_modules" || entry.name === "miniprogram_npm") return;

    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkJavaScriptFiles(filePath, result);
      return;
    }
    if (entry.isFile() && entry.name.endsWith(".js")) {
      result.push(filePath);
    }
  });
  return result;
}

function collectLiteralPageRoutes() {
  return walkJavaScriptFiles(MINIAPP_ROOT).flatMap((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    return [...source.matchAll(ROUTE_PROPERTY_PATTERN)].map((match) => ({
      route: match[2],
      source: path.relative(MINIAPP_ROOT, filePath)
    }));
  });
}

test("小程序内部字面量页面路由必须注册在 app.json", () => {
  const appJson = JSON.parse(fs.readFileSync(path.join(MINIAPP_ROOT, "app.json"), "utf8"));
  const registeredRoutes = new Set(appJson.pages.map((page) => `/${page}`));
  const references = collectLiteralPageRoutes();
  const invalidReferences = references.filter(({ route }) => !registeredRoutes.has(route));

  assert.ok(references.length > 0, "应至少扫描到一条小程序内部页面路由");
  assert.deepStrictEqual(
    invalidReferences,
    [],
    `发现未注册页面路由：\n${invalidReferences.map(({ route, source }) => `- ${route} (${source})`).join("\n")}`
  );
});

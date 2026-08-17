const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const MINIAPP_ROOT = path.resolve(__dirname, "../../apps/wechat-miniprogram");

test("小程序只保留旅行与健身两个一级入口", () => {
  const appJson = JSON.parse(fs.readFileSync(path.join(MINIAPP_ROOT, "app.json"), "utf8"));
  assert.deepStrictEqual(
    appJson.tabBar.list.map((item) => [item.pagePath, item.text]),
    [
      ["pages/plans/index", "旅行"],
      ["pages/fitness/index", "健身"]
    ]
  );
  ["today", "life", "decisions"].forEach((page) => {
    assert.ok(!appJson.pages.includes(`pages/${page}/index`), `${page} 不应继续注册`);
    assert.ok(!fs.existsSync(path.join(MINIAPP_ROOT, "pages", page)), `${page} 死页面应删除`);
  });
});

test("新建空间只允许旅行模板", () => {
  const { TemplateOptions, TemplateTypes } = require("../../apps/wechat-miniprogram/domain/constants");
  assert.deepStrictEqual(TemplateOptions.map((item) => item.type), [TemplateTypes.TRAVEL_TEAM]);
});

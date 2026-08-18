const test = require("node:test");
const assert = require("node:assert");

function loadFitnessPage(wxApi) {
  const pagePath = require.resolve("../../apps/wechat-miniprogram/pages/fitness/index.js");
  const previousPage = global.Page;
  const previousWx = global.wx;
  let definition;
  global.Page = (config) => { definition = config; };
  global.wx = wxApi;
  delete require.cache[pagePath];
  require(pagePath);
  global.Page = previousPage;
  return {
    definition,
    restore() {
      global.wx = previousWx;
      delete require.cache[pagePath];
    }
  };
}

test("用户点击开启周报提醒时立即拉起微信授权，接受后记录云端状态", async () => {
  const templateId = "template-weekly";
  const calls = [];
  const wxApi = {
    cloud: {
      callFunction: async ({ name }) => {
        calls.push(`cloud:${name}`);
        if (name === "getFitnessNotificationSettings") {
          return { result: { configured: true, templateId, status: "disabled" } };
        }
        return { result: { configured: true, templateId, status: "granted" } };
      }
    },
    requestSubscribeMessage: async ({ tmplIds }) => {
      calls.push(`subscribe-ui:${tmplIds[0]}`);
      return { [templateId]: "accept" };
    },
    showModal() {},
    showToast() {}
  };
  const page = loadFitnessPage(wxApi);
  const context = {
    data: {
      notificationConfigured: true,
      notificationTemplateId: templateId,
      notificationMessage: ""
    },
    setData(patch) { this.data = Object.assign({}, this.data, patch); }
  };

  try {
    await page.definition.enableWeeklyReminder.call(context);
    assert.deepStrictEqual(calls, [
      `subscribe-ui:${templateId}`,
      "cloud:subscribeFitnessWeeklyReport"
    ]);
    assert.strictEqual(context.data.notificationStatus, "granted");
  } finally {
    page.restore();
  }
});

test("微信拒绝拉起订阅界面时展示真实错误码且不记录云端授权", async () => {
  const templateId = "template-weekly";
  const calls = [];
  const modals = [];
  const wxApi = {
    cloud: {
      callFunction: async ({ name }) => {
        calls.push(`cloud:${name}`);
        return { result: {} };
      }
    },
    requestSubscribeMessage: async () => {
      calls.push("subscribe-ui");
      throw { errCode: 20001, errMsg: "No template data return" };
    },
    showModal(options) { modals.push(options); },
    showToast() {}
  };
  const page = loadFitnessPage(wxApi);
  const context = {
    data: {
      notificationConfigured: true,
      notificationTemplateId: templateId,
      notificationMessage: ""
    },
    setData(patch) { this.data = Object.assign({}, this.data, patch); }
  };

  try {
    await page.definition.enableWeeklyReminder.call(context);
    assert.deepStrictEqual(calls, ["subscribe-ui"]);
    assert.strictEqual(modals.length, 1);
    assert.match(modals[0].content, /20001/);
    assert.match(modals[0].content, /No template data return/);
  } finally {
    page.restore();
  }
});

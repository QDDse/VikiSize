// 云函数测试装具：把 wx-server-sdk 替换成内存 mock，并按需重新加载函数入口。
// 测试运行的是 build:cloudfunctions 之后的产物（每个函数目录内的 _shared 副本），
// 因此同时验证了模块解析（部署包完整性）。
const Module = require("module");
const path = require("path");
const { createMockCloud } = require("./mock-wx-server-sdk");

const FUNCTIONS_DIR = path.resolve(__dirname, "../../../apps/wechat-miniprogram/cloudfunctions");

let activeMock = null;
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "wx-server-sdk") {
    if (!activeMock) {
      throw new Error("mock cloud 未安装：先调用 installMockCloud()");
    }
    return activeMock.sdk;
  }
  return originalLoad.call(this, request, parent, isMain);
};

function purgeFunctionModules() {
  Object.keys(require.cache).forEach((key) => {
    if (key.startsWith(FUNCTIONS_DIR)) {
      delete require.cache[key];
    }
  });
}

function installMockCloud() {
  activeMock = createMockCloud();
  purgeFunctionModules();
  return activeMock;
}

function loadFunction(name) {
  return require(path.join(FUNCTIONS_DIR, name, "index.js"));
}

module.exports = { installMockCloud, loadFunction };

// 本地存储层回归测试：模板选择直通（F1）、未知版本不清空数据（F2）、
// 邀请 token 强度与过期（S2 本地对齐）。
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");

const STORE_PATH = path.resolve(__dirname, "../../apps/wechat-miniprogram/services/localStore.js");
const STORAGE_KEY = "vikisize_life_assistant_state_v1";

function freshStore() {
  Object.keys(require.cache).forEach((key) => {
    if (key.includes(`${path.sep}apps${path.sep}wechat-miniprogram${path.sep}`)) {
      delete require.cache[key];
    }
  });
  return require(STORE_PATH);
}

function installFakeWxStorage(initial) {
  const storage = Object.assign({}, initial);
  global.wx = {
    getStorageSync(key) { return storage[key]; },
    setStorageSync(key, value) { storage[key] = JSON.parse(JSON.stringify(value)); }
  };
  return storage;
}

test.afterEach(() => {
  delete global.wx;
});

test("F1 创建空间时传入的模板 id 被真正使用", () => {
  const store = freshStore();
  store.resetLocalState();
  const { TemplateTypes } = require("../../apps/wechat-miniprogram/domain/constants");

  const space = store.createSpace({
    templateType: TemplateTypes.TRAVEL_TEAM,
    name: "指定模板小队",
    sourceTemplateId: "tokyo-kanto-8d",
    sourceTemplateVersion: "1.0.0"
  });
  const instance = store.getTravelInstance(space.id);
  assert.strictEqual(instance.sourceTemplateId, "tokyo-kanto-8d");
  assert.strictEqual(instance.sourceVersion, "1.0.0");

  // 不存在的模板必须显式报错，而不是静默退回第一个内置模板
  assert.throws(() => store.createSpace({
    templateType: TemplateTypes.TRAVEL_TEAM,
    name: "幽灵模板小队",
    sourceTemplateId: "no-such-template"
  }), /旅行模板不存在/);
});

test("F2 未知的本地数据版本：备份并报错，绝不静默重置", () => {
  const saved = { version: 99, collections: { cards: [{ id: "precious" }] } };
  const storage = installFakeWxStorage({ [STORAGE_KEY]: saved });
  const store = freshStore();

  assert.throws(() => store.getCurrentContext(), /版本无法识别/);
  assert.deepStrictEqual(storage[`${STORAGE_KEY}_backup_unknown`], saved, "原始数据必须已备份");
  assert.deepStrictEqual(storage[STORAGE_KEY], saved, "原始数据不能被覆盖");
});

test("F2 已知版本正常迁移不受影响", () => {
  installFakeWxStorage({});
  const store = freshStore();
  const context = store.getCurrentContext();
  assert.ok(context.space, "全新初始化仍然可用");
});

test("S2 本地邀请 token 无时间戳前缀且带过期时间", () => {
  const storage = installFakeWxStorage({});
  let store = freshStore();
  store.resetLocalState();
  const { Roles } = require("../../apps/wechat-miniprogram/domain/constants");

  const invitation = store.createInvitation(Roles.MEMBER);
  assert.ok(!/^token-/.test(invitation.token));
  assert.ok(invitation.token.length >= 32);
  assert.ok(invitation.expiresAt > new Date().toISOString());

  // 把持久化状态里的邀请改成已过期，重新加载后不可接受
  storage[STORAGE_KEY].collections.invitations
    .find((item) => item.token === invitation.token).expiresAt = "2000-01-01T00:00:00.000Z";
  store = freshStore();
  assert.throws(() => store.acceptInvitation(invitation.token), /邀请已过期/);
});

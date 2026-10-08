const test = require("node:test");
const assert = require("node:assert/strict");
const companion = require("../../apps/wechat-miniprogram/services/travelCompanion");
const storePath = require.resolve("../../apps/wechat-miniprogram/services/localStore");
const pagePath = require.resolve("../../apps/wechat-miniprogram/pages/travel-plan/index");
const key = "vikisize_life_assistant_state_v1";
let storage, store, instance, page, modal, clipboard;
function reload() { delete require.cache[storePath]; return require(storePath); }
function event(id) { return { currentTarget: { dataset: { id } } }; }

test.beforeEach(() => {
  storage = {}; modal = null; clipboard = "";
  global.wx = {
    getStorageSync: (key) => storage[key],
    setStorageSync: (key, value) => { storage[key] = JSON.parse(JSON.stringify(value)); },
    showToast() {}, showModal: (value) => { modal = value; },
    setClipboardData: ({ data }) => { clipboard = data; }
  };
  store = reload();
  instance = store.getTravelInstance(store.getCurrentContext().space.id);
  global.Page = (definition) => { page = Object.assign({}, definition, { data: JSON.parse(JSON.stringify(definition.data)), setData(patch) { Object.assign(this.data, patch); } }); };
  delete require.cache[pagePath]; require(pagePath); page.onLoad({}); page.onShow();
});
test.afterEach(() => { delete global.wx; delete global.Page; });
const input = (changes) => Object.assign({ date: "2026-09-24", merchant: " Cafe ", amount: "1200", category: "餐饮" }, changes);

test("旧实例无小票，新账本为空；新增、刷新加载、日期汇总、去重及旅行隔离", () => {
  assert.equal(instance.receipts, undefined);
  assert.equal(page.data.ledger.tripTotal, 0);
  store.addTravelReceipt(instance.id, input());
  assert.throws(() => store.addTravelReceipt(instance.id, input({ merchant: "cAFE", category: "其他", amount: 1200 })), /重复/);
  store.addTravelReceipt(instance.id, input({ date: "2026-09-25" }));
  store = reload();
  const saved = store.getTravelInstance(instance.spaceId);
  const summary = companion.summarizeReceipts(saved.receipts, "2026-09-24");
  assert.equal(summary.dayTotal, 1200); assert.equal(summary.tripTotal, 2400);
  assert.equal(summary.categories.find((item) => item.name === "餐饮").amount, 1200);
  assert.equal(saved.receipts[0].merchant, "Cafe");
  const space = store.createSpace({ name: "独立旅行", templateType: "travel_team" });
  const other = store.getTravelInstance(space.id);
  assert.equal(other.receipts, undefined);
  store.addTravelReceipt(other.id, input());
  assert.equal(store.getTravelInstance(instance.spaceId).receipts.length, 2);
});

test("小票校验拒绝非法日期、非整数、负数、空值及非法分类", () => {
  for (const amount of ["", " ", "0", "-1", "1.5", "1e3", "NaN", "1000000000"]) assert.throws(() => store.addTravelReceipt(instance.id, input({ amount })), /整数日元/);
  for (const date of ["2026-02-30", "not-a-date", "2026-13-01"]) assert.throws(() => store.addTravelReceipt(instance.id, input({ date })), /有效日期/);
  assert.throws(() => store.addTravelReceipt(instance.id, input({ merchant: "  " })), /商家/);
  assert.throws(() => store.addTravelReceipt(instance.id, input({ category: "fake" })), /分类/);
  assert.equal(store.getTravelInstance(instance.spaceId).receipts, undefined);
});

test("保存失败不污染内存，重试成功且可重新加载", () => {
  const before = store.getState();
  const write = global.wx.setStorageSync;
  global.wx.setStorageSync = () => { throw new Error("空间不足"); };
  assert.throws(() => store.addTravelReceipt(instance.id, input()), /空间不足/);
  assert.deepEqual(store.getState(), before);
  global.wx.setStorageSync = write;
  store.addTravelReceipt(instance.id, input());
  assert.equal(reload().getTravelInstance(instance.spaceId).receipts.length, 1);
});

test("访客、非成员与归档实例禁止写入；成员可记账", () => {
  const receipt = store.addTravelReceipt(instance.id, input());
  store.setCurrentUserRoleForPreview("guest");
  assert.throws(() => store.addTravelReceipt(instance.id, input({ amount: 1300 })), /访客/);
  assert.throws(() => store.deleteTravelReceipt(instance.id, receipt.id), /访客/);
  store.setCurrentUserRoleForPreview("member");
  store.deleteTravelReceipt(instance.id, receipt.id);
  store.setCurrentUserRoleForPreview("owner");
  store.archiveTravelInstance(instance.id, true);
  assert.throws(() => store.addTravelReceipt(instance.id, input()), /归档/);
  storage[key].collections.space_members = [];
  store = reload();
  assert.throws(() => store.addTravelReceipt(instance.id, input()), /访客/);
});

test("页面小票取消不保存，双击不重复，删除需确认并持久化", () => {
  page.openReceiptForm(); page.closeReceiptForm(); assert.equal(store.getTravelInstance(instance.spaceId).receipts, undefined);
  page.openReceiptForm(); page.setData({ receiptForm: input() }); page.saveReceipt(); page.saveReceipt();
  const receipt = store.getTravelInstance(instance.spaceId).receipts[0];
  assert.equal(page.data.ledger.count, 1);
  page.deleteReceipt(event(receipt.id)); modal.success({ confirm: false });
  assert.equal(store.getTravelInstance(instance.spaceId).receipts.length, 1);
  page.deleteReceipt(event(receipt.id)); modal.success({ confirm: true });
  assert.equal(reload().getTravelInstance(instance.spaceId).receipts.length, 0);
  assert.equal(page.data.ledger.tripTotal, 0);
});

test("模拟关闭、切日、切页签、隐藏均不改变正式数据", () => {
  const before = store.getState();
  const simulate = () => page.previewDelay({ currentTarget: { dataset: { minutes: 30 } } });
  simulate(); assert.equal(page.data.delayMinutes, 30); page.closeDelay(); assert.equal(page.data.delayRows.length, 0);
  simulate(); page.selectDay(event(instance.days[1].id)); assert.equal(page.data.delayMinutes, 0);
  simulate(); page.setTab({ currentTarget: { dataset: { tab: "receipts" } } }); assert.equal(page.data.delayMinutes, 0);
  simulate(); page.onHide(); assert.equal(page.data.delayMinutes, 0);
  assert.deepEqual(store.getState(), before);
  assert.deepEqual(storage[key], before);
  const rows = companion.delayPreview({ nodes: [{ id: "late", title: "末班车", startTime: "23:50" }] }, 30);
  assert.equal(rows[0].shifted, "次日 00:20");
});

test("地点详情对访客可见且不泄露敏感字段；过期选日自动回退", () => {
  store.updateTravelNode(instance.id, instance.days[0].id, instance.days[0].nodes[0].id, { startTime: "09:00", endTime: "10:30", sensitiveFields: { confirmationCode: "SECRET" } });
  store.setCurrentUserRoleForPreview("guest"); page.onShow();
  page.activateNode(event(instance.days[0].nodes[0].id));
  assert.equal(page.data.activeNode.stay, "约 90 分钟");
  assert.deepEqual(page.data.activeNode.sensitiveFields, {});
  page.selectDay(event(instance.days[1].id)); assert.equal(page.data.activeNode, null);
  page.setData({ selectedDayId: "deleted-day" }); page.onShow();
  assert.ok(page.data.selectedDay);
});

test("四类日语复制实际文本；今日按东京时区选择；回顾不伪装下一站", () => {
  for (const category of companion.phraseCategories) {
    page.selectPhraseCategory(event(category.id)); page.copyPhrase(event(category.phrases[0].id));
    assert.equal(clipboard, category.phrases[0].japanese);
  }
  assert.equal(companion.dateInZone(new Date("2026-09-24T15:30:00Z"), "Asia/Tokyo"), "2026-09-25");
  const overview = companion.dayOverview(instance.days[0], "2027-01-01", new Date(), "Asia/Tokyo");
  assert.equal(overview.label, "行程回顾"); assert.equal(overview.current, null);
});

test("v2 迁移保留原始账本与备份；不同旅行切换清空弹层和模拟", () => {
  store.addTravelReceipt(instance.id, input());
  const legacy = JSON.parse(JSON.stringify(storage[key]));
  legacy.version = 2;
  storage[key] = legacy;
  store = reload();
  assert.equal(store.getTravelInstance(instance.spaceId).receipts.length, 1);
  assert.deepEqual(storage[`${key}_backup_v2`], legacy);
  // Page closure must use the reloaded store in this migration test.
  delete require.cache[pagePath]; require(pagePath); page.onLoad({}); page.onShow();
  page.previewDelay({ currentTarget: { dataset: { minutes: 15 } } });
  page.openReceiptForm();
  const space = store.createSpace({ name: "下一次旅行", templateType: "travel_team" });
  store.switchSpace(space.id);
  page.onShow();
  assert.equal(page.data.instance.spaceId, space.id);
  assert.equal(page.data.delayMinutes, 0);
  assert.equal(page.data.receiptForm, null);
  assert.equal(page.data.ledger.count, 0);
});

test("日期入口保留指定日期；数据移除后空状态可用", () => {
  page.onLoad({ dayId: instance.days[2].id, tab: "receipts" }); page.onShow();
  assert.equal(page.data.selectedDayId, instance.days[2].id);
  assert.equal(page.data.tab, "receipts");
  store.archiveTravelInstance(instance.id, true); page.onShow();
  assert.equal(page.data.instance, null);
  assert.equal(page.data.selectedDay, null);
  assert.deepEqual(page.data.timelineNodes, []);
});

test("页面存储失败保留输入且不提示成功；删除失败保留账本", () => {
  const toasts = [];
  global.wx.showToast = (value) => toasts.push(value);
  page.openReceiptForm(); page.setData({ receiptForm: input() });
  const write = global.wx.setStorageSync;
  global.wx.setStorageSync = () => { throw new Error("存储空间不足"); };
  page.saveReceipt();
  assert.match(page.data.receiptError, /空间不足/);
  assert.equal(page.data.receiptForm.merchant, " Cafe ");
  assert.equal(page.data.savingReceipt, false);
  assert.equal(page.data.ledger.count, 0);
  assert.ok(!toasts.some((item) => item.icon === "success"));
  global.wx.setStorageSync = write;
  page.saveReceipt();
  const receipt = page.data.instance.receipts[0];
  global.wx.setStorageSync = () => { throw new Error("存储空间不足"); };
  page.deleteReceipt(event(receipt.id)); modal.success({ confirm: true });
  assert.equal(page.data.ledger.count, 1);
  assert.equal(store.getTravelInstance(instance.spaceId).receipts.length, 1);
  assert.equal(storage[key].collections.travel_plan_instances.find((item) => item.id === instance.id).receipts.length, 1);
});

test("不能通过另一旅行实例 id 删除小票，不能向未授权空间记账", () => {
  const receipt = store.addTravelReceipt(instance.id, input());
  const space = store.createSpace({ name: "其他旅行", templateType: "travel_team" });
  const other = store.getTravelInstance(space.id);
  assert.throws(() => store.deleteTravelReceipt(other.id, receipt.id), /小票不存在/);
  assert.equal(store.getTravelInstance(instance.spaceId).receipts.length, 1);
  storage[key].collections.space_members = storage[key].collections.space_members.filter((member) => member.spaceId !== space.id);
  store = reload();
  assert.throws(() => store.addTravelReceipt(other.id, input()), /访客/);
  assert.equal(store.getTravelInstance(instance.spaceId).receipts.length, 1);
});

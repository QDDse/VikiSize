const test = require("node:test");
const assert = require("node:assert");
const { URLSearchParams } = require("node:url");
const { installMockCloud, loadFunction } = require("./lib/cloudHarness");

function unsignedDelivery() {
  return {
    schemaVersion: "fitness_delivery_v1",
    deliveryId: "delivery-cloud-w33",
    generatedAt: "2026-08-17T08:00:00.000Z",
    report: {
      schemaVersion: "fitness_review_v2",
      reportId: "review-cloud-w33",
      period: { start: "2026-08-10", end: "2026-08-16" },
      summary: "训练稳定，恢复尚可。",
      metrics: [],
      insights: ["训练频率稳定"],
      recommendations: ["维持当前频率"]
    },
    planPatch: {
      schemaVersion: "plan_patch_v1",
      patchId: "patch-cloud-w34",
      basePlanVersion: "plan-v7",
      changes: [{ operation: "replace", target: "day-2.volume", before: "12 组", after: "10 组", reason: "恢复不足" }]
    }
  };
}

function withXunjiWriteback(delivery) {
  delivery.planPatch.writeback = {
    provider: "xunji",
    operation: "upsert_training_day_v2",
    summary: [{ datestr: "2026-08-18", label: "深蹲训练", before: null, after: "3 x 8 @ 60kg", unit: "" }],
    request: {
      schema_version: "train_open_api_v2",
      include_full_data: true,
      res: [{
        datestr: "2026-08-18",
        title: "下肢训练",
        movements: [{ name: "深蹲", sets: [{ done: false, weight: "60", unit: "kg", reps: "8" }] }]
      }]
    }
  };
  return delivery;
}

test("发布通道密钥只返回一次，Delivery 经哈希校验后幂等入库", async () => {
  const mock = installMockCloud();
  const createChannel = loadFunction("createFitnessChannel");
  const ingest = loadFunction("ingestFitnessDelivery");
  const { withFitnessHashes } = require("../../apps/wechat-miniprogram/cloudfunctions-shared/fitnessSchema");

  const channel = await createChannel.main({ profile: { displayName: "QDD" } });
  assert.ok(channel.channelId);
  assert.ok(channel.publishToken.length >= 32);
  assert.ok(!mock.all("fitness_channels")[0].publishToken, "数据库不能保存明文 token");

  const delivery = withFitnessHashes(unsignedDelivery());
  const [first, duplicate] = await Promise.all([
    ingest.main({
      httpMethod: "POST",
      body: JSON.stringify({ channelId: channel.channelId, publishToken: channel.publishToken, delivery })
    }),
    ingest.main({ channelId: channel.channelId, publishToken: channel.publishToken, delivery })
  ]);
  assert.strictEqual(first.statusCode, 200);
  const firstBody = JSON.parse(first.body);
  assert.strictEqual(firstBody.delivery.id, duplicate.delivery.id);
  assert.strictEqual(mock.all("fitness_deliveries").length, 1);

  await assert.rejects(
    ingest.main({ channelId: channel.channelId, publishToken: "wrong-token", delivery }),
    /发布凭证无效/
  );

  const denied = await ingest.main({
    httpMethod: "POST",
    body: JSON.stringify({ channelId: channel.channelId, publishToken: "wrong-token", delivery })
  });
  assert.strictEqual(denied.statusCode, 401);
  assert.ok(!denied.body.includes("wrong-token"));
  await assert.rejects(
    ingest.main({
      channelId: channel.channelId,
      publishToken: channel.publishToken,
      delivery: Object.assign({}, delivery, { contentHash: "sha256:tampered" })
    }),
    /内容哈希不匹配/
  );
});

test("用户只能读取自己的报告，计划确认必须绑定 Patch 哈希", async () => {
  installMockCloud();
  const createChannel = loadFunction("createFitnessChannel");
  const ingest = loadFunction("ingestFitnessDelivery");
  const list = loadFunction("listFitnessDeliveries");
  const decide = loadFunction("decideFitnessPlanPatch");
  const { withFitnessHashes } = require("../../apps/wechat-miniprogram/cloudfunctions-shared/fitnessSchema");

  const channel = await createChannel.main({});
  const delivery = withFitnessHashes(unsignedDelivery());
  await ingest.main({ channelId: channel.channelId, publishToken: channel.publishToken, delivery });
  const inbox = await list.main({});
  assert.strictEqual(inbox.deliveries.length, 1);

  await assert.rejects(
    decide.main({ deliveryId: delivery.deliveryId, patchHash: "sha256:stale", decision: "accepted" }),
    /Patch 已变化/
  );
  const result = await decide.main({
    deliveryId: delivery.deliveryId,
    patchHash: delivery.planPatch.patchHash,
    decision: "accepted"
  });
  assert.strictEqual(result.delivery.decision.status, "accepted");
  await assert.rejects(
    decide.main({ deliveryId: delivery.deliveryId, patchHash: delivery.planPatch.patchHash, decision: "rejected" }),
    /已经完成决策/
  );
});

test("周报订阅只消费一次，通知失败不影响 Delivery 入箱", async () => {
  const previousTemplate = process.env.FITNESS_WEEKLY_REPORT_TEMPLATE_ID;
  const previousBindings = process.env.FITNESS_WEEKLY_REPORT_TEMPLATE_BINDINGS;
  const previousState = process.env.FITNESS_MINIPROGRAM_STATE;
  process.env.FITNESS_WEEKLY_REPORT_TEMPLATE_ID = "template-weekly";
  process.env.FITNESS_WEEKLY_REPORT_TEMPLATE_BINDINGS = JSON.stringify({ thing2: "周报", time3: "period", thing1: "summary" });
  process.env.FITNESS_MINIPROGRAM_STATE = "developer";
  try {
    const mock = installMockCloud();
    const createChannel = loadFunction("createFitnessChannel");
    const settings = loadFunction("getFitnessNotificationSettings");
    const subscribe = loadFunction("subscribeFitnessWeeklyReport");
    const ingest = loadFunction("ingestFitnessDelivery");
    const { withFitnessHashes } = require("../../apps/wechat-miniprogram/cloudfunctions-shared/fitnessSchema");

    assert.strictEqual((await settings.main({})).status, "disabled");
    await subscribe.main({ templateId: "template-weekly", accepted: true });
    assert.strictEqual((await settings.main({})).status, "granted");
    const channel = await createChannel.main({});
    const delivery = withFitnessHashes(unsignedDelivery());
    const result = await ingest.main({ channelId: channel.channelId, publishToken: channel.publishToken, delivery });
    assert.strictEqual(result.delivery.notification.status, "sent");
    assert.strictEqual(mock.sentMessages.length, 1);
    assert.strictEqual(mock.sentMessages[0].page, `/pages/fitness-detail/index?id=${delivery.deliveryId}`);
    assert.strictEqual(mock.sentMessages[0].miniprogramState, "developer");
    assert.deepStrictEqual(mock.sentMessages[0].data, {
      thing2: { value: "周报" },
      time3: { value: "2026.08.10~2026.08.16" },
      thing1: { value: "训练稳定，恢复尚可。" }
    });
    assert.strictEqual((await settings.main({})).status, "consumed");
  } finally {
    if (previousTemplate === undefined) delete process.env.FITNESS_WEEKLY_REPORT_TEMPLATE_ID;
    else process.env.FITNESS_WEEKLY_REPORT_TEMPLATE_ID = previousTemplate;
    if (previousBindings === undefined) delete process.env.FITNESS_WEEKLY_REPORT_TEMPLATE_BINDINGS;
    else process.env.FITNESS_WEEKLY_REPORT_TEMPLATE_BINDINGS = previousBindings;
    if (previousState === undefined) delete process.env.FITNESS_MINIPROGRAM_STATE;
    else process.env.FITNESS_MINIPROGRAM_STATE = previousState;
  }
});

test("每个新 Delivery 只触发一次 Server酱通知，重复投递不重复提醒", async () => {
  installMockCloud();
  const createChannel = loadFunction("createFitnessChannel");
  const ingestModule = loadFunction("ingestFitnessDelivery");
  const { withFitnessHashes } = require("../../apps/wechat-miniprogram/cloudfunctions-shared/fitnessSchema");
  const serverChanCalls = [];
  const ingest = ingestModule.createHandler({
    sendFitnessWeeklyNotification: async () => ({ status: "not_subscribed" }),
    sendServerChanNotification: async ({ delivery }) => {
      serverChanCalls.push(delivery.deliveryId);
      return { status: "sent", sentAt: "2026-08-18T01:00:00.000Z" };
    }
  });

  const channel = await createChannel.main({});
  const delivery = withFitnessHashes(unsignedDelivery());
  const first = await ingest({ channelId: channel.channelId, publishToken: channel.publishToken, delivery });
  const duplicate = await ingest({ channelId: channel.channelId, publishToken: channel.publishToken, delivery });

  assert.strictEqual(first.created, true);
  assert.strictEqual(duplicate.created, false);
  assert.deepStrictEqual(serverChanCalls, [delivery.deliveryId]);
  assert.strictEqual(first.delivery.notification.status, "sent");
  assert.strictEqual(first.delivery.notification.channels.serverChan.status, "sent");
  assert.strictEqual(first.delivery.notification.channels.wechat.status, "not_subscribed");
});

test("Server酱通知失败只记录旁路状态，不回滚 Delivery", async () => {
  const mock = installMockCloud();
  const createChannel = loadFunction("createFitnessChannel");
  const ingestModule = loadFunction("ingestFitnessDelivery");
  const { withFitnessHashes } = require("../../apps/wechat-miniprogram/cloudfunctions-shared/fitnessSchema");
  const ingest = ingestModule.createHandler({
    sendFitnessWeeklyNotification: async () => ({ status: "not_subscribed" }),
    sendServerChanNotification: async () => ({ status: "failed", message: "Server酱暂不可用" })
  });

  const channel = await createChannel.main({});
  const delivery = withFitnessHashes(unsignedDelivery());
  const result = await ingest({ channelId: channel.channelId, publishToken: channel.publishToken, delivery });

  assert.strictEqual(result.created, true);
  assert.strictEqual(mock.all("fitness_deliveries").length, 1);
  assert.strictEqual(result.delivery.notification.status, "failed");
  assert.strictEqual(result.delivery.notification.channels.serverChan.status, "failed");
});

test("Server酱客户端按 SendKey 类型构造接口并只发送报告到达摘要", async () => {
  const { sendServerChanNotification } = require("../../apps/wechat-miniprogram/cloudfunctions-shared/serverChanClient");
  const calls = [];
  const result = await sendServerChanNotification({
    delivery: unsignedDelivery(),
    timestamp: "2026-08-18T01:00:00.000Z",
    env: { SERVERCHAN_SENDKEY: "SCT-test-send-key" },
    request: async (url, headers, body) => {
      calls.push({ url, headers, body });
      return { code: 0, message: "SUCCESS" };
    }
  });

  assert.strictEqual(result.status, "sent");
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].url, "https://sctapi.ftqq.com/SCT-test-send-key.send");
  assert.strictEqual(calls[0].headers["Content-Type"], "application/x-www-form-urlencoded; charset=utf-8");
  const form = new URLSearchParams(calls[0].body);
  assert.strictEqual(form.get("title"), "健身周报已生成");
  assert.match(form.get("desp"), /2026\.08\.10~2026\.08\.16/);
  assert.ok(!form.get("desp").includes("训练稳定，恢复尚可"), "通知正文不应泄露健康分析内容");
});

test("Server酱报告模式内联周报内容并引导用户回到原生小程序", async () => {
  const { sendServerChanNotification } = require("../../apps/wechat-miniprogram/cloudfunctions-shared/serverChanClient");
  const calls = [];
  const delivery = unsignedDelivery();
  delivery.report.metrics = [
    { key: "active_days", label: "训练活跃日", value: 4, unit: "天" },
    { key: "duration", label: "训练时长", value: 69.2, unit: "分钟" }
  ];
  delivery.report.insights = ["训练活跃日频率总体稳定"];
  delivery.report.recommendations = ["下周保持约 4 个训练活跃日"];

  const result = await sendServerChanNotification({
    delivery,
    timestamp: "2026-08-18T01:00:00.000Z",
    env: {
      SERVERCHAN_SENDKEY: "SCT-test-send-key",
      FITNESS_SERVERCHAN_DETAIL_LEVEL: "report",
      FITNESS_REPORT_H5_URL: "https://fitness.example.test/fitness/deliveries?view=report"
    },
    request: async (url, headers, body) => {
      calls.push({ url, headers, body });
      return { code: 0, message: "SUCCESS" };
    }
  });

  assert.strictEqual(result.status, "sent");
  const form = new URLSearchParams(calls[0].body);
  assert.strictEqual(form.get("title"), "健身周报｜4 天训练");
  assert.match(form.get("desp"), /训练稳定，恢复尚可/);
  assert.match(form.get("desp"), /\| 训练活跃日 \| 4 天 \|/);
  assert.match(form.get("desp"), /训练活跃日频率总体稳定/);
  assert.match(form.get("desp"), /下周保持约 4 个训练活跃日/);
  assert.match(form.get("desp"), /打开微信小程序「VikiSize」→「健身」→「周报归档」/);
  assert.ok(!form.get("desp").includes("fitness.example.test"), "报告通知不应再生成 H5 链接");
  assert.ok(!form.get("desp").includes("#report="), "报告通知不应再携带 Fragment 报告数据");
});

test("Fitness HTTP 路由以 GET 返回只解析 Fragment 的 H5 报告壳", async () => {
  installMockCloud();
  const ingest = loadFunction("ingestFitnessDelivery");
  const response = await ingest.main({
    httpMethod: "GET",
    queryStringParameters: { view: "report" }
  });

  assert.strictEqual(response.statusCode, 200);
  assert.strictEqual(response.headers["Content-Type"], "text/html; charset=utf-8");
  assert.match(response.headers["Content-Security-Policy"], /default-src 'none'/);
  assert.match(response.body, /location\.hash/);
  assert.match(response.body, /fitness_report_view_v1/);
  assert.ok(!response.body.includes("fetch("), "H5 不应从后台读取健康报告");
  assert.ok(!response.body.includes("训练稳定，恢复尚可"), "H5 壳不得内嵌某份个人报告");
});

test("采纳含训记写回的 Patch 时先完成写回，失败不记录决策", async () => {
  installMockCloud();
  const createChannel = loadFunction("createFitnessChannel");
  const ingest = loadFunction("ingestFitnessDelivery");
  const decideModule = loadFunction("decideFitnessPlanPatch");
  const { withFitnessHashes } = require("../../apps/wechat-miniprogram/cloudfunctions-shared/fitnessSchema");
  const channel = await createChannel.main({});
  const delivery = withFitnessHashes(withXunjiWriteback(unsignedDelivery()));
  await ingest.main({ channelId: channel.channelId, publishToken: channel.publishToken, delivery });

  const blockedHandler = decideModule.createHandler({
    applyTrainingWriteback: async () => { throw new Error("dry-run rejected"); }
  });
  await assert.rejects(blockedHandler({
    deliveryId: delivery.deliveryId,
    patchHash: delivery.planPatch.patchHash,
    decision: "accepted"
  }), /dry-run rejected/);

  let called = 0;
  const successHandler = decideModule.createHandler({
    applyTrainingWriteback: async (input) => {
      called += 1;
      assert.strictEqual(input.writeback.operation, "upsert_training_day_v2");
      return { status: "applied_verified", provider: "xunji", readBackVerified: true };
    }
  });
  const result = await successHandler({
    deliveryId: delivery.deliveryId,
    patchHash: delivery.planPatch.patchHash,
    decision: "accepted"
  });
  assert.strictEqual(called, 1);
  assert.strictEqual(result.delivery.decision.writeback.status, "applied_verified");
});

test("训记客户端严格按 dry-run、正式写入、回读顺序执行", async () => {
  const { applyTrainingWriteback } = require("../../apps/wechat-miniprogram/cloudfunctions-shared/xunjiClient");
  const delivery = withXunjiWriteback(unsignedDelivery());
  const calls = [];
  const result = await applyTrainingWriteback({
    writeback: delivery.planPatch.writeback,
    deliveryId: delivery.deliveryId,
    patchHash: "sha256:test",
    env: { XUNJI_TRAINING_API_KEY: "secret-for-test", XUNJI_TRAINING_BASE_URL: "https://example.test" },
    request: async (url, headers, payload) => {
      calls.push({ url, headers, payload });
      if (url.endsWith("api_trains_for_llm_v2")) {
        return { res: { trains: [{ localid: 1001, datestr: "2026-08-18", title: "下肢训练" }] } };
      }
      return { res: [{ localid: 1001, datestr: "2026-08-18", title: "下肢训练" }] };
    }
  });
  assert.deepStrictEqual(calls.map((call) => call.payload.dry_run), [true, false, undefined]);
  assert.ok(calls[0].headers.Authorization.startsWith("Bearer "));
  assert.strictEqual(calls[0].payload.client_request_id, calls[1].payload.client_request_id);
  assert.strictEqual(result.status, "applied_verified");
  assert.strictEqual(result.readBackVerified, true);
});

test("体测报告按用户隔离，异常指标拒绝入库", async () => {
  const mock = installMockCloud();
  const importBody = loadFunction("importBodyMeasurement");
  const listBody = loadFunction("listBodyMeasurements");
  const input = {
    measurementId: "body-20260611-1844",
    measuredAt: "2026-06-11T18:44:00.000Z",
    imageFileId: "cloud://body/report.png",
    metrics: { weightKg: 79.3, bodyFatPct: 14.7 }
  };
  const created = await importBody.main(input);
  assert.strictEqual(created.measurement.reviewStatus, "confirmed");
  assert.strictEqual((await listBody.main({})).measurements.length, 1);

  await assert.rejects(importBody.main(Object.assign({}, input, {
    measurementId: "bad-body",
    metrics: { weightKg: -1, bodyFatPct: 120 }
  })), /合理范围/);

  mock.setWXContext({ OPENID: "openid-another-user" });
  assert.strictEqual((await listBody.main({})).measurements.length, 0);
});

test("云端空间入口同样只允许旅行模板", async () => {
  installMockCloud();
  const createSpace = loadFunction("createSpace");
  await assert.rejects(createSpace.main({ templateType: "family_life" }), /只支持旅行空间/);
  const result = await createSpace.main({ templateType: "travel_team", name: "北海道旅行" });
  assert.strictEqual(result.space.templateType, "travel_team");
});

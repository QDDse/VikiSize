const https = require("https");
const { sha256 } = require("./fitnessSchema");

function requestJson(url, headers, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const request = https.request(url, {
      method: "POST",
      headers: Object.assign({}, headers, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }),
      timeout: 15000
    }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let data;
        try {
          data = text ? JSON.parse(text) : {};
        } catch (error) {
          return reject(new Error(`训记接口返回非 JSON: HTTP ${response.statusCode}`));
        }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          return reject(new Error(`训记接口失败: HTTP ${response.statusCode} ${data.error || data.message || ""}`.trim()));
        }
        if (data.error || data.errMsg || data.success === false) {
          return reject(new Error(data.error || data.errMsg || data.message || "训记接口返回失败"));
        }
        resolve(data);
      });
    });
    request.on("timeout", () => request.destroy(new Error("训记接口请求超时")));
    request.on("error", reject);
    request.end(body);
  });
}

function trainingRows(response) {
  if (!response) return [];
  if (Array.isArray(response.res)) return response.res;
  if (response.res && Array.isArray(response.res.trains)) return response.res.trains;
  return [];
}

function verifyReadBack(expected, writtenResponse, readResponse) {
  const written = trainingRows(writtenResponse);
  const read = trainingRows(readResponse);
  return expected.every((item, index) => {
    const writtenItem = written[index] || {};
    const localid = item.localid || writtenItem.localid;
    return read.some((candidate) => {
      if (localid) return String(candidate.localid) === String(localid);
      return candidate.datestr === item.datestr && candidate.title === item.title;
    });
  });
}

async function applyTrainingWriteback({ writeback, deliveryId, patchHash, env, request }) {
  const source = env || process.env;
  const apiKey = source.XUNJI_TRAINING_API_KEY;
  if (!apiKey) throw new Error("训记写回未配置：缺少 XUNJI_TRAINING_API_KEY");
  const baseUrl = String(source.XUNJI_TRAINING_BASE_URL || "https://trains.xunjiapp.cn").replace(/\/$/, "");
  const send = request || requestJson;
  const clientRequestId = `viki-${sha256(`${deliveryId}:${patchHash}`).slice(7, 31)}`;
  const requestBase = Object.assign({}, writeback.request, {
    schema_version: "train_open_api_v2",
    client_request_id: clientRequestId
  });
  delete requestBase.dry_run;
  delete requestBase.confirmed;
  const headers = { Authorization: `Bearer ${apiKey}` };
  const writeUrl = `${baseUrl}/api_upsert_trains_for_llm_v2`;
  const queryUrl = `${baseUrl}/api_trains_for_llm_v2`;

  await send(writeUrl, headers, Object.assign({}, requestBase, { dry_run: true }));
  let written;
  try {
    written = await send(writeUrl, headers, Object.assign({}, requestBase, { dry_run: false }));
  } catch (error) {
    error.writeStage = "write";
    throw error;
  }

  const datestr = requestBase.res[0].datestr;
  try {
    const readBack = await send(queryUrl, headers, {
      schema_version: "train_open_api_v2",
      datestr,
      include_full_data: Boolean(requestBase.include_full_data)
    });
    const verified = verifyReadBack(requestBase.res, written, readBack);
    return {
      status: verified ? "applied_verified" : "applied_unverified",
      provider: "xunji",
      operation: writeback.operation,
      clientRequestId,
      datestr,
      recordCount: requestBase.res.length,
      readBackVerified: verified
    };
  } catch (error) {
    return {
      status: "applied_unverified",
      provider: "xunji",
      operation: writeback.operation,
      clientRequestId,
      datestr,
      recordCount: requestBase.res.length,
      readBackVerified: false,
      message: String(error.message || "训记回读失败").slice(0, 120)
    };
  }
}

module.exports = { applyTrainingWriteback, requestJson, verifyReadBack };

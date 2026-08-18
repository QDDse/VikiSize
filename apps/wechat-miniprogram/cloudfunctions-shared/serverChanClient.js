const https = require("https");
const { URLSearchParams } = require("url");

function truncate(value, maxLength) {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 1))}…` : text;
}

function serverChanEndpoint(sendKey) {
  const key = String(sendKey || "").trim();
  if (/^SCT[\w-]+$/.test(key)) {
    return `https://sctapi.ftqq.com/${encodeURIComponent(key)}.send`;
  }
  const server3 = key.match(/^sctp(\d+)t[\w-]+$/);
  if (server3) {
    return `https://${server3[1]}.push.ft07.com/send/${encodeURIComponent(key)}.send`;
  }
  throw new Error("Server酱 SendKey 格式无效");
}

function defaultRequest(url, headers, body) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, {
      method: "POST",
      headers: Object.assign({}, headers, { "Content-Length": Buffer.byteLength(body) })
    }, (response) => {
      let content = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        if (content.length < 65536) content += chunk;
      });
      response.on("end", () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`Server酱 HTTP ${response.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(content || "{}"));
        } catch (error) {
          reject(new Error("Server酱响应不是合法 JSON"));
        }
      });
    });
    request.setTimeout(8000, () => request.destroy(new Error("Server酱请求超时")));
    request.on("error", reject);
    request.end(body);
  });
}

function reportPeriod(delivery) {
  const period = delivery && delivery.report && delivery.report.period || {};
  return `${period.start || ""}~${period.end || ""}`.replaceAll("-", ".");
}

async function sendServerChanNotification({ delivery, timestamp, env, request }) {
  const source = env || process.env;
  const sendKey = String(source.SERVERCHAN_SENDKEY || "").trim();
  if (!sendKey) return { status: "not_configured", message: "Server酱 SendKey 尚未配置" };

  try {
    const endpoint = serverChanEndpoint(sendKey);
    const body = new URLSearchParams({
      title: "健身周报已生成",
      desp: `VikiSize 已收到 ${reportPeriod(delivery)} 的健身周报。\n\n打开微信小程序「VikiSize」查看报告与计划变更。`
    }).toString();
    const response = await (request || defaultRequest)(endpoint, {
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
    }, body);
    if (!response || Number(response.code) !== 0) {
      throw new Error(truncate(response && (response.message || response.msg) || "Server酱发送失败", 100));
    }
    return { status: "sent", sentAt: timestamp };
  } catch (error) {
    return { status: "failed", message: truncate(error.message || "Server酱发送失败", 120) };
  }
}

module.exports = {
  defaultRequest,
  sendServerChanNotification,
  serverChanEndpoint
};

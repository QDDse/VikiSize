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

function reportView(delivery) {
  const report = delivery && delivery.report || {};
  return {
    schemaVersion: "fitness_report_view_v1",
    generatedAt: delivery && delivery.generatedAt || "",
    report: {
      period: report.period || {},
      summary: truncate(report.summary, 500),
      metrics: Array.isArray(report.metrics) ? report.metrics.slice(0, 6).map((item) => ({
        key: truncate(item.key, 40),
        label: truncate(item.label, 30),
        value: item.value,
        unit: truncate(item.unit, 12)
      })) : [],
      insights: Array.isArray(report.insights) ? report.insights.slice(0, 5).map((item) => truncate(item, 240)) : [],
      recommendations: Array.isArray(report.recommendations) ? report.recommendations.slice(0, 5).map((item) => truncate(item, 240)) : []
    }
  };
}

function reportUrl(delivery, baseUrl) {
  const raw = String(baseUrl || "").trim();
  if (!/^https:\/\//i.test(raw)) return "";
  const encoded = Buffer.from(JSON.stringify(reportView(delivery)), "utf8").toString("base64url");
  return `${raw.replace(/#.*$/, "")}#report=${encoded}`;
}

function markdownCell(value) {
  return truncate(value, 60).replaceAll("|", "\\|").replace(/[\r\n]+/g, " ");
}

function metricValue(metric) {
  if (!metric || metric.value === null || metric.value === undefined || metric.value === "") return "暂无";
  return `${metric.value}${metric.unit ? ` ${metric.unit}` : ""}`;
}

function activeDaysTitle(report) {
  const metric = (report.metrics || []).find((item) => item && item.key === "active_days");
  return metric && metric.value !== undefined ? `健身周报｜${metric.value} 天训练` : "健身周报已生成";
}

function detailedDescription(delivery, h5Url) {
  const report = delivery && delivery.report || {};
  const lines = [
    `# 训练周报 · ${reportPeriod(delivery)}`,
    "",
    `> ${truncate(report.summary, 500) || "本期报告已生成"}`
  ];
  const metrics = Array.isArray(report.metrics) ? report.metrics.slice(0, 6) : [];
  if (metrics.length) {
    lines.push("", "## 关键指标", "", "| 指标 | 结果 |", "| --- | --- |");
    metrics.forEach((item) => lines.push(`| ${markdownCell(item.label || item.key)} | ${markdownCell(metricValue(item))} |`));
  }
  const insights = Array.isArray(report.insights) ? report.insights.slice(0, 5) : [];
  if (insights.length) {
    lines.push("", "## 关键洞察", "");
    insights.forEach((item) => lines.push(`- ${truncate(item, 240)}`));
  }
  const recommendations = Array.isArray(report.recommendations) ? report.recommendations.slice(0, 5) : [];
  if (recommendations.length) {
    lines.push("", "## 下周建议", "");
    recommendations.forEach((item, index) => lines.push(`${index + 1}. ${truncate(item, 240)}`));
  }
  if (h5Url) lines.push("", `[打开完整 H5 报告](${h5Url})`);
  lines.push("", "完整记录仍保存在 VikiSize 小程序收件箱。");
  return lines.join("\n");
}

async function sendServerChanNotification({ delivery, timestamp, env, request }) {
  const source = env || process.env;
  const sendKey = String(source.SERVERCHAN_SENDKEY || "").trim();
  if (!sendKey) return { status: "not_configured", message: "Server酱 SendKey 尚未配置" };

  try {
    const endpoint = serverChanEndpoint(sendKey);
    const detailed = String(source.FITNESS_SERVERCHAN_DETAIL_LEVEL || "minimal").trim() === "report";
    const h5Url = detailed ? reportUrl(delivery, source.FITNESS_REPORT_H5_URL) : "";
    const report = delivery && delivery.report || {};
    const body = new URLSearchParams({
      title: detailed ? activeDaysTitle(report) : "健身周报已生成",
      desp: detailed
        ? detailedDescription(delivery, h5Url)
        : `VikiSize 已收到 ${reportPeriod(delivery)} 的健身周报。\n\n打开微信小程序「VikiSize」查看报告与计划变更。`
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
  detailedDescription,
  reportUrl,
  reportView,
  sendServerChanNotification,
  serverChanEndpoint
};

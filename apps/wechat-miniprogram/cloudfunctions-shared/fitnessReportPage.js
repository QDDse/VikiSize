function renderFitnessReportPage() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="color-scheme" content="light">
  <title>VikiSize · 健身周报</title>
  <style>
    :root { color-scheme: light; --ink:#12233f; --muted:#64748b; --line:#dce5ef; --paper:#f4f7fb; --card:#fff; --navy:#102964; --mint:#75e2c4; --green:#177c67; }
    * { box-sizing:border-box; }
    html, body { max-width:100%; overflow-x:hidden; width:100%; }
    body { margin:0; background:linear-gradient(180deg,#edf3f8 0,#f8fafc 54%,#edf4f1 100%); color:var(--ink); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; min-height:100vh; }
    .shell { margin:0 auto; max-width:760px; overflow:hidden; padding:28px 18px calc(48px + env(safe-area-inset-bottom)); width:100%; }
    .brand { align-items:flex-end; display:flex; gap:16px; justify-content:space-between; margin:0 4px 22px; min-width:0; }
    .brand-word { font-size:30px; font-weight:950; letter-spacing:-1.5px; line-height:.85; }
    .brand-tag { border:1px solid #9aa9ba; border-radius:999px; font-size:12px; font-weight:800; max-width:48%; overflow:hidden; padding:6px 12px; text-overflow:ellipsis; white-space:nowrap; }
    .hero { background:radial-gradient(circle at 88% 0,rgba(117,226,196,.22),transparent 34%),linear-gradient(145deg,#0e2356,#183879); border-radius:28px; box-shadow:0 24px 60px rgba(16,41,100,.20); color:#fff; max-width:100%; overflow:hidden; padding:28px; }
    .eyebrow { color:var(--mint); font-size:13px; font-weight:900; letter-spacing:.12em; }
    .period { color:#cbd9f2; font-size:13px; margin-top:10px; }
    h1 { font-size:30px; letter-spacing:-.7px; line-height:1.28; margin:18px 0 0; overflow-wrap:anywhere; word-break:break-word; }
    .metrics { display:grid; gap:12px; grid-template-columns:repeat(3,minmax(0,1fr)); margin-top:16px; max-width:100%; }
    .metric { background:var(--card); border:1px solid rgba(220,229,239,.9); border-radius:20px; box-shadow:0 12px 28px rgba(18,35,63,.06); min-width:0; padding:18px; }
    .metric-label { color:var(--muted); font-size:12px; font-weight:750; }
    .metric-value { font-size:28px; font-variant-numeric:tabular-nums; font-weight:950; margin-top:8px; overflow-wrap:anywhere; }
    .metric-unit { color:var(--muted); font-size:12px; font-weight:700; margin-left:4px; }
    .section { margin-top:28px; }
    .section-head { align-items:center; display:flex; justify-content:space-between; margin:0 4px 12px; }
    h2 { font-size:20px; letter-spacing:-.2px; margin:0; }
    .section-note { color:var(--muted); font-size:11px; }
    .list { display:grid; gap:10px; }
    .row { align-items:flex-start; background:var(--card); border:1px solid var(--line); border-radius:18px; display:flex; gap:14px; line-height:1.58; min-width:0; overflow-wrap:anywhere; padding:16px; }
    .marker { align-items:center; background:#dff7ef; border-radius:12px; color:var(--green); display:flex; flex:0 0 auto; font-size:12px; font-weight:900; height:28px; justify-content:center; width:28px; }
    .privacy { background:#e8f5f0; border:1px solid #c5e6da; border-radius:18px; color:#315e52; font-size:12px; line-height:1.6; margin-top:28px; padding:15px 17px; }
    .footer { color:#7b899b; font-size:11px; line-height:1.6; margin-top:18px; text-align:center; }
    .error { background:#fff1f2; border:1px solid #fecdd3; border-radius:22px; color:#9f1239; line-height:1.6; padding:22px; }
    [hidden] { display:none !important; }
    @media (max-width:520px) { .shell{padding-top:20px}.hero{border-radius:24px;padding:24px}h1{font-size:25px}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.metric-value{font-size:24px} }
  </style>
</head>
<body>
  <main class="shell">
    <header class="brand"><div class="brand-word">Fitness<br>PlanOps</div><div class="brand-tag">VikiSize REPORT</div></header>
    <div id="error" class="error" hidden></div>
    <div id="report" hidden>
      <section class="hero"><div class="eyebrow">训练 × 身体 × 恢复</div><div id="period" class="period"></div><h1 id="summary"></h1></section>
      <section id="metrics" class="metrics"></section>
      <section id="insightsSection" class="section"><div class="section-head"><h2>关键洞察</h2><span class="section-note">FACTS & INFERENCE</span></div><div id="insights" class="list"></div></section>
      <section id="recommendationsSection" class="section"><div class="section-head"><h2>下周建议</h2><span class="section-note">NEXT ACTION</span></div><div id="recommendations" class="list"></div></section>
      <aside class="privacy">隐私说明：报告内容只存在当前链接的 # Fragment 中，不会随页面请求上传到服务器；页面也不会调用后台健康数据接口。</aside>
      <footer id="generatedAt" class="footer"></footer>
    </div>
  </main>
  <script>
    (() => {
      const byId = (id) => document.getElementById(id);
      const text = (element, value) => { element.textContent = value == null ? "" : String(value); };
      const decode = (value) => {
        const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
        const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes));
      };
      const addRow = (target, value, index, numbered) => {
        const row = document.createElement("div");
        row.className = "row";
        const marker = document.createElement("div");
        marker.className = "marker";
        text(marker, numbered ? index + 1 : "•");
        const content = document.createElement("div");
        text(content, value);
        row.append(marker, content);
        target.append(row);
      };
      try {
        const encoded = new URLSearchParams(location.hash.slice(1)).get("report");
        if (!encoded) throw new Error("链接中没有报告内容，请从最新的健身周报通知重新打开。");
        const payload = decode(encoded);
        if (!payload || payload.schemaVersion !== "fitness_report_view_v1" || !payload.report) throw new Error("报告链接格式不受支持。");
        const report = payload.report;
        const period = report.period || {};
        text(byId("period"), [period.start, period.end].filter(Boolean).join(" — "));
        text(byId("summary"), report.summary || "本期健身周报");
        (report.metrics || []).forEach((item) => {
          const card = document.createElement("article");
          card.className = "metric";
          const label = document.createElement("div");
          label.className = "metric-label";
          text(label, item.label || item.key);
          const value = document.createElement("div");
          value.className = "metric-value";
          text(value, item.value == null ? "—" : item.value);
          const unit = document.createElement("span");
          unit.className = "metric-unit";
          text(unit, item.unit || "");
          value.append(unit);
          card.append(label, value);
          byId("metrics").append(card);
        });
        (report.insights || []).forEach((item, index) => addRow(byId("insights"), item, index, false));
        (report.recommendations || []).forEach((item, index) => addRow(byId("recommendations"), item, index, true));
        byId("insightsSection").hidden = !(report.insights || []).length;
        byId("recommendationsSection").hidden = !(report.recommendations || []).length;
        text(byId("generatedAt"), payload.generatedAt ? "报告生成于 " + payload.generatedAt.replace("T", " ").slice(0, 16) : "VikiSize Personal Fitness Report");
        byId("report").hidden = false;
      } catch (error) {
        text(byId("error"), error.message || "报告链接无法解析。");
        byId("error").hidden = false;
      }
    })();
  </script>
</body>
</html>`;
}

module.exports = { renderFitnessReportPage };

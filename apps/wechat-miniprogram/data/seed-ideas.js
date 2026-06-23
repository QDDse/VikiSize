const seedIdeas = [
  {
    id: "idea-notion-source",
    title: "固定 Notion 项目源",
    source: "notion",
    type: "note",
    status: "captured",
    summary: "VikiSize 的项目源已指向固定 Notion 页面，后续自动化会从这里沉淀 PRD、Spec 与实现任务。",
    createdAt: "2026-06-23"
  },
  {
    id: "idea-wechat-first",
    title: "微信小程序作为首个运行目标",
    source: "system",
    type: "new-idea",
    status: "in-progress",
    summary: "首个应用基线聚焦微信小程序，先交付可打开、可检查、可继续扩展的产品工作台。",
    createdAt: "2026-06-23"
  },
  {
    id: "idea-pages-preview",
    title: "保留 GitHub Pages 预览面",
    source: "manual",
    type: "optimization",
    status: "spec-ready",
    summary: "现有 GitHub Pages 页面继续作为公开预览或文档入口，不被小程序启动切片替换。",
    createdAt: "2026-06-23"
  },
  {
    id: "idea-ai-skills-later",
    title: "AI 原子能力延后生成",
    source: "system",
    type: "note",
    status: "needs-review",
    summary: "等小程序源码积累出真实业务流程后，再运行 wxa-skills-generate 生成可验证的原子接口与组件。",
    createdAt: "2026-06-23"
  }
];

module.exports = {
  seedIdeas
};

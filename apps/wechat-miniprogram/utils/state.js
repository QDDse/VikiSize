const { seedIdeas } = require("../data/seed-ideas");

const projectMeta = {
  name: "VikiSize",
  direction: "微信小程序优先的产品工作台",
  currentTarget: "建立可运行的小程序启动骨架",
  notionSource: "VikiSize Notion project page",
  pagesPreview: "https://qddse.github.io/VikiSize/"
};

const statusLabels = {
  captured: "已捕获",
  "spec-ready": "规格就绪",
  "in-progress": "执行中",
  "needs-review": "待复核"
};

const typeLabels = {
  "new-idea": "新增想法",
  optimization: "优化",
  note: "记录"
};

function getIdeas() {
  return seedIdeas.map((idea) => ({
    ...idea,
    statusLabel: statusLabels[idea.status],
    typeLabel: typeLabels[idea.type]
  }));
}

function groupIdeasByStatus() {
  const grouped = {};

  getIdeas().forEach((idea) => {
    if (!grouped[idea.status]) {
      grouped[idea.status] = {
        status: idea.status,
        label: idea.statusLabel,
        ideas: []
      };
    }

    grouped[idea.status].ideas.push(idea);
  });

  return ["captured", "spec-ready", "in-progress", "needs-review"]
    .filter((status) => grouped[status])
    .map((status) => grouped[status]);
}

function getPipeline() {
  return [
    {
      id: "source",
      label: "Notion 源",
      status: "已固定",
      detail: "项目源已记录在启动 spec 中。"
    },
    {
      id: "spec",
      label: "启动 Spec",
      status: "已就绪",
      detail: "小程序首版范围、目录与验收标准已明确。"
    },
    {
      id: "implementation",
      label: "小程序骨架",
      status: "执行中",
      detail: "当前切片使用本地数据，不接入后端服务。"
    },
    {
      id: "validation",
      label: "本地校验",
      status: "待完成",
      detail: "完成文件、JSON 与依赖检查后再进入人工体验。"
    },
    {
      id: "ai-skills",
      label: "AI 原子能力",
      status: "稍后",
      detail: "等业务源码成型后再运行 wxa-skills-generate。"
    }
  ];
}

function getChecklist() {
  return [
    { id: "files", label: "小程序必需文件存在", done: true },
    { id: "local-data", label: "首版仅使用本地种子数据", done: true },
    { id: "pages-preview", label: "GitHub Pages 预览保留", done: true },
    { id: "appid", label: "上传前替换真实 AppID", done: false },
    { id: "wechat-cli", label: "用微信开发者工具导入检查", done: false }
  ];
}

function getProjectMeta() {
  return projectMeta;
}

module.exports = {
  getChecklist,
  getIdeas,
  getPipeline,
  getProjectMeta,
  groupIdeasByStatus
};

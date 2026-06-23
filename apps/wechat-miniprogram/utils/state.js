const { seedIdeas } = require("../data/seed-ideas");

const projectMeta = {
  name: "VikiSize",
  direction: "从灵感目录到小程序交付的轻量工作台",
  currentTarget: "微信小程序首版启动切片",
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
      label: "小程序 UI",
      status: "执行中",
      detail: "将基础骨架升级为可演示的产品工作台。"
    },
    {
      id: "validation",
      label: "上传验证",
      status: "已打通",
      detail: "本地部署链路已配置微信代码上传密钥。"
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
    { id: "deploy", label: "微信上传链路可用", done: true },
    { id: "ai", label: "后续生成 AI 原子能力", done: false }
  ];
}

function getHomeStats() {
  const ideas = getIdeas();
  const doneCount = getChecklist().filter((item) => item.done).length;

  return [
    { id: "ideas", label: "目录项", value: String(ideas.length), tone: "teal" },
    { id: "pipeline", label: "流程节点", value: String(getPipeline().length), tone: "ink" },
    { id: "checks", label: "已完成", value: `${doneCount}/5`, tone: "copper" }
  ];
}

function getQuickActions() {
  return [
    {
      id: "ideas",
      label: "灵感目录",
      detail: "查看已捕获的产品输入",
      target: "/pages/ideas/index"
    },
    {
      id: "progress",
      label: "交付进度",
      detail: "检查 Spec、上传和验收状态",
      target: "/pages/progress/index"
    }
  ];
}

function getProjectMeta() {
  return projectMeta;
}

module.exports = {
  getChecklist,
  getHomeStats,
  getIdeas,
  getPipeline,
  getProjectMeta,
  getQuickActions,
  groupIdeasByStatus
};

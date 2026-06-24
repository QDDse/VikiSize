const Roles = {
  OWNER: "owner",
  MEMBER: "member",
  GUEST: "guest"
};

const Modules = {
  PLANS: "plans",
  LIFE: "life",
  DECISIONS: "decisions"
};

const CardStatuses = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  PENDING_CONFIRMATION: "pending_confirmation",
  DONE: "done"
};

const TemplateTypes = {
  FAMILY_LIFE: "family_life",
  TRAVEL_TEAM: "travel_team",
  PURCHASE_DECISION: "purchase_decision",
  BLANK: "blank"
};

const TemplateTypeLabels = {
  family_life: "家庭生活",
  travel_team: "旅行空间",
  purchase_decision: "购买决策",
  blank: "空白空间"
};

const ReminderTypes = {
  ASSIGNED_TO_ME: "assigned_to_me",
  DUE_SOON: "due_soon",
  NEEDS_CONFIRMATION: "needs_confirmation"
};

const ReminderTypeLabels = {
  assigned_to_me: "分配给我",
  due_soon: "即将到期",
  needs_confirmation: "需要确认"
};

const ReminderStatusLabels = {
  pending: "待发送",
  sent: "已发送",
  failed: "发送失败",
  cancelled: "已取消"
};

const OpinionValues = {
  travel: ["agree", "unavailable", "undecided"],
  life: ["want", "do_not_want", "neutral"],
  decisions: ["support", "oppose", "watching"]
};

const StatusLabels = {
  todo: "待处理",
  in_progress: "进行中",
  pending_confirmation: "待确认",
  done: "已完成"
};

const RoleLabels = {
  owner: "管理员",
  member: "成员",
  guest: "访客"
};

const ModuleLabels = {
  plans: "计划",
  life: "生活",
  decisions: "决策"
};

const TemplateOptions = [
  {
    type: TemplateTypes.TRAVEL_TEAM,
    name: "关东东京 8 天旅行小队",
    description: "行程、任务、预算、提醒一体化协作"
  },
  {
    type: TemplateTypes.FAMILY_LIFE,
    name: "家庭生活",
    description: "共享家务、购物清单和日常待办"
  },
  {
    type: TemplateTypes.PURCHASE_DECISION,
    name: "购买决策",
    description: "跟踪候选商品、目标价和成员意见"
  },
  {
    type: TemplateTypes.BLANK,
    name: "空白空间",
    description: "从空白生活空间开始"
  }
];

module.exports = {
  CardStatuses,
  Modules,
  ModuleLabels,
  OpinionValues,
  ReminderStatusLabels,
  ReminderTypeLabels,
  ReminderTypes,
  RoleLabels,
  Roles,
  StatusLabels,
  TemplateOptions,
  TemplateTypeLabels,
  TemplateTypes
};

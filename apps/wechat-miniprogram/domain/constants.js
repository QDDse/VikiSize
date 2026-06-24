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

const ReminderTypes = {
  ASSIGNED_TO_ME: "assigned_to_me",
  DUE_SOON: "due_soon",
  NEEDS_CONFIRMATION: "needs_confirmation"
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
  owner: "Owner",
  member: "Member",
  guest: "Guest"
};

const ModuleLabels = {
  plans: "Plans",
  life: "Life",
  decisions: "Decisions"
};

const TemplateOptions = [
  {
    type: TemplateTypes.TRAVEL_TEAM,
    name: "关东东京 8 天旅行小队",
    description: "行程、任务、预算、提醒一体化协作"
  },
  {
    type: TemplateTypes.FAMILY_LIFE,
    name: "Family Life",
    description: "共享家务、购物清单和日常待办"
  },
  {
    type: TemplateTypes.PURCHASE_DECISION,
    name: "Purchase Decision",
    description: "跟踪候选商品、目标价和成员意见"
  },
  {
    type: TemplateTypes.BLANK,
    name: "Blank Space",
    description: "从空白生活空间开始"
  }
];

module.exports = {
  CardStatuses,
  Modules,
  ModuleLabels,
  OpinionValues,
  ReminderTypes,
  RoleLabels,
  Roles,
  StatusLabels,
  TemplateOptions,
  TemplateTypes
};

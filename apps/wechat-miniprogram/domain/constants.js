const Roles = {
  OWNER: "owner",
  MEMBER: "member",
  GUEST: "guest"
};

const Modules = {
  PLANS: "plans"
};

const CardStatuses = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  PENDING_CONFIRMATION: "pending_confirmation",
  DONE: "done"
};

const TemplateTypes = {
  TRAVEL_TEAM: "travel_team"
};

const TemplateTypeLabels = {
  travel_team: "旅行空间"
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
  travel: ["agree", "unavailable", "undecided"]
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
  plans: "旅行"
};

const TemplateOptions = [
  {
    type: TemplateTypes.TRAVEL_TEAM,
    name: "关东东京 8 天旅行小队",
    description: "行程、任务、预算、提醒一体化协作"
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

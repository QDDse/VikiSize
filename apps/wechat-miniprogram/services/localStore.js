const {
  CardStatuses,
  ModuleLabels,
  Modules,
  ReminderTypes,
  ReminderStatusLabels,
  ReminderTypeLabels,
  Roles,
  StatusLabels,
  TemplateOptions,
  TemplateTypeLabels,
  TemplateTypes
} = require("../domain/constants");
const { tokyoTravelTemplate } = require("../data/tokyoTravelTemplate");
const { buildTodayTravelView } = require("./travelExecution");

const STORAGE_KEY = "vikisize_life_assistant_state_v1";
let memoryState = null;

function now() {
  return new Date().toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeNode(node, index) {
  const updatedAt = now();
  return Object.assign({
    id: node.id || newId("travel-node"),
    order: index + 1,
    type: "place",
    period: "",
    startTime: "",
    endTime: "",
    title: "未命名行程",
    locationName: node.location || "",
    address: "",
    coordinate: null,
    photoUrl: "",
    rating: null,
    review: "",
    openingHours: "",
    ticketPrice: "",
    transport: { mode: node.route || "", fare: "", duration: "" },
    needsBooking: Boolean(node.booking),
    leadDays: 0,
    estimatedCost: 0,
    notes: "",
    status: "planned",
    sensitiveFields: { confirmationCode: "", internalBudgetNote: "", documentAttachmentIds: [] },
    attachmentIds: [],
    linkedCardIds: [],
    revision: 1,
    createdAt: updatedAt,
    updatedAt
  }, node, { order: index + 1 });
}

function migrateState(saved) {
  const state = clone(saved);
  if (state.version >= 2) return state;
  state.version = 2;
  state.collections.travel_plan_instances = (state.collections.travel_plan_instances || []).map((instance) => Object.assign({
    title: instance.sourceName || "旅行计划",
    startDate: instance.days && instance.days[0] ? instance.days[0].date : "",
    endDate: instance.days && instance.days.length ? instance.days[instance.days.length - 1].date : "",
    timezone: "Asia/Tokyo",
    status: instance.archivedAt ? "archived" : "planning",
    candidatePlaces: [],
    createdBy: state.currentUserId,
    revision: 1
  }, instance, {
    days: (instance.days || []).map((day, dayIndex) => Object.assign({ order: dayIndex + 1 }, day, {
      order: dayIndex + 1,
      nodes: (day.nodes || []).map(normalizeNode)
    }))
  }));
  return state;
}

function getStorage() {
  if (typeof wx === "undefined" || !wx.getStorageSync) {
    return null;
  }

  return wx;
}

function readRawState() {
  if (memoryState) {
    return clone(memoryState);
  }

  const storage = getStorage();
  if (!storage) {
    memoryState = createInitialState();
    return clone(memoryState);
  }

  const saved = storage.getStorageSync(STORAGE_KEY);
  if (saved && (saved.version === 1 || saved.version === 2)) {
    try {
      memoryState = migrateState(saved);
      storage.setStorageSync(STORAGE_KEY, memoryState);
      return clone(memoryState);
    } catch (error) {
      storage.setStorageSync(`${STORAGE_KEY}_backup_v1`, saved);
      throw new Error("本地旅行数据升级失败，原始数据已备份，请重试或联系支持");
    }
  }

  memoryState = createInitialState();
  storage.setStorageSync(STORAGE_KEY, memoryState);
  return clone(memoryState);
}

function saveRawState(state) {
  memoryState = clone(state);
  const storage = getStorage();
  if (storage) {
    storage.setStorageSync(STORAGE_KEY, state);
  }
}

function createInitialState() {
  const createdAt = now();
  const user = {
    id: "user-local-owner",
    openid: "local-openid-owner",
    displayName: "微信用户",
    avatarUrl: "",
    createdAt,
    updatedAt: createdAt
  };

  const state = {
    version: 2,
    currentUserId: user.id,
    currentSpaceId: "",
    collections: {
      users: [user],
      spaces: [],
      space_members: [],
      cards: [],
      comments: [],
      activities: [],
      reminders: [],
      attachments: [],
      member_opinions: [],
      travel_templates: [clone(tokyoTravelTemplate)],
      travel_plan_instances: [],
      invitations: []
    }
  };

  const space = createSpaceRecord(state, {
    name: "关东东京 8 天旅行小队",
    templateType: TemplateTypes.TRAVEL_TEAM,
    ownerUserId: user.id
  });
  state.currentSpaceId = space.id;
  return state;
}

function createSpaceRecord(state, input) {
  const createdAt = now();
  const space = {
    id: newId("space"),
    name: input.name,
    templateType: input.templateType,
    ownerUserId: input.ownerUserId,
    currentTemplateInstanceId: "",
    createdAt,
    updatedAt: createdAt,
    archivedAt: null
  };

  state.collections.spaces.push(space);
  state.collections.space_members.push({
    id: newId("member"),
    spaceId: space.id,
    userId: input.ownerUserId,
    role: Roles.OWNER,
    invitedBy: input.ownerUserId,
    joinedAt: createdAt,
    createdAt,
    updatedAt: createdAt
  });

  if (input.templateType === TemplateTypes.TRAVEL_TEAM) {
    createTravelInstanceFromTemplateRecord(state, space.id, input.ownerUserId);
  }

  if (input.templateType === TemplateTypes.FAMILY_LIFE) {
    createCardRecord(state, {
      spaceId: space.id,
      module: Modules.LIFE,
      title: "本周采购清单",
      description: "牛奶、鸡蛋、蔬菜、水果，按需补充。",
      ownerUserId: input.ownerUserId,
      createdBy: input.ownerUserId,
      details: { checklist: ["牛奶", "鸡蛋", "蔬菜", "水果"], quantity: "按需" }
    });
  }

  if (input.templateType === TemplateTypes.PURCHASE_DECISION) {
    createCardRecord(state, {
      spaceId: space.id,
      module: Modules.DECISIONS,
      title: "新行李箱购买决策",
      description: "比较 24 寸和 26 寸，等待目标价。",
      ownerUserId: input.ownerUserId,
      createdBy: input.ownerUserId,
      status: CardStatuses.PENDING_CONFIRMATION,
      details: { targetPrice: 699, currentPrice: 899, candidates: ["24 寸", "26 寸"] }
    });
  }

  return space;
}

function createTravelInstanceFromTemplateRecord(state, spaceId, userId) {
  const createdAt = now();
  const template = state.collections.travel_templates[0];
  const existing = state.collections.travel_plan_instances.find((item) => (
    item.spaceId === spaceId
    && item.sourceTemplateId === template.id
    && item.sourceVersion === template.version
    && !item.archivedAt
  ));
  if (existing) return existing;
  const instance = {
    id: newId("travel-instance"),
    spaceId,
    sourceTemplateId: template.id,
    sourceName: template.sourceName,
    sourceVersion: template.version,
    importedAt: createdAt,
    initialSnapshot: clone(template),
    title: template.title,
    startDate: template.startDate,
    endDate: template.days[template.days.length - 1].date,
    timezone: "Asia/Tokyo",
    status: "planning",
    candidatePlaces: [],
    days: clone(template.days).map((day, dayIndex) => Object.assign({}, day, {
      order: dayIndex + 1,
      nodes: day.nodes.map(normalizeNode)
    })),
    budgetCategories: clone(template.budgetCategories),
    createdBy: userId,
    revision: 1,
    createdAt,
    updatedAt: createdAt,
    archivedAt: null
  };

  state.collections.travel_plan_instances.push(instance);
  const space = state.collections.spaces.find((item) => item.id === spaceId);
  if (space) {
    space.currentTemplateInstanceId = instance.id;
    space.updatedAt = createdAt;
  }

  template.taskSeeds.forEach((task) => {
    createCardRecord(state, {
      spaceId,
      module: Modules.PLANS,
      title: task.title,
      description: task.description,
      ownerUserId: userId,
      createdBy: userId,
      status: task.status,
      dueAt: null,
      reminderAt: null,
      details: {
        category: task.category,
        estimatedCost: task.estimate,
        source: "tokyo-template"
      }
    });
  });

  const reminderSuggestions = template.reminders || template.reminderSuggestions || [];
  reminderSuggestions.forEach((suggestion) => {
    const title = suggestion.title || suggestion.item;
    const card = state.collections.cards.find((item) => item.spaceId === spaceId && item.title === title);
    state.collections.reminders.push({
      id: newId("reminder"),
      spaceId,
      cardId: card ? card.id : "",
      recipientUserId: userId,
      type: suggestion.type || ReminderTypes.DUE_SOON,
      scheduledAt: "",
      status: "pending",
      wechatTemplateId: "",
      createdAt,
      updatedAt: createdAt
    });
  });

  addActivityRecord(state, {
    spaceId,
    cardId: "",
    actorUserId: userId,
    type: "travel_instance_created",
    summary: "从东京模板创建了旅行小队实例"
  });

  return instance;
}

function createTravelInstanceFromTemplate(input) {
  const state = readRawState();
  assertCanWrite(state, input.spaceId);
  const template = state.collections.travel_templates.find((item) => (
    item.id === input.templateId
    && (!input.templateVersion || item.version === input.templateVersion)
  ));
  if (!template) throw new Error("旅行模板不存在");
  const existing = state.collections.travel_plan_instances.find((item) => (
    item.spaceId === input.spaceId
    && item.sourceTemplateId === template.id
    && item.sourceVersion === template.version
    && !item.archivedAt
  ));
  if (existing) return { instance: existing, created: false };
  const instance = createTravelInstanceFromTemplateRecord(state, input.spaceId, state.currentUserId);
  saveRawState(state);
  return { instance, created: true };
}

function createCardRecord(state, input) {
  const createdAt = now();
  const card = {
    id: input.id || newId("card"),
    spaceId: input.spaceId,
    module: input.module,
    title: input.title,
    description: input.description || "",
    ownerUserId: input.ownerUserId,
    participantUserIds: input.participantUserIds || [input.ownerUserId],
    status: input.status || CardStatuses.TODO,
    dueAt: input.dueAt || null,
    reminderAt: input.reminderAt || null,
    createdBy: input.createdBy,
    createdAt,
    updatedAt: createdAt,
    archivedAt: null,
    details: input.details || {}
  };

  state.collections.cards.push(card);
  addActivityRecord(state, {
    spaceId: card.spaceId,
    cardId: card.id,
    actorUserId: input.createdBy,
    type: "card_created",
    summary: `创建了卡片「${card.title}」`
  });
  return card;
}

function addActivityRecord(state, input) {
  const createdAt = now();
  const activity = {
    id: newId("activity"),
    spaceId: input.spaceId,
    cardId: input.cardId || "",
    actorUserId: input.actorUserId,
    type: input.type,
    summary: input.summary,
    createdAt
  };
  state.collections.activities.unshift(activity);
  return activity;
}

function getState() {
  return readRawState();
}

function getCurrentContext() {
  const state = readRawState();
  const user = state.collections.users.find((item) => item.id === state.currentUserId);
  const space = state.collections.spaces.find((item) => item.id === state.currentSpaceId);
  const member = space
    ? state.collections.space_members.find((item) => item.spaceId === space.id && item.userId === state.currentUserId)
    : null;

  return {
    state,
    user,
    space,
    member,
    canWrite: member ? member.role !== Roles.GUEST : false
  };
}

function listSpaces() {
  const state = readRawState();
  return state.collections.spaces
    .filter((space) => !space.archivedAt)
    .map((space) => Object.assign({}, space, {
      templateTypeLabel: TemplateTypeLabels[space.templateType] || space.templateType
    }));
}

function switchSpace(spaceId) {
  const state = readRawState();
  const exists = state.collections.spaces.some((space) => space.id === spaceId);
  if (!exists) {
    throw new Error("空间不存在");
  }
  state.currentSpaceId = spaceId;
  saveRawState(state);
}

function createSpace(input) {
  const state = readRawState();
  const userId = state.currentUserId;
  const template = TemplateOptions.find((item) => item.type === input.templateType) || TemplateOptions[3];
  const space = createSpaceRecord(state, {
    name: input.name || template.name,
    templateType: template.type,
    ownerUserId: userId
  });
  state.currentSpaceId = space.id;
  saveRawState(state);
  return space;
}

function getCards(spaceId, moduleName, includeArchived) {
  const state = readRawState();
  return state.collections.cards
    .filter((card) => card.spaceId === spaceId)
    .filter((card) => !moduleName || card.module === moduleName)
    .filter((card) => includeArchived || !card.archivedAt)
    .map((card) => Object.assign({}, card, {
      moduleLabel: ModuleLabels[card.module] || card.module,
      statusLabel: StatusLabels[card.status],
      estimateText: card.details && card.details.estimatedCost ? `¥${card.details.estimatedCost}` : ""
    }));
}

function getCardDetail(cardId) {
  const state = readRawState();
  const card = state.collections.cards.find((item) => item.id === cardId);
  if (!card) {
    return null;
  }

  return {
    card: Object.assign({}, card, {
      moduleLabel: ModuleLabels[card.module] || card.module,
      statusLabel: StatusLabels[card.status]
    }),
    comments: state.collections.comments.filter((item) => item.cardId === cardId && !item.deletedAt),
    activities: state.collections.activities.filter((item) => item.cardId === cardId),
    attachments: state.collections.attachments.filter((item) => item.cardId === cardId),
    opinions: state.collections.member_opinions.filter((item) => item.cardId === cardId)
  };
}

function assertCanWrite(state, spaceId) {
  const member = state.collections.space_members.find((item) => item.spaceId === spaceId && item.userId === state.currentUserId);
  if (!member || member.role === Roles.GUEST) {
    throw new Error("访客只能查看，不能修改");
  }
  return member;
}

function upsertCard(input) {
  const state = readRawState();
  assertCanWrite(state, input.spaceId);

  let card = null;
  if (input.id) {
    card = state.collections.cards.find((item) => item.id === input.id);
  }

  if (!card) {
    card = createCardRecord(state, {
      spaceId: input.spaceId,
      module: input.module,
      title: input.title,
      description: input.description,
      ownerUserId: input.ownerUserId || state.currentUserId,
      participantUserIds: input.participantUserIds || [state.currentUserId],
      status: input.status,
      dueAt: input.dueAt,
      reminderAt: input.reminderAt,
      createdBy: state.currentUserId,
      details: input.details || {}
    });
  } else {
    card.title = input.title || card.title;
    card.description = input.description === undefined ? card.description : input.description;
    card.status = input.status || card.status;
    card.dueAt = input.dueAt === undefined ? card.dueAt : input.dueAt;
    card.reminderAt = input.reminderAt === undefined ? card.reminderAt : input.reminderAt;
    card.details = Object.assign({}, card.details, input.details || {});
    card.updatedAt = now();
    addActivityRecord(state, {
      spaceId: card.spaceId,
      cardId: card.id,
      actorUserId: state.currentUserId,
      type: "card_updated",
      summary: `更新了卡片「${card.title}」`
    });
  }

  saveRawState(state);
  return card;
}

function advanceCardStatus(cardId) {
  const state = readRawState();
  const card = state.collections.cards.find((item) => item.id === cardId);
  if (!card) {
    throw new Error("卡片不存在");
  }
  assertCanWrite(state, card.spaceId);
  const flow = [CardStatuses.TODO, CardStatuses.IN_PROGRESS, CardStatuses.PENDING_CONFIRMATION, CardStatuses.DONE];
  const index = flow.indexOf(card.status);
  card.status = flow[Math.min(index + 1, flow.length - 1)];
  card.updatedAt = now();
  addActivityRecord(state, {
    spaceId: card.spaceId,
    cardId: card.id,
    actorUserId: state.currentUserId,
    type: "status_changed",
    summary: `状态改为「${StatusLabels[card.status]}」`
  });
  saveRawState(state);
  return card;
}

function archiveCard(cardId, archived) {
  const state = readRawState();
  const card = state.collections.cards.find((item) => item.id === cardId);
  if (!card) {
    throw new Error("卡片不存在");
  }
  assertCanWrite(state, card.spaceId);
  card.archivedAt = archived ? now() : null;
  card.updatedAt = now();
  addActivityRecord(state, {
    spaceId: card.spaceId,
    cardId: card.id,
    actorUserId: state.currentUserId,
    type: archived ? "card_archived" : "card_unarchived",
    summary: archived ? `归档了「${card.title}」` : `恢复了「${card.title}」`
  });
  saveRawState(state);
  return card;
}

function addComment(cardId, body) {
  const state = readRawState();
  const card = state.collections.cards.find((item) => item.id === cardId);
  if (!card) {
    throw new Error("卡片不存在");
  }
  assertCanWrite(state, card.spaceId);
  const createdAt = now();
  const comment = {
    id: newId("comment"),
    spaceId: card.spaceId,
    cardId,
    authorUserId: state.currentUserId,
    body,
    createdAt,
    deletedAt: null
  };
  state.collections.comments.unshift(comment);
  addActivityRecord(state, {
    spaceId: card.spaceId,
    cardId,
    actorUserId: state.currentUserId,
    type: "comment_created",
    summary: "添加了一条评论"
  });
  saveRawState(state);
  return comment;
}

function setMemberOpinion(cardId, value) {
  const state = readRawState();
  const card = state.collections.cards.find((item) => item.id === cardId);
  if (!card) {
    throw new Error("卡片不存在");
  }
  assertCanWrite(state, card.spaceId);
  const updatedAt = now();
  let opinion = state.collections.member_opinions.find((item) => item.cardId === cardId && item.userId === state.currentUserId);
  if (!opinion) {
    opinion = {
      id: newId("opinion"),
      spaceId: card.spaceId,
      cardId,
      userId: state.currentUserId,
      value,
      createdAt: updatedAt,
      updatedAt
    };
    state.collections.member_opinions.push(opinion);
  } else {
    opinion.value = value;
    opinion.updatedAt = updatedAt;
  }
  addActivityRecord(state, {
    spaceId: card.spaceId,
    cardId,
    actorUserId: state.currentUserId,
    type: "opinion_changed",
    summary: `更新了意见：${value}`
  });
  saveRawState(state);
  return opinion;
}

function scheduleReminder(cardId, type) {
  const state = readRawState();
  const card = state.collections.cards.find((item) => item.id === cardId);
  if (!card) {
    throw new Error("卡片不存在");
  }
  assertCanWrite(state, card.spaceId);
  if (![ReminderTypes.ASSIGNED_TO_ME, ReminderTypes.DUE_SOON, ReminderTypes.NEEDS_CONFIRMATION].includes(type)) {
    throw new Error("不支持的提醒类型");
  }
  const createdAt = now();
  const reminder = {
    id: newId("reminder"),
    spaceId: card.spaceId,
    cardId,
    recipientUserId: state.currentUserId,
    type,
    scheduledAt: card.reminderAt || card.dueAt || createdAt,
    status: "pending",
    wechatTemplateId: "",
    createdAt,
    updatedAt: createdAt
  };
  state.collections.reminders.push(reminder);
  saveRawState(state);
  return reminder;
}

function getTravelInstance(spaceId) {
  const state = readRawState();
  const space = state.collections.spaces.find((item) => item.id === spaceId);
  if (!space || !space.currentTemplateInstanceId) {
    return null;
  }
  const instance = state.collections.travel_plan_instances.find((item) => item.id === space.currentTemplateInstanceId) || null;
  const member = state.collections.space_members.find((item) => item.spaceId === spaceId && item.userId === state.currentUserId);
  return instance ? projectTravelInstanceForRole(instance, member ? member.role : Roles.GUEST) : null;
}

function projectTravelInstanceForRole(instance, role) {
  const projected = clone(instance);
  if (role !== Roles.GUEST) return projected;
  projected.days.forEach((day) => day.nodes.forEach((node) => {
    node.sensitiveFields = {};
    node.attachmentIds = [];
  }));
  projected.modules = (projected.modules || []).map((item) => item.sensitive ? Object.assign({}, item, { content: "" }) : item);
  return projected;
}

function getTravelInstanceRecord(state, instanceId) {
  const instance = state.collections.travel_plan_instances.find((item) => item.id === instanceId);
  if (!instance) throw new Error("旅行实例不存在");
  assertCanWrite(state, instance.spaceId);
  return instance;
}

function touchTravelInstance(instance) {
  instance.updatedAt = now();
  instance.revision = Number(instance.revision || 0) + 1;
}

function recordTravelActivity(state, instance, type, summary) {
  addActivityRecord(state, {
    spaceId: instance.spaceId,
    cardId: "",
    actorUserId: state.currentUserId,
    type,
    summary
  });
}

function createTravelDay(instanceId, input) {
  const state = readRawState();
  const instance = getTravelInstanceRecord(state, instanceId);
  const day = {
    id: newId("travel-day"),
    order: instance.days.length + 1,
    date: input.date,
    weekday: input.weekday || "",
    theme: input.theme || "新的一天",
    tips: [],
    alternatives: [],
    nodes: [],
    dining: []
  };
  if (instance.days.some((item) => item.date === day.date)) throw new Error("该日期已存在");
  instance.days.push(day);
  instance.endDate = instance.days[instance.days.length - 1].date;
  touchTravelInstance(instance);
  recordTravelActivity(state, instance, "travel_day_created", `新增了日期「${day.date}」`);
  saveRawState(state);
  return day;
}

function updateTravelDay(instanceId, dayId, patch) {
  const state = readRawState();
  const instance = getTravelInstanceRecord(state, instanceId);
  const day = instance.days.find((item) => item.id === dayId);
  if (!day) throw new Error("旅行日期不存在");
  if (patch.date && instance.days.some((item) => item.id !== dayId && item.date === patch.date)) throw new Error("该日期已存在");
  ["date", "weekday", "theme"].forEach((field) => {
    if (patch[field] !== undefined) day[field] = patch[field];
  });
  instance.startDate = instance.days[0] ? instance.days[0].date : "";
  instance.endDate = instance.days.length ? instance.days[instance.days.length - 1].date : "";
  touchTravelInstance(instance);
  recordTravelActivity(state, instance, "travel_day_updated", `更新了日期「${day.date}」`);
  saveRawState(state);
  return day;
}

function deleteTravelDay(instanceId, dayId) {
  const state = readRawState();
  const instance = getTravelInstanceRecord(state, instanceId);
  const index = instance.days.findIndex((item) => item.id === dayId);
  if (index < 0) throw new Error("旅行日期不存在");
  if (instance.days[index].nodes.length) throw new Error("请先清空当天行程");
  const removed = instance.days.splice(index, 1)[0];
  instance.days.forEach((day, dayIndex) => { day.order = dayIndex + 1; });
  touchTravelInstance(instance);
  recordTravelActivity(state, instance, "travel_day_deleted", `删除了日期「${removed.date}」`);
  saveRawState(state);
  return removed;
}

function reorderTravelDays(instanceId, orderedIds) {
  const state = readRawState();
  const instance = getTravelInstanceRecord(state, instanceId);
  if (orderedIds.length !== instance.days.length || new Set(orderedIds).size !== orderedIds.length) {
    throw new Error("日期排序数据无效");
  }
  const byId = new Map(instance.days.map((day) => [day.id, day]));
  if (orderedIds.some((id) => !byId.has(id))) throw new Error("日期排序数据无效");
  instance.days = orderedIds.map((id, index) => Object.assign(byId.get(id), { order: index + 1 }));
  instance.startDate = instance.days[0] ? instance.days[0].date : "";
  instance.endDate = instance.days.length ? instance.days[instance.days.length - 1].date : "";
  touchTravelInstance(instance);
  recordTravelActivity(state, instance, "travel_day_reordered", "调整了旅行日期顺序");
  saveRawState(state);
  return instance.days;
}

function createTravelNode(instanceId, dayId, input) {
  const state = readRawState();
  const instance = getTravelInstanceRecord(state, instanceId);
  const day = instance.days.find((item) => item.id === dayId);
  if (!day) throw new Error("旅行日期不存在");
  const node = normalizeNode(Object.assign({}, input, {
    id: newId("travel-node"),
    createdBy: state.currentUserId,
    updatedBy: state.currentUserId
  }), day.nodes.length);
  day.nodes.push(node);
  touchTravelInstance(instance);
  recordTravelActivity(state, instance, "travel_node_created", `新增了行程「${node.title}」`);
  saveRawState(state);
  return node;
}

function updateTravelNode(instanceId, dayId, nodeId, patch) {
  const state = readRawState();
  const instance = getTravelInstanceRecord(state, instanceId);
  const day = instance.days.find((item) => item.id === dayId);
  const node = day ? day.nodes.find((item) => item.id === nodeId) : null;
  if (!node) {
    throw new Error("行程节点不存在");
  }
  if (patch.expectedRevision !== undefined && Number(patch.expectedRevision) !== Number(node.revision || 1)) {
    const error = new Error("内容已被其他成员更新，请刷新后重试");
    error.code = "CONFLICT";
    throw error;
  }
  const allowed = ["type", "period", "startTime", "endTime", "title", "locationName", "address", "coordinate", "photoUrl", "rating", "review", "openingHours", "ticketPrice", "transport", "needsBooking", "leadDays", "estimatedCost", "notes", "status", "sensitiveFields"];
  allowed.forEach((field) => {
    if (patch[field] !== undefined) node[field] = patch[field];
  });
  node.updatedBy = state.currentUserId;
  node.updatedAt = now();
  node.revision = Number(node.revision || 0) + 1;
  state.collections.cards.filter((card) => card.details && card.details.sourceType === "travel_node" && card.details.sourceId === node.id).forEach((card) => {
    card.details.sourceChanged = card.details.sourceUpdatedAt !== node.updatedAt;
  });
  touchTravelInstance(instance);
  recordTravelActivity(state, instance, "travel_node_updated", `更新了行程「${node.title}」`);
  if (patch.sensitiveFields !== undefined) recordTravelActivity(state, instance, "sensitive_field_updated", "更新了敏感字段：确认信息");
  saveRawState(state);
  return node;
}

function deleteTravelNode(instanceId, dayId, nodeId) {
  const state = readRawState();
  const instance = getTravelInstanceRecord(state, instanceId);
  const day = instance.days.find((item) => item.id === dayId);
  const index = day ? day.nodes.findIndex((item) => item.id === nodeId) : -1;
  if (index < 0) throw new Error("行程节点不存在");
  const removed = day.nodes.splice(index, 1)[0];
  state.collections.cards.filter((card) => card.details && card.details.sourceType === "travel_node" && card.details.sourceId === removed.id).forEach((card) => {
    card.details.sourceDeleted = true;
  });
  day.nodes.forEach((node, nodeIndex) => { node.order = nodeIndex + 1; });
  touchTravelInstance(instance);
  recordTravelActivity(state, instance, "travel_node_deleted", `删除了行程「${removed.title}」`);
  saveRawState(state);
  return removed;
}

function duplicateTravelNode(instanceId, dayId, nodeId) {
  const state = readRawState();
  const instance = getTravelInstanceRecord(state, instanceId);
  const day = instance.days.find((item) => item.id === dayId);
  const source = day ? day.nodes.find((item) => item.id === nodeId) : null;
  if (!source) throw new Error("行程节点不存在");
  const copy = normalizeNode(Object.assign({}, clone(source), {
    id: newId("travel-node"),
    title: `${source.title}（副本）`,
    attachmentIds: [],
    linkedCardIds: [],
    createdBy: state.currentUserId,
    updatedBy: state.currentUserId
  }), day.nodes.length);
  day.nodes.push(copy);
  touchTravelInstance(instance);
  recordTravelActivity(state, instance, "travel_node_duplicated", `复制了行程「${source.title}」`);
  saveRawState(state);
  return copy;
}

function reorderTravelNodes(instanceId, dayId, orderedIds) {
  const state = readRawState();
  const instance = getTravelInstanceRecord(state, instanceId);
  const day = instance.days.find((item) => item.id === dayId);
  if (!day || orderedIds.length !== day.nodes.length) throw new Error("行程排序数据无效");
  const byId = new Map(day.nodes.map((node) => [node.id, node]));
  if (orderedIds.some((id) => !byId.has(id))) throw new Error("行程排序数据无效");
  day.nodes = orderedIds.map((id, index) => Object.assign(byId.get(id), { order: index + 1 }));
  touchTravelInstance(instance);
  recordTravelActivity(state, instance, "travel_node_reordered", `调整了「${day.theme}」的行程顺序`);
  saveRawState(state);
  return day.nodes;
}

function upsertTravelCandidate(instanceId, input) {
  const state = readRawState();
  const instance = getTravelInstanceRecord(state, instanceId);
  let candidate = input.id ? instance.candidatePlaces.find((item) => item.id === input.id) : null;
  if (!candidate) {
    candidate = {
      id: newId("travel-candidate"), title: input.title || "未命名地点", locationName: input.locationName || "",
      address: input.address || "", coordinate: input.coordinate || null, category: input.category || "place",
      photoUrl: input.photoUrl || "", notes: input.notes || "", sourceUrl: input.sourceUrl || "",
      scheduledDayId: null, scheduledNodeId: null, createdBy: state.currentUserId, createdAt: now(), updatedAt: now()
    };
    instance.candidatePlaces.push(candidate);
    recordTravelActivity(state, instance, "travel_candidate_created", `收藏了地点「${candidate.title}」`);
  } else {
    ["title", "locationName", "address", "coordinate", "category", "photoUrl", "notes", "sourceUrl"].forEach((field) => {
      if (input[field] !== undefined) candidate[field] = input[field];
    });
    candidate.updatedAt = now();
    recordTravelActivity(state, instance, "travel_candidate_updated", `更新了候选地点「${candidate.title}」`);
  }
  touchTravelInstance(instance);
  saveRawState(state);
  return candidate;
}

function scheduleTravelCandidate(instanceId, candidateId, dayId) {
  const state = readRawState();
  const instance = getTravelInstanceRecord(state, instanceId);
  const candidate = instance.candidatePlaces.find((item) => item.id === candidateId);
  const day = instance.days.find((item) => item.id === dayId);
  if (!candidate || !day) throw new Error("候选地点或日期不存在");
  if (candidate.scheduledNodeId) throw new Error("该地点已安排");
  const node = normalizeNode({
    id: newId("travel-node"), type: candidate.category || "place", title: candidate.title,
    locationName: candidate.locationName, address: candidate.address, coordinate: candidate.coordinate,
    photoUrl: candidate.photoUrl, notes: candidate.notes, sourceCandidateId: candidate.id,
    createdBy: state.currentUserId, updatedBy: state.currentUserId
  }, day.nodes.length);
  day.nodes.push(node);
  candidate.scheduledDayId = day.id;
  candidate.scheduledNodeId = node.id;
  candidate.updatedAt = now();
  touchTravelInstance(instance);
  recordTravelActivity(state, instance, "travel_candidate_scheduled", `把「${candidate.title}」安排到 ${day.date}`);
  saveRawState(state);
  return node;
}

function unscheduleTravelCandidate(instanceId, candidateId) {
  const state = readRawState();
  const instance = getTravelInstanceRecord(state, instanceId);
  const candidate = instance.candidatePlaces.find((item) => item.id === candidateId);
  if (!candidate) throw new Error("候选地点不存在");
  if (!candidate.scheduledNodeId) return candidate;
  const day = instance.days.find((item) => item.id === candidate.scheduledDayId);
  if (day) {
    const node = day.nodes.find((item) => item.id === candidate.scheduledNodeId);
    if (node && ((node.attachmentIds || []).length || (node.linkedCardIds || []).length)) {
      throw new Error("该行程已有附件或任务，暂不能撤回");
    }
    day.nodes = day.nodes.filter((item) => item.id !== candidate.scheduledNodeId);
    day.nodes.forEach((item, index) => { item.order = index + 1; });
  }
  candidate.scheduledDayId = null;
  candidate.scheduledNodeId = null;
  candidate.updatedAt = now();
  touchTravelInstance(instance);
  recordTravelActivity(state, instance, "travel_candidate_unscheduled", `将「${candidate.title}」移回待安排`);
  saveRawState(state);
  return candidate;
}

function upsertTravelModule(instanceId, input) {
  const state = readRawState();
  const instance = getTravelInstanceRecord(state, instanceId);
  instance.modules = instance.modules || [];
  let module = input.id ? instance.modules.find((item) => item.id === input.id) : null;
  const created = !module;
  if (!module) {
    module = { id: newId("travel-module"), type: input.type || "note", createdBy: state.currentUserId, createdAt: now() };
    instance.modules.push(module);
  }
  ["type", "title", "content", "dayId", "order"].forEach((field) => {
    if (input[field] !== undefined) module[field] = input[field];
  });
  module.updatedAt = now();
  touchTravelInstance(instance);
  recordTravelActivity(state, instance, created ? "travel_module_created" : "travel_module_updated", `${created ? "新增" : "更新"}了模块「${module.title || "未命名模块"}」`);
  saveRawState(state);
  return module;
}

function deleteTravelModule(instanceId, moduleId) {
  const state = readRawState();
  const instance = getTravelInstanceRecord(state, instanceId);
  const index = (instance.modules || []).findIndex((item) => item.id === moduleId);
  if (index < 0) throw new Error("旅行模块不存在");
  const removed = instance.modules.splice(index, 1)[0];
  touchTravelInstance(instance);
  recordTravelActivity(state, instance, "travel_module_deleted", `删除了模块「${removed.title || "未命名模块"}」`);
  saveRawState(state);
  return removed;
}

function createAttachmentRecord(input) {
  const state = readRawState();
  assertCanWrite(state, input.spaceId);
  if (!["image/jpeg", "image/png", "image/webp"].includes(input.mimeType)) throw new Error("仅支持 JPEG、PNG、WebP 图片");
  if (Number(input.sizeBytes || 0) > 10 * 1024 * 1024) throw new Error("图片不能超过 10MB");
  const instance = state.collections.travel_plan_instances.find((item) => item.spaceId === input.spaceId && !item.archivedAt);
  const node = instance && instance.days.flatMap((day) => day.nodes).find((item) => item.id === input.scopeId);
  if (input.scopeType !== "travel_node" || !node) throw new Error("附件关联的行程不存在");
  if (state.collections.attachments.filter((item) => item.scopeId === input.scopeId && !item.deletedAt).length >= 9) throw new Error("每个行程最多上传 9 张图片");
  const timestamp = now();
  const attachment = { id: newId("attachment"), spaceId: input.spaceId, scopeType: input.scopeType, scopeId: input.scopeId, category: input.category || "image", sensitive: input.sensitive !== undefined ? input.sensitive : ["ticket", "booking", "document"].includes(input.category), uploadedBy: state.currentUserId, cloudFileId: input.cloudFileId, mimeType: input.mimeType, width: input.width || 0, height: input.height || 0, sizeBytes: input.sizeBytes || 0, createdAt: timestamp, deletedAt: null };
  state.collections.attachments.push(attachment); node.attachmentIds = node.attachmentIds || []; node.attachmentIds.push(attachment.id);
  if (attachment.sensitive) node.sensitiveFields.documentAttachmentIds.push(attachment.id);
  touchTravelInstance(instance); recordTravelActivity(state, instance, "travel_attachment_added", `为「${node.title}」添加了图片`); saveRawState(state); return attachment;
}

function listAttachmentsForScope(spaceId, scopeId) {
  const state = readRawState(); const member = state.collections.space_members.find((item) => item.spaceId === spaceId && item.userId === state.currentUserId);
  return state.collections.attachments.filter((item) => item.spaceId === spaceId && item.scopeId === scopeId && !item.deletedAt && ((member && member.role !== Roles.GUEST) || !item.sensitive));
}

function deleteAttachment(attachmentId) {
  const state = readRawState(); const attachment = state.collections.attachments.find((item) => item.id === attachmentId && !item.deletedAt); if (!attachment) throw new Error("附件不存在"); assertCanWrite(state, attachment.spaceId);
  const instance = state.collections.travel_plan_instances.find((item) => item.spaceId === attachment.spaceId && !item.archivedAt); const node = instance && instance.days.flatMap((day) => day.nodes).find((item) => item.id === attachment.scopeId); attachment.deletedAt = now();
  if (node) { node.attachmentIds = (node.attachmentIds || []).filter((value) => value !== attachment.id); node.sensitiveFields.documentAttachmentIds = (node.sensitiveFields.documentAttachmentIds || []).filter((value) => value !== attachment.id); }
  touchTravelInstance(instance); recordTravelActivity(state, instance, "travel_attachment_deleted", `删除了「${node ? node.title : "行程"}」的图片`); saveRawState(state); return attachment;
}

function createTravelTaskFromNode(instanceId, dayId, nodeId, category) {
  const state = readRawState(); const instance = getTravelInstanceRecord(state, instanceId); const day = instance.days.find((item) => item.id === dayId); const node = day && day.nodes.find((item) => item.id === nodeId); if (!node) throw new Error("行程节点不存在");
  const existing = state.collections.cards.find((card) => !card.archivedAt && card.details && card.details.sourceType === "travel_node" && card.details.sourceId === node.id && card.details.category === category); if (existing) return { card: existing, created: false };
  const card = createCardRecord(state, { spaceId: instance.spaceId, module: Modules.PLANS, title: `处理：${node.title}`, description: node.notes || node.locationName, ownerUserId: state.currentUserId, createdBy: state.currentUserId, details: { category: category || "confirmations", sourceType: "travel_node", sourceId: node.id, generated: true, sourceUpdatedAt: node.updatedAt } });
  node.linkedCardIds = node.linkedCardIds || []; node.linkedCardIds.push(card.id); recordTravelActivity(state, instance, "travel_task_created", `从「${node.title}」创建了任务`); saveRawState(state); return { card, created: true };
}

function archiveTravelInstance(instanceId, archived) {
  const state = readRawState();
  const instance = state.collections.travel_plan_instances.find((item) => item.id === instanceId);
  if (!instance) throw new Error("旅行实例不存在");
  const member = assertCanWrite(state, instance.spaceId);
  if (member.role !== Roles.OWNER) throw new Error("只有管理员可以归档旅行");
  instance.archivedAt = archived ? now() : null;
  instance.status = archived ? "archived" : "planning";
  touchTravelInstance(instance);
  if (archived) {
    const space = state.collections.spaces.find((item) => item.id === instance.spaceId);
    if (space && space.currentTemplateInstanceId === instance.id) space.currentTemplateInstanceId = "";
  }
  recordTravelActivity(state, instance, archived ? "travel_instance_archived" : "travel_instance_unarchived", archived ? "归档了旅行计划" : "恢复了旅行计划");
  saveRawState(state);
  return instance;
}

function getTodaySummary(spaceId) {
  const state = readRawState();
  const cards = state.collections.cards.filter((card) => card.spaceId === spaceId && !card.archivedAt);
  const reminders = state.collections.reminders.filter((item) => item.spaceId === spaceId && item.status === "pending");
  const pending = cards.filter((card) => card.status === CardStatuses.PENDING_CONFIRMATION);
  const active = cards.filter((card) => card.status !== CardStatuses.DONE);
  const instance = getTravelInstance(spaceId);
  const travel = buildTodayTravelView(instance, new Date());
  return {
    activeCards: active.slice(0, 5).map((card) => Object.assign({}, card, {
      moduleLabel: ModuleLabels[card.module] || card.module,
      statusLabel: StatusLabels[card.status]
    })),
    pendingConfirmations: pending.slice(0, 3),
    reminders: reminders.slice(0, 5).map((reminder) => Object.assign({}, reminder, {
      statusLabel: ReminderStatusLabels[reminder.status] || reminder.status,
      typeLabel: ReminderTypeLabels[reminder.type] || reminder.type
    })),
    todayItinerary: travel.day,
    travelState: travel.travelState,
    daysUntilStart: travel.daysUntilStart,
    currentTravelNode: travel.currentNode,
    nextTravelNode: travel.nextNode,
    activities: state.collections.activities.filter((item) => item.spaceId === spaceId).slice(0, 6)
  };
}

function getBudgetSummary(spaceId) {
  const instance = getTravelInstance(spaceId);
  if (!instance) {
    return { categories: [], estimatedTotal: 0, confirmedTotal: 0 };
  }
  return {
    categories: instance.budgetCategories,
    estimatedTotal: instance.budgetCategories.reduce((sum, item) => sum + Number(item.estimatedCost || 0), 0),
    confirmedTotal: instance.budgetCategories.reduce((sum, item) => sum + Number(item.confirmedCost || 0), 0)
  };
}

function createInvitation(role) {
  const state = readRawState();
  const context = getCurrentContext();
  assertCanWrite(state, context.space.id);
  const createdAt = now();
  const invitation = {
    id: newId("invite"),
    spaceId: context.space.id,
    token: newId("token"),
    invitedBy: state.currentUserId,
    role: role || Roles.MEMBER,
    status: "pending",
    createdAt,
    updatedAt: createdAt
  };
  state.collections.invitations.push(invitation);
  saveRawState(state);
  return invitation;
}

function acceptInvitation(token) {
  const state = readRawState();
  const invitation = state.collections.invitations.find((item) => item.token === token);
  if (!invitation || invitation.status !== "pending") {
    throw new Error("邀请无效或已使用");
  }
  const exists = state.collections.space_members.find((item) => item.spaceId === invitation.spaceId && item.userId === state.currentUserId);
  const createdAt = now();
  if (!exists) {
    state.collections.space_members.push({
      id: newId("member"),
      spaceId: invitation.spaceId,
      userId: state.currentUserId,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
      joinedAt: createdAt,
      createdAt,
      updatedAt: createdAt
    });
  }
  invitation.status = "accepted";
  invitation.updatedAt = createdAt;
  state.currentSpaceId = invitation.spaceId;
  saveRawState(state);
  return invitation;
}

function searchCurrentSpace(keyword) {
  const context = getCurrentContext();
  const query = (keyword || "").trim().toLowerCase();
  if (!query || !context.space) {
    return [];
  }
  return getCards(context.space.id).filter((card) => {
    return `${card.title} ${card.description}`.toLowerCase().includes(query);
  });
}

function resetLocalState() {
  memoryState = createInitialState();
  const storage = getStorage();
  if (storage) {
    storage.setStorageSync(STORAGE_KEY, memoryState);
  }
}

function setCurrentUserRoleForPreview(role) {
  const state = readRawState();
  const member = state.collections.space_members.find((item) => item.spaceId === state.currentSpaceId && item.userId === state.currentUserId);
  if (!member) {
    throw new Error("当前用户不在空间中");
  }
  member.role = role;
  member.updatedAt = now();
  saveRawState(state);
}

module.exports = {
  acceptInvitation,
  addComment,
  advanceCardStatus,
  archiveCard,
  archiveTravelInstance,
  createAttachmentRecord,
  createTravelDay,
  createTravelInstanceFromTemplate,
  createTravelNode,
  createTravelTaskFromNode,
  createInvitation,
  createSpace,
  deleteTravelDay,
  deleteTravelNode,
  deleteTravelModule,
  deleteAttachment,
  duplicateTravelNode,
  getBudgetSummary,
  getCardDetail,
  getCards,
  getCurrentContext,
  getState,
  getTodaySummary,
  getTravelInstance,
  listSpaces,
  listAttachmentsForScope,
  projectTravelInstanceForRole,
  resetLocalState,
  reorderTravelNodes,
  reorderTravelDays,
  scheduleReminder,
  searchCurrentSpace,
  setMemberOpinion,
  setCurrentUserRoleForPreview,
  switchSpace,
  scheduleTravelCandidate,
  unscheduleTravelCandidate,
  updateTravelDay,
  updateTravelNode,
  upsertTravelCandidate,
  upsertTravelModule,
  upsertCard
};

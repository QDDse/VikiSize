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
  if (saved && saved.version === 1) {
    memoryState = saved;
    return clone(memoryState);
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
    version: 1,
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
  const instance = {
    id: newId("travel-instance"),
    spaceId,
    sourceTemplateId: template.id,
    sourceName: template.sourceName,
    sourceVersion: template.version,
    importedAt: createdAt,
    initialSnapshot: clone(template),
    days: clone(template.days),
    budgetCategories: clone(template.budgetCategories),
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

  template.reminderSuggestions.forEach((suggestion) => {
    const card = state.collections.cards.find((item) => item.spaceId === spaceId && item.title === suggestion.title);
    state.collections.reminders.push({
      id: newId("reminder"),
      spaceId,
      cardId: card ? card.id : "",
      recipientUserId: userId,
      type: suggestion.type,
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
  return state.collections.travel_plan_instances.find((item) => item.id === space.currentTemplateInstanceId) || null;
}

function updateTravelNode(instanceId, dayId, nodeId, patch) {
  const state = readRawState();
  const instance = state.collections.travel_plan_instances.find((item) => item.id === instanceId);
  if (!instance) {
    throw new Error("旅行实例不存在");
  }
  assertCanWrite(state, instance.spaceId);
  const day = instance.days.find((item) => item.id === dayId);
  const node = day ? day.nodes.find((item) => item.id === nodeId) : null;
  if (!node) {
    throw new Error("行程节点不存在");
  }
  Object.assign(node, patch);
  instance.updatedAt = now();
  addActivityRecord(state, {
    spaceId: instance.spaceId,
    cardId: "",
    actorUserId: state.currentUserId,
    type: "itinerary_node_updated",
    summary: `更新了行程「${node.title}」`
  });
  saveRawState(state);
  return node;
}

function getTodaySummary(spaceId) {
  const state = readRawState();
  const cards = state.collections.cards.filter((card) => card.spaceId === spaceId && !card.archivedAt);
  const reminders = state.collections.reminders.filter((item) => item.spaceId === spaceId && item.status === "pending");
  const pending = cards.filter((card) => card.status === CardStatuses.PENDING_CONFIRMATION);
  const active = cards.filter((card) => card.status !== CardStatuses.DONE);
  const instance = getTravelInstance(spaceId);
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
    todayItinerary: instance && instance.days.length ? instance.days[0] : null,
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
  createInvitation,
  createSpace,
  getBudgetSummary,
  getCardDetail,
  getCards,
  getCurrentContext,
  getState,
  getTodaySummary,
  getTravelInstance,
  listSpaces,
  resetLocalState,
  scheduleReminder,
  searchCurrentSpace,
  setMemberOpinion,
  setCurrentUserRoleForPreview,
  switchSpace,
  updateTravelNode,
  upsertCard
};

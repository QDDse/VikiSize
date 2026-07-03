// 内存版 wx-server-sdk：让云函数无需微信云环境即可单元测试。
// 语义对齐真实 SDK 的关键行为：服务端 get 默认只返回 20 条、
// where().update() 返回受影响行数、add() 支持自定义 _id。
const DEFAULT_GET_LIMIT = 20;

function clone(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function isCommand(value) {
  return value && typeof value === "object" && value.__mockCommand;
}

function matches(doc, filter) {
  return Object.entries(filter).every(([key, expected]) => {
    if (isCommand(expected)) {
      if (expected.op === "lte") return doc[key] <= expected.value;
      if (expected.op === "gte") return doc[key] >= expected.value;
      throw new Error(`mock 不支持的查询指令: ${expected.op}`);
    }
    return doc[key] === expected;
  });
}

function createMockCloud() {
  const collections = new Map();
  const sentMessages = [];
  let wxContext = { OPENID: "openid-test", APPID: "appid-test", SOURCE: "wx_client" };
  let idCounter = 0;

  function rows(name) {
    if (!collections.has(name)) collections.set(name, []);
    return collections.get(name);
  }

  function makeQuery(name, filter, limitCount) {
    return {
      where(extra) {
        return makeQuery(name, Object.assign({}, filter, extra), limitCount);
      },
      limit(count) {
        return makeQuery(name, filter, count);
      },
      async get() {
        const found = rows(name).filter((doc) => matches(doc, filter));
        return { data: clone(found.slice(0, limitCount || DEFAULT_GET_LIMIT)) };
      },
      async update({ data }) {
        const found = rows(name).filter((doc) => matches(doc, filter));
        found.forEach((doc) => {
          Object.entries(data).forEach(([key, value]) => {
            if (key !== "_id") doc[key] = clone(value);
          });
        });
        return { stats: { updated: found.length } };
      }
    };
  }

  const db = {
    command: {
      lte(value) { return { __mockCommand: true, op: "lte", value }; },
      gte(value) { return { __mockCommand: true, op: "gte", value }; }
    },
    collection(name) {
      return Object.assign(makeQuery(name, {}, null), {
        async add({ data }) {
          const doc = clone(data);
          if (doc._id === undefined) {
            idCounter += 1;
            doc._id = `mock-id-${idCounter}`;
          } else if (rows(name).some((existing) => existing._id === doc._id)) {
            throw new Error(`duplicate _id in ${name}: ${doc._id}`);
          }
          rows(name).push(doc);
          return { _id: doc._id };
        },
        doc(id) {
          return {
            async get() {
              const doc = rows(name).find((item) => item._id === id);
              return { data: doc ? clone(doc) : null };
            },
            async update({ data }) {
              const doc = rows(name).find((item) => item._id === id);
              if (!doc) throw new Error(`document not found: ${name}/${id}`);
              Object.entries(data).forEach(([key, value]) => {
                if (key !== "_id") doc[key] = clone(value);
              });
              return { stats: { updated: 1 } };
            },
            async set({ data }) {
              const index = rows(name).findIndex((item) => item._id === id);
              const doc = Object.assign(clone(data), { _id: id });
              if (index >= 0) rows(name)[index] = doc;
              else rows(name).push(doc);
              return { stats: { updated: 1 } };
            },
            async remove() {
              const index = rows(name).findIndex((item) => item._id === id);
              if (index >= 0) rows(name).splice(index, 1);
              return { stats: { removed: index >= 0 ? 1 : 0 } };
            }
          };
        }
      });
    }
  };

  const sdk = {
    DYNAMIC_CURRENT_ENV: "mock-env",
    init() {},
    database() { return db; },
    getWXContext() { return wxContext; },
    openapi: {
      subscribeMessage: {
        async send(message) {
          if (!message.touser) {
            throw new Error("send:fail invalid touser");
          }
          sentMessages.push(clone(message));
          return { errCode: 0 };
        }
      }
    }
  };

  return {
    sdk,
    sentMessages,
    seed(name, docs) {
      docs.forEach((doc) => {
        const stored = clone(doc);
        if (stored._id === undefined) {
          idCounter += 1;
          stored._id = `mock-id-${idCounter}`;
        }
        rows(name).push(stored);
      });
    },
    all(name) {
      return clone(rows(name));
    },
    setWXContext(context) {
      wxContext = Object.assign({}, wxContext, context);
    }
  };
}

module.exports = { createMockCloud };

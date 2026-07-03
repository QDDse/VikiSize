const crypto = require("crypto");
const { collection, now } = require("./cloud");

// 微信云数据库服务端单次查询上限是 100 条，默认只有 20 条；
// 所有列表查询必须显式给出 limit，避免静默截断。
const MAX_QUERY_LIMIT = 100;

function generateId(prefix) {
  const random = crypto.randomBytes(12).toString("hex");
  return prefix ? `${prefix}-${random}` : random;
}

function generateToken() {
  return crypto.randomBytes(24).toString("base64url");
}

// 单次写入完成创建：自定义 _id 并镜像到 id 字段，
// 取代旧的 add() 后再 update({id:_id}) 两段式写入（第二段失败会留下 id:"" 脏数据）。
async function addWithId(collectionName, data) {
  const _id = generateId();
  await collection(collectionName).add({ data: Object.assign({}, data, { _id, id: _id }) });
  return _id;
}

async function logActivity({ spaceId, cardId = "", actorUserId, type, summary }) {
  return addWithId("activities", {
    spaceId,
    cardId,
    actorUserId,
    type,
    summary,
    createdAt: now()
  });
}

function notFound(message) {
  const error = new Error(message);
  error.code = "NOT_FOUND";
  return error;
}

function permissionDenied(message) {
  const error = new Error(message);
  error.code = "PERMISSION_DENIED";
  return error;
}

module.exports = {
  MAX_QUERY_LIMIT,
  addWithId,
  generateId,
  generateToken,
  logActivity,
  notFound,
  permissionDenied
};

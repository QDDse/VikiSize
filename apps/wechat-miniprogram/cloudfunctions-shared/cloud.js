const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

function now() {
  return new Date().toISOString();
}

function collection(name) {
  return db.collection(name);
}

async function getOpenId() {
  const context = cloud.getWXContext();
  return context.OPENID;
}

async function getOrCreateUser(profile) {
  const openid = await getOpenId();
  const users = collection("users");
  const existing = await users.where({ openid }).limit(1).get();
  const timestamp = now();

  if (existing.data.length) {
    const user = existing.data[0];
    await users.doc(user._id).update({
      data: {
        displayName: profile && profile.displayName ? profile.displayName : user.displayName,
        avatarUrl: profile && profile.avatarUrl ? profile.avatarUrl : user.avatarUrl,
        updatedAt: timestamp
      }
    });
    return Object.assign({}, user, { id: user.id || user._id, openid });
  }

  const user = {
    id: "",
    openid,
    displayName: profile && profile.displayName ? profile.displayName : "微信用户",
    avatarUrl: profile && profile.avatarUrl ? profile.avatarUrl : "",
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const result = await users.add({ data: user });
  await users.doc(result._id).update({ data: { id: result._id } });
  return Object.assign({}, user, { id: result._id });
}

module.exports = {
  _,
  cloud,
  collection,
  db,
  getOpenId,
  getOrCreateUser,
  now
};

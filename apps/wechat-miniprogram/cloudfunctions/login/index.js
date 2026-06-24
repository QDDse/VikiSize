const { currentUser } = require("../_shared/permissions");

exports.main = async (event) => {
  const user = await currentUser(event.profile || {});
  return { user };
};

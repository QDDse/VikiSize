const { collection } = require("./_shared/cloud");
const { currentUser } = require("./_shared/permissions");
const { MAX_QUERY_LIMIT } = require("./_shared/repo");

exports.main = async (event) => {
  const user = await currentUser(event.profile || {});
  const result = await collection("fitness_deliveries").where({ userId: user.id }).limit(MAX_QUERY_LIMIT).get();
  return { deliveries: result.data.sort((left, right) => right.generatedAt.localeCompare(left.generatedAt)) };
};

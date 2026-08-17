const cloudAPI = require("miniprogram-ci/dist/common/cloud-api");
const {
  boundTransactRequest,
  get3rdCloudCodeSecret,
  initCloudAPI
} = require("miniprogram-ci/dist/ci/cloud/cloudapi");
const {
  zipFile,
  zipToBuffer
} = require("miniprogram-ci/dist/ci/cloud/utils");

function isMissingFunctionError(error) {
  return error?.code === "ResourceNotFound.Function"
    || String(error?.message || error).includes("ResourceNotFound.Function");
}

async function uploadWithCreateFallback({ upload, create }) {
  try {
    return await upload();
  } catch (error) {
    if (!isMissingFunctionError(error)) throw error;
    await create();
    return upload();
  }
}

function resolveRegion(environment) {
  const resources = [
    ...(environment.functions || []),
    ...(environment.databases || []),
    ...(environment.storages || []),
    ...(environment.logServices || [])
  ];
  return resources.find((resource) => resource.region)?.region;
}

function resolveLogService(environment) {
  const service = (environment.logServices || [])[0] || {};
  return {
    clsLogsetId: service.logsetId,
    clsTopicId: service.topicId
  };
}

function mergeEnvironmentVariables(existing, updates) {
  const merged = new Map((existing || []).map((item) => [item.key, item.value]));
  Object.entries(updates || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") merged.set(key, String(value));
  });
  return Array.from(merged, ([key, value]) => ({ key, value }));
}

async function updateCloudFunctionEnvironment({ project, env, name, variables }) {
  const updates = Object.fromEntries(Object.entries(variables || {}).filter((entry) => String(entry[1] || "") !== ""));
  if (!Object.keys(updates).length) return { updated: false, keys: [] };
  const extAppid = await project.getExtAppid();
  initCloudAPI(extAppid || project.appid);
  const transactOptions = {
    request: boundTransactRequest(project),
    transactType: cloudAPI.TransactType.IDE
  };
  const { envList } = await cloudAPI.tcbGetEnvironments({}, transactOptions);
  const environment = envList.find((item) => item.envId === env);
  if (!environment) throw new Error(`CloudBase environment not found: ${env}`);
  const region = resolveRegion(environment);
  const codeSecret = await get3rdCloudCodeSecret(project);
  const info = await cloudAPI.scfGetFunctionInfo({ namespace: env, region, functionName: name, codeSecret }, transactOptions);
  const merged = mergeEnvironmentVariables(info.environment && info.environment.variables, updates);
  await cloudAPI.scfUpdateFunctionInfo({ namespace: env, region, functionName: name, environment: { variables: merged } }, transactOptions);
  return { updated: true, keys: Object.keys(updates) };
}

/**
 * miniprogram-ci 2.1.31 checks deployment status before its create branch.
 * For a brand-new environment that check throws ResourceNotFound.Function,
 * so create the function through the same signed CloudBase API first.
 */
async function createMissingCloudFunction({
  project,
  env,
  name,
  functionPath,
  remoteNpmInstall = true,
  runtime = process.env.WECHAT_CLOUD_FUNCTION_RUNTIME || "Nodejs16.13"
}) {
  const extAppid = await project.getExtAppid();
  initCloudAPI(extAppid || project.appid);

  const transactOptions = {
    request: boundTransactRequest(project),
    transactType: cloudAPI.TransactType.IDE
  };
  const { envList } = await cloudAPI.tcbGetEnvironments({}, transactOptions);
  const environment = envList.find((item) => item.envId === env);
  if (!environment) throw new Error(`CloudBase environment not found: ${env}`);

  const region = resolveRegion(environment);
  if (!region) throw new Error(`CloudBase environment has no resource region: ${env}`);

  const archive = zipFile(functionPath, {
    ignore: remoteNpmInstall ? ["node_modules"] : undefined
  });
  const archiveBuffer = await zipToBuffer(archive);
  const codeSecret = await get3rdCloudCodeSecret(project);
  const logService = resolveLogService(environment);

  await cloudAPI.scfCreateFunction({
    functionName: name,
    code: { zipFile: archiveBuffer.toString("base64") },
    handler: "index.main",
    description: "",
    memorySize: 256,
    timeout: 10,
    environment: { variables: [] },
    role: "TCB_QcsRole",
    runtime,
    namespace: env,
    region,
    stamp: "MINI_QCBASE",
    installDependency: remoteNpmInstall,
    codeSecret,
    ...logService
  }, transactOptions);
}

module.exports = {
  createMissingCloudFunction,
  isMissingFunctionError,
  mergeEnvironmentVariables,
  resolveRegion,
  updateCloudFunctionEnvironment,
  uploadWithCreateFallback
};

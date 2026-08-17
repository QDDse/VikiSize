const localStore = require("./localStore");

function cloudAvailable() {
  return typeof wx !== "undefined" && wx.cloud && wx.cloud.callFunction;
}

async function callFunction(name, data) {
  const result = await wx.cloud.callFunction({ name, data: data || {} });
  return result.result;
}

async function listDeliveries() {
  if (cloudAvailable()) {
    try {
      const result = await callFunction("listFitnessDeliveries");
      return { items: result.deliveries || [], source: "cloud", warning: "" };
    } catch (error) {
      return { items: localStore.listFitnessDeliveries(), source: "local", warning: "云端报告暂不可用，当前展示本机缓存" };
    }
  }
  return { items: localStore.listFitnessDeliveries(), source: "local", warning: "当前为本地模式" };
}

async function getDelivery(deliveryId, markRead) {
  if (cloudAvailable()) {
    try {
      const result = await callFunction("getFitnessDelivery", { deliveryId, markRead: Boolean(markRead) });
      return { item: result.delivery, source: "cloud" };
    } catch (error) {
      const local = localStore.getFitnessDelivery(deliveryId, markRead);
      if (local) return { item: local, source: "local" };
      throw error;
    }
  }
  return { item: localStore.getFitnessDelivery(deliveryId, markRead), source: "local" };
}

async function decidePlanPatch(deliveryId, patchHash, decision, source) {
  if (source === "cloud" && cloudAvailable()) {
    const result = await callFunction("decideFitnessPlanPatch", { deliveryId, patchHash, decision });
    return result.delivery;
  }
  return localStore.decideFitnessPlanPatch(deliveryId, patchHash, decision);
}

async function createChannel() {
  if (!cloudAvailable()) throw new Error("请先配置并部署微信云开发环境");
  return callFunction("createFitnessChannel");
}

async function getNotificationSettings() {
  if (!cloudAvailable()) return { configured: false, templateId: "", status: "disabled", message: "当前为本地模式" };
  return callFunction("getFitnessNotificationSettings");
}

async function subscribeWeeklyReport(templateId) {
  if (!cloudAvailable()) throw new Error("请先配置并部署微信云开发环境");
  return callFunction("subscribeFitnessWeeklyReport", { templateId, accepted: true });
}

async function listBodyMeasurements() {
  if (cloudAvailable()) {
    try {
      const result = await callFunction("listBodyMeasurements");
      return result.measurements || [];
    } catch (error) {
      return localStore.listBodyMeasurementImports();
    }
  }
  return localStore.listBodyMeasurementImports();
}

async function importBodyMeasurement(input) {
  if (cloudAvailable()) {
    let imageFileId = input.imageFileId || "";
    if (input.tempFilePath && wx.cloud.uploadFile) {
      const extension = (input.tempFilePath.split(".").pop() || "jpg").replace(/[^a-zA-Z0-9]/g, "");
      const upload = await wx.cloud.uploadFile({
        cloudPath: `fitness/body-reports/${input.measurementId}.${extension}`,
        filePath: input.tempFilePath
      });
      imageFileId = upload.fileID;
    }
    const result = await callFunction("importBodyMeasurement", Object.assign({}, input, { imageFileId, tempFilePath: undefined }));
    return result.measurement;
  }
  return localStore.createBodyMeasurementImport(Object.assign({}, input, { imageFileId: input.tempFilePath || input.imageFileId || "" }));
}

module.exports = {
  createChannel,
  decidePlanPatch,
  getDelivery,
  getNotificationSettings,
  importBodyMeasurement,
  listBodyMeasurements,
  listDeliveries,
  subscribeWeeklyReport
};

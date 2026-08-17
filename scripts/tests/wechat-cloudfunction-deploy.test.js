const assert = require("node:assert/strict");
const test = require("node:test");

const {
  isMissingFunctionError,
  mergeEnvironmentVariables,
  uploadWithCreateFallback
} = require("../lib/wechat-cloudfunction-deploy");

test("merges selected cloud-function environment variables without deleting existing values", () => {
  assert.deepEqual(
    mergeEnvironmentVariables([{ key: "KEEP", value: "yes" }, { key: "REPLACE", value: "old" }], {
      REPLACE: "new",
      ADDED: "value",
      EMPTY: ""
    }),
    [{ key: "KEEP", value: "yes" }, { key: "REPLACE", value: "new" }, { key: "ADDED", value: "value" }]
  );
});

test("recognizes CloudBase missing-function errors", () => {
  assert.equal(isMissingFunctionError({ code: "ResourceNotFound.Function" }), true);
  assert.equal(isMissingFunctionError(new Error("ResourceNotFound.Function, function not found")), true);
  assert.equal(isMissingFunctionError(new Error("permission denied")), false);
});

test("creates a missing cloud function and retries the upload", async () => {
  const calls = [];
  let uploadCount = 0;

  const result = await uploadWithCreateFallback({
    upload: async () => {
      calls.push("upload");
      uploadCount += 1;
      if (uploadCount === 1) {
        const error = new Error("function not found");
        error.code = "ResourceNotFound.Function";
        throw error;
      }
      return { filesCount: 3 };
    },
    create: async () => {
      calls.push("create");
    }
  });

  assert.deepEqual(calls, ["upload", "create", "upload"]);
  assert.deepEqual(result, { filesCount: 3 });
});

test("does not create a function for unrelated upload failures", async () => {
  let createCalled = false;
  const failure = new Error("signature invalid");

  await assert.rejects(
    uploadWithCreateFallback({
      upload: async () => {
        throw failure;
      },
      create: async () => {
        createCalled = true;
      }
    }),
    failure
  );

  assert.equal(createCalled, false);
});

// 扁平配置，只开正确性规则（不做风格之争）。
// 小程序页面/服务与 Node 脚本共用一套；wx/Page 等全局按环境声明。
const nodeGlobals = {
  __dirname: "readonly",
  Buffer: "readonly",
  console: "readonly",
  module: "writable",
  process: "readonly",
  require: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  URL: "readonly",
  Intl: "readonly",
  exports: "writable",
  global: "writable"
};

const miniProgramGlobals = {
  App: "readonly",
  Component: "readonly",
  Page: "readonly",
  getApp: "readonly",
  getCurrentPages: "readonly",
  wx: "readonly"
};

const correctnessRules = {
  "eqeqeq": ["error", "always", { null: "ignore" }],
  "no-async-promise-executor": "error",
  "no-compare-neg-zero": "error",
  "no-cond-assign": "error",
  "no-constant-condition": ["error", { checkLoops: false }],
  "no-dupe-args": "error",
  "no-dupe-else-if": "error",
  "no-dupe-keys": "error",
  "no-duplicate-case": "error",
  "no-fallthrough": "error",
  "no-func-assign": "error",
  "no-import-assign": "error",
  "no-obj-calls": "error",
  "no-prototype-builtins": "error",
  "no-self-assign": "error",
  "no-self-compare": "error",
  "no-sparse-arrays": "error",
  "no-template-curly-in-string": "error",
  "no-undef": "error",
  "no-unmodified-loop-condition": "error",
  "no-unreachable": "error",
  "no-unsafe-negation": "error",
  "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }],
  "no-var": "error",
  "require-atomic-updates": "off",
  "use-isnan": "error",
  "valid-typeof": "error"
};

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "generated/**",
      "docs/**",
      // 收录的第三方技能包（保持上游原样，不按本仓库规则 lint）
      ".claude/skills/**",
      // 构建期从 cloudfunctions-shared/ 复制出的副本
      "apps/wechat-miniprogram/cloudfunctions/*/_shared/**",
      // 生成的模板种子
      "apps/wechat-miniprogram/data/generatedTravelTemplates.js"
    ]
  },
  {
    files: ["scripts/**/*.js", "eslint.config.js", "apps/wechat-miniprogram/cloudfunctions/**/*.js", "apps/wechat-miniprogram/cloudfunctions-shared/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: nodeGlobals
    },
    rules: correctnessRules
  },
  {
    files: ["apps/wechat-miniprogram/**/*.js"],
    ignores: ["apps/wechat-miniprogram/cloudfunctions/**", "apps/wechat-miniprogram/cloudfunctions-shared/**"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: Object.assign({}, nodeGlobals, miniProgramGlobals)
    },
    rules: correctnessRules
  }
];

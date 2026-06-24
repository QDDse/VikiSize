# VikiSize 微信小程序

这个目录保存 VikiSize 的微信小程序代码。

## 当前范围

- 四个用户主导航：今日、计划、生活、决策。
- 生活空间支持管理员、成员、访客三种角色。
- 计划、生活、决策共用统一卡片模型。
- 旅行空间从东京 8 天旅行模板生成初始内容。
- 本地预览适配器可在没有微信云开发凭据时使用。
- 云函数边界覆盖登录、空间、邀请、卡片、评论、意见、归档和提醒。
- AppID 配置在 `project.config.json`。上传密钥必须保留在仓库外。

## 手动验证

1. 打开微信开发者工具。
2. 导入目录：`apps/wechat-miniprogram/`。
3. 确认底部导航可以打开今日、计划、生活、决策。
4. 确认默认空间是 `关东东京 8 天旅行小队`。
5. 打开计划，查看行程、任务、预算、动态，并编辑一个旅行节点。
6. 打开空间设置，生成成员或访客邀请，并确认邀请页可以加入空间。

## 自动验证

在仓库根目录运行：

```bash
npm run validate:wechat
npm run test:domain
```

验证脚本会检查页面注册、配置 JSON、云函数边界、集合边界，以及旧版壳层入口文案是否仍残留。领域测试会检查模板复制为实例、权限、归档、评论和动态、邀请、提醒类型限制。

## 自动上传

仓库提供 `npm run deploy:wechat`，底层使用 `miniprogram-ci`。

必需环境变量：

- `WECHAT_APPID`：微信小程序 AppID。本地上传也可以从 `project.config.json` 读取。
- `WECHAT_UPLOAD_PRIVATE_KEY`：微信小程序管理后台的代码上传密钥。请保存为 GitHub Actions secret 或本地被忽略的 `.env` 值。

不要把小程序 AppSecret 当作 `WECHAT_UPLOAD_PRIVATE_KEY`；微信代码上传需要单独的代码上传密钥。

可选环境变量：

- `WECHAT_VERSION`：上传版本，默认使用 `package.json` 版本。
- `WECHAT_DESC`：上传说明。
- `WECHAT_ROBOT`：上传机器人编号，默认是 `1`。

GitHub Actions 使用 `.github/workflows/deploy-wechat.yml`，并依赖仓库级 `WECHAT_UPLOAD_PRIVATE_KEY` secret。

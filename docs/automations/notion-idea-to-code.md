# Notion Inspiration to Code Automation

## 目标

定时从 Notion 项目灵感文档拉取新增内容，和上一次快照做 diff；如果有新增灵感，则使用个人工作流 skill `workflow-router` 推进到代码生成、TDD 回归和 GitHub push。用户回来后只需要验收结果。

## 默认调度

- 频率：每天一次
- 时间：08:30 Asia/Shanghai
- 仓库：`QDDse/VikiSize`
- 分支命名：`codex/notion-idea-YYYYMMDD-HHmm`
- 自动化状态文件：`.codex/automation-state/notion-idea-to-code.json`

## 输入

- Notion 项目文档：收集每日灵感的项目文档或 MRD 文档
- 个人技能：`workflow-router`
- 辅助技能：`notion-mrd-prd`, `grill-me`, `decision-mapping`, `implement`, `tdd`, `review`, `diagnosing-bugs`

## 执行流程

1. 搜索并读取 Notion 中的项目灵感文档。
2. 对比上一次保存的 Notion 快照。
3. 如果没有新增内容，记录 no-op 并结束。
4. 如果有新增内容，把新增片段作为输入交给 `workflow-router`。
5. `workflow-router` 按以下链路执行：
   - 灵感文档
   - 头脑风暴或 `grill-me`
   - PRD
   - Spec
   - 代码生成
   - TDD 测试与回归
   - 个人验收待办
6. 生成代码后创建独立分支。
7. 运行可用测试。
8. 提交并 push 到 GitHub。
9. 输出验收摘要：新增灵感、生成的 PRD/Spec、代码改动、测试结果、待用户确认的问题。
10. 保存新的 Notion 快照。

## 自动化 Prompt

```text
Use $workflow-router to run my Notion inspiration-to-code automation for repository QDDse/VikiSize.

Schedule context:
- This is the recurring daily run.
- Search my Notion workspace for the project document or MRD document that collects my daily inspiration.
- Fetch the relevant pages, compare them with the previous automation snapshot, and continue only if there are new ideas.

Workflow:
1. Use $notion-mrd-prd when the source is a Notion MRD or project inspiration page.
2. Use $grill-me or $grilling when the new idea is ambiguous, risky, or underspecified.
3. Convert new ideas into PRD changes and a concrete spec.
4. Use $decision-mapping if the implementation path needs slicing.
5. Use $implement to generate or update code in this repository.
6. Use $tdd for automatable acceptance criteria and regression coverage.
7. If behavior cannot be fully validated automatically, leave explicit personal validation notes.
8. If implementation diverges from expected behavior, update the spec first, then loop back to implementation.
9. When code is ready, create a branch named codex/notion-idea-YYYYMMDD-HHmm, commit the changes, and push it to GitHub.

Output:
- Notion pages scanned
- New ideas found
- PRD and spec changes
- Code changes
- Tests run and results
- Branch pushed
- Personal validation checklist
- Open questions
```

## 验收标准

自动化完成后，用户应能直接看到：

- 一个 GitHub 分支已 push
- 代码已经按新增灵感实现到可验收状态
- 自动化测试和回归结果明确
- 个人验收 checklist 明确
- 如果无法安全实现，原因和需要补充的信息明确

## 失败策略

- Notion 文档定位不唯一：停止写入，报告候选页面。
- 没有新增内容：不创建分支，不提交代码。
- 新增内容过于模糊：运行 `grill-me` 生成问题，不进入代码生成。
- 测试失败：保留分支和失败摘要，不归档为完成。
- 个人验证依赖主观判断：保留验收 checklist，不继续猜测。

## CI/CD 接入建议

当前先做到代码生成并 push。后续接入 CI/CD 时，优先级建议如下：

1. GitHub Actions：最适合仓库内测试、lint、构建、PR 检查。
2. Trigger.dev：适合把 Notion 轮询、长流程任务和 GitHub 操作编排成可靠后台 job。
3. n8n：适合低代码连接 Notion、GitHub、Slack/邮件通知。
4. Temporal：适合以后流程变复杂、需要强状态机和可恢复执行时再上。

推荐第一步先接 GitHub Actions，因为这个项目已经在 GitHub 上，push 后能直接跑测试和生成验收信号。

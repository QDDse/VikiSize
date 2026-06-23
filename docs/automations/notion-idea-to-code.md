# Notion Inspiration to Code Automation

## 目标

定时从 Notion 的项目灵感文档拉取新增或已修改的灵感，与上一次快照做 diff，输出清晰的变更摘要。

如果没有实质变化，输出 `no-op` 摘要并结束。

如果有明确新增或优化变更，则把变化交给 `workflow-router`，推进到 PRD / Spec / 代码实现 / TDD 回归 / 代码推送 / 可部署状态。

## 运行模式

### 1. 初始化模式

首次手动执行时，用来把整个链路跑通：

- 确认 Notion 项目文档或 MRD 文档是唯一且稳定的来源
- 建立第一份快照
- 验证 PRD / Spec / 实现 / 测试 / 推送 / 部署这条链路是否能闭环
- 记录这次手动跑通结果，作为后续自动化的基线

### 2. 日常定时模式

- 每天运行一次
- 时间：08:30 Asia/Shanghai
- 仓库：`QDDse/VikiSize`
- 分支命名：`codex/notion-idea-YYYYMMDD-HHmm`
- 自动化状态文件：`.codex/automation-state/notion-idea-to-code.json`

日常模式只处理相对上一次快照的增量，不重复消费历史内容。

## 输入

- Notion 项目文档：收集每日灵感的项目文档或 MRD 文档
- 个人工作流：`workflow-router`
- 辅助技能：`notion-mrd-prd`, `grill-me`, `grilling`, `decision-mapping`, `implement`, `tdd`, `review`, `diagnosing-bugs`

## Diff 规则

将 Notion 变更分成三类：

- `新增灵感`：上次快照里没有出现的新内容
- `优化变更`：已有灵感被补充、重写、收敛、纠偏、拆分或合并
- `非实质变化`：仅标题、格式、空白、排序或元数据变化

只有 `新增灵感` 和 `优化变更` 会进入后续工作流。`非实质变化` 记为 `no-op`。

## 执行流程

1. 搜索并读取 Notion 中每日灵感所在的项目文档或 MRD 文档。
2. 如果存在多个候选页面，先报告候选，不要猜测。
3. 与上一次保存的 Notion 快照做 diff。
4. 输出本次扫描到的变更分类：
   - 新增灵感
   - 优化变更
   - 非实质变化
5. 如果没有新增灵感，也没有值得处理的优化变更，输出 `no-op` 摘要并结束。
6. 如果变化明确，把变化片段输入给 `workflow-router`。
7. `workflow-router` 的推荐链路是：
   - `notion-mrd-prd`
   - `grill-me` / `grilling`（仅在模糊、冲突、风险高时）
   - `decision-mapping`（仅在实现路径需要切片时）
   - `implement`
   - `tdd`
   - `review`
   - `diagnosing-bugs`（仅在回归失败或行为异常时）
8. 代码准备好后创建独立分支，提交并 push 到 GitHub。
9. 如仓库已有部署链路，则继续触发部署或说明部署入口；如果没有自动部署链路，则把 push 后结果和部署建议写清楚。
10. 输出验收摘要，并保存新的 Notion 快照。

## 风险分流

- 如果新增内容语义不清、边界模糊、影响面太大，先进入 `grill-me` 或 `grilling`，整理需要用户确认的问题，不进入代码生成。
- 如果多个灵感彼此重叠，先做合并和取舍，再进入 `decision-mapping`。
- 如果实现后与预期不符，先更新 Spec，再回到实现，不要只做局部补丁。
- 如果测试失败，保留分支和失败摘要，不标记为完成。

## 输出摘要

每次运行必须输出以下内容：

- Notion 页面扫描结果
- 新增灵感
- 优化变更点
- PRD / Spec 变化
- 代码改动
- 测试结果
- 分支信息
- 个人验收 checklist
- 开放问题
- 是否完成快照保存

## 自动化 Prompt

```text
Use $workflow-router to run my Notion inspiration-to-code automation for repository QDDse/VikiSize.

This run has two modes:
1. Initialization mode: if this is the first manual run, establish the baseline snapshot and walk through the full workflow once to prove the path works end to end.
2. Daily mode: compare the latest Notion page content with the previous saved snapshot and continue only when there are meaningful new ideas or refinements.

Source of truth:
- Search my Notion workspace for the project document or MRD document that collects daily ideas.
- Prefer the canonical project page if there are multiple candidates.
- Compare the fetched content with the previous automation snapshot and classify changes as new ideas, optimization changes, or non-material changes.

Workflow:
1. Use $notion-mrd-prd when the source is a Notion MRD or project inspiration page.
2. Use $grill-me or $grilling when the change is ambiguous, risky, contradictory, or underspecified.
3. Turn the accepted changes into PRD updates and a concrete spec.
4. Use $decision-mapping only when the implementation needs slicing.
5. Use $implement to generate or update code in this repository.
6. Use $tdd for automatable acceptance criteria and regression coverage.
7. Use $review after code changes to catch regressions or mismatches.
8. Use $diagnosing-bugs only when something fails, slows down, or behaves unexpectedly.
9. If behavior cannot be fully validated automatically, leave explicit personal validation notes and an acceptance checklist.
10. When code is ready, create a branch named codex/notion-idea-YYYYMMDD-HHmm, commit the changes, push to GitHub, and report the deployment handoff or deployment status.

Output:
- Notion pages scanned
- New ideas found
- Optimization changes found
- PRD and spec changes
- Code changes
- Tests run and results
- Branch pushed
- Deployment status
- Personal validation checklist
- Open questions
- Snapshot saved status
```

## 验收标准

自动化完成后，用户应能直接看到：

- 已明确这次是否为 `no-op`
- 如果有变化，变化类型和范围清楚
- 代码已经按新增灵感或优化变更实现到可验收状态
- 自动化测试和回归结果明确
- 分支已 push，且部署状态明确
- 个人验收 checklist 明确
- 如果无法安全实现，原因和需要补充的信息明确

## 失败策略

- Notion 文档定位不唯一：停止写入，报告候选页面。
- 没有新增内容或优化变更：不创建分支，不提交代码，只输出 `no-op`。
- 新增内容过于模糊：运行 `grill-me` 生成问题，不进入代码生成。
- 测试失败：保留分支和失败摘要，不归档为完成。
- 需要人工主观判断：停止在验收 checklist，等待用户确认。

## CI/CD 接入建议

如果仓库已经有部署链路，自动化的优先级建议如下：

1. GitHub Actions：最适合仓库内测试、lint、构建、PR 检查。
2. GitHub Pages / 现有部署目标：适合作为 push 后的最终发布出口。
3. Trigger.dev：适合把 Notion 轮询、长流程任务和 GitHub 操作编排成可靠后台 job。
4. n8n：适合低代码连接 Notion、GitHub、Slack / 邮件通知。
5. Temporal：适合以后流程变复杂、需要强状态机和可恢复执行时再上。

推荐先把“初始化模式”跑通，再进入日常定时模式。这样可以先确认 Notion 抓取、diff、分流、实现和推送这条链路都稳定，再放心自动化。

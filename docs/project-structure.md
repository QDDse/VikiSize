# VikiSize Project Structure

## Repository Scope

This repository should only keep files that are part of the VikiSize application or its implementation workflow.

Tracked files should be limited to:

- Application source code, including the future WeChat Mini Program under `apps/`.
- Product and implementation specs under `docs/specs/`.
- Iteration records under `docs/iterations/`, including each round's research, requirement delta, PRD decisions, technical impact, and validation notes.
- Version snapshots under `docs/versions/`, collecting the approved PRD and technical scope for a named release.
- Automation definitions and scripts under `docs/automations/` or a future `scripts/automations/`.
- Agent/repo operating docs under `AGENTS.md` and `docs/agents/`.
- Public preview files that are intentionally shipped through GitHub Pages, such as `index.html` and `.nojekyll`.
- Project metadata such as `README.md` and `LICENSE`.

## Ignored Files

Local tool state, downloaded SkillHub packages, generated snapshots, dependency folders, build output, logs, environment files, editor files, and WeChat Developer Tools private output are ignored by `.gitignore`.

Important examples:

- `.codex/` is local agent state and should not be committed.
- `skills/` is a local SkillHub download/cache area and should not be committed.
- `.codex/automation-state/` contains runtime state, not source.
- `apps/wechat-miniprogram/skills/` is not ignored by the root `skills/` rule and can be tracked later if it becomes generated app runtime code.

## Iteration Documentation

Each product iteration should create one dated directory under `docs/iterations/`:

```text
docs/iterations/YYYY-MM-DD-short-topic/
  research.md
  requirements.md
  technical-impact.md
```

- `research.md` keeps external product research, evidence links, and conclusions.
- `requirements.md` records the accepted requirement delta, priority, scope, and acceptance criteria for that round.
- `technical-impact.md` records architecture, data-model, interface, migration, and validation consequences. It can state that no technical change is required.
- Stable product requirements must also be merged into the authoritative PRD under `docs/specs/`; iteration documents are the history and evidence, not a competing source of truth.
- `docs/versions/vX.Y/` is a release-facing index and scope snapshot. It links to authoritative specs and may summarize them, but should not silently diverge from `docs/specs/`.

## Current Cleanup Notes

2026-07-03 清理已完成：重复的 `关东东京8天旅行计划.html` 已删除（`index.html` 是唯一的 GitHub Pages 入口），`generated/` 构建产物移出 git。仓库全景与常用命令见根目录 `CONTEXT.md`。

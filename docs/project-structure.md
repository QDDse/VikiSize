# VikiSize Project Structure

## Repository Scope

This repository should only keep files that are part of the VikiSize application or its implementation workflow.

Tracked files should be limited to:

- Application source code, including the future WeChat Mini Program under `apps/`.
- Product and implementation specs under `docs/specs/`.
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

## Current Cleanup Notes

The historical travel-plan HTML files are still tracked today because they were part of the original GitHub Pages version. If VikiSize is now only the app repo, those pages should be moved out of git in a separate cleanup commit after confirming the desired public preview entry point.

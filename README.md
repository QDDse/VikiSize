# VikiSize

VikiSize is the application repository for the VikiSize product work.

This repo should keep only application-related files:

- application source code
- product and implementation specs
- automation definitions and scripts
- repo/agent operating docs
- intentional public preview files

Local agent state, downloaded skills, generated snapshots, dependencies, build output, logs, private environment files, and editor state should stay out of git. See [project-structure.md](docs/project-structure.md) and [.gitignore](.gitignore).

## Current Focus

The first implementation target is a WeChat Mini Program. The startup spec is in [vikisize-wechat-miniprogram-startup-spec.md](docs/specs/vikisize-wechat-miniprogram-startup-spec.md).

GitHub Pages remains available as a lightweight public preview or documentation surface while the app source is being built.

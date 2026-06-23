# VikiSize WeChat Mini Program Startup Spec

## Status

- Stage: Spec
- Owner: Codex / follow-up implementation agent
- Source Notion page: https://app.notion.com/p/VikiSize-386e06a76a8880aca24eea2f32a58ae4?v=386e06a76a88805b9e08000cc6914415&source=copy_link
- Target repository: `QDDse/VikiSize`
- Primary target: WeChat Mini Program
- Secondary target: GitHub Pages as project preview / documentation surface

## Problem

VikiSize is moving from a static GitHub Pages site into an application product whose first real runtime target is a WeChat Mini Program.

The project needs a first implementation baseline that a later agent can use to generate code without re-deciding product scope, directory layout, build targets, or the relationship between Notion ideas and implementation work.

## Goals

- Create the first WeChat Mini Program project structure in this repository.
- Preserve the existing GitHub Pages output as a preview/documentation surface.
- Make the codebase ready for future Notion-driven idea ingestion.
- Make the codebase ready for later `wxa-skills-generate` usage once actual mini program source exists.
- Keep the first shipped slice small enough to run, inspect, and manually validate.

## Non-Goals

- Do not build iOS App support in this first implementation.
- Do not replace the GitHub Pages site with a full web app.
- Do not generate WeChat AI atomic APIs/components before there is meaningful mini program source to analyze.
- Do not depend on backend services in the first version unless a Notion idea explicitly requires one.
- Do not implement payment, login, cloud functions, or user accounts in the first project startup slice.

## Product Scope

The first mini program version should provide a simple VikiSize project shell:

- Home page showing the current product identity and active project direction.
- Idea intake / inspiration page that can display manually seeded idea entries.
- Spec / progress page that shows the current workflow state: Notion source, latest snapshot state, implementation status, and validation checklist.
- About / preview page that links the mini program direction back to the existing GitHub Pages preview when useful.

The UI should feel like a lightweight product workspace, not a marketing landing page.

## Proposed Repository Layout

Create a mini program app under:

```text
apps/wechat-miniprogram/
```

Recommended structure:

```text
apps/wechat-miniprogram/
  app.js
  app.json
  app.wxss
  project.config.json
  sitemap.json
  pages/
    home/
      index.js
      index.json
      index.wxml
      index.wxss
    ideas/
      index.js
      index.json
      index.wxml
      index.wxss
    progress/
      index.js
      index.json
      index.wxml
      index.wxss
  data/
    seed-ideas.js
  utils/
    state.js
```

Reserve future WeChat AI skill output under:

```text
apps/wechat-miniprogram/skills/
```

Do not put SkillHub-installed authoring skills inside the mini program runtime tree. The installed `wxa-skills-generate` package is tooling, not app runtime code.

## Mini Program Configuration Requirements

`app.json` must include:

- `pages` entries for `home`, `ideas`, and `progress`
- `"lazyCodeLoading": "requiredComponents"`
- a restrained navigation bar title such as `VikiSize`

`project.config.json` must be valid for WeChat Developer Tools and should avoid machine-specific absolute paths.

If no real AppID is available, use a placeholder that clearly requires replacement before upload.

## Data Model

Use local static seed data for the first version:

```js
{
  id: string,
  title: string,
  source: "notion" | "manual" | "system",
  type: "new-idea" | "optimization" | "note",
  status: "captured" | "spec-ready" | "in-progress" | "needs-review",
  summary: string,
  createdAt: string
}
```

Initial entries should reflect the current project startup state:

- Fixed Notion source has been selected.
- WeChat Mini Program is the first runtime target.
- GitHub Pages remains a preview/documentation target.
- AI skill generation is planned after mini program source exists.

## UX Requirements

- Home page should show the active product direction and one primary action into ideas/progress.
- Ideas page should list seed ideas grouped by status or type.
- Progress page should show the automation pipeline status and a manual acceptance checklist.
- Navigation should be simple and native to mini program conventions.
- Avoid dense prose in the UI; use short labels and scannable status rows.
- Use responsive mini program layout units and avoid unsupported mini program components.

## WeChat AI Skill Readiness

The implementation should prepare for future `wxa-skills-generate` work by:

- Keeping business logic in readable source files rather than one large page script.
- Keeping data access isolated in `data/` or `utils/`.
- Avoiding unnecessary `getApp().globalData` coupling.
- Avoiding plugin dependencies in the first version.
- Ensuring `app.json` contains `"lazyCodeLoading": "requiredComponents"`.
- Documenting future candidate atomic capabilities in the implementation summary.

Candidate future atomic capabilities:

- List captured ideas.
- Summarize current project progress.
- Return personal validation checklist.
- Show latest Notion diff summary after automation is connected.

## Acceptance Criteria

- A WeChat Mini Program project exists under `apps/wechat-miniprogram/`.
- The mini program has at least three runnable pages: home, ideas, progress.
- The first app uses local seed data and does not require a backend.
- `app.json` includes `"lazyCodeLoading": "requiredComponents"`.
- The app can be opened in WeChat Developer Tools after replacing placeholder AppID if needed.
- The existing GitHub Pages files remain intact.
- The implementation summary explains how future `wxa-skills-generate` should be run after source exists.

## Validation Plan

The follow-up implementation agent should run:

- Static file existence checks for mini program required files.
- JSON validation for `app.json`, `project.config.json`, and page `.json` files.
- A search check confirming no unsupported plugin dependency was introduced.
- If WeChat Developer Tools CLI is available, attempt an import/build check.
- If CLI is unavailable, report the missing local dependency and provide manual validation steps.

## Handoff Prompt For Follow-Up Agent

```text
Implement the first VikiSize WeChat Mini Program startup slice from docs/specs/vikisize-wechat-miniprogram-startup-spec.md.

Do not implement unrelated product features. Create the mini program under apps/wechat-miniprogram/, keep the existing GitHub Pages output intact, and prepare the source layout for future wxa-skills-generate usage.

After implementation, validate required files and JSON, report whether WeChat Developer Tools CLI is available, and summarize future candidate atomic capabilities for WeChat AI skill generation.
```

## Open Questions

- What real WeChat Mini Program AppID should replace the placeholder before upload?
- Should the first public preview remain GitHub Pages only, or should it later mirror mini program screenshots/build notes?
- Once Notion access is available to an agent, which exact page blocks should become the initial seed ideas?

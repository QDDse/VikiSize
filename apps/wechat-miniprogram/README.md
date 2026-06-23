# VikiSize WeChat Mini Program

This directory contains the first WeChat Mini Program startup slice for VikiSize.

## Current scope

- Three local pages: home, ideas, and progress.
- Local seed data only, with no backend, login, payment, cloud functions, or plugin dependency.
- Placeholder AppID: `touristappid`. Replace it in `project.config.json` before upload.

## Manual validation

1. Open WeChat Developer Tools.
2. Import this directory: `apps/wechat-miniprogram/`.
3. Use the test AppID for local preview, or replace `touristappid` with the real AppID before upload.
4. Confirm the tab bar opens Home, Ideas, and Progress.

## Future WeChat AI skill generation

Run `wxa-skills-generate` only after the mini program has meaningful source workflows to analyze. Candidate future atomic capabilities are:

- List captured ideas.
- Summarize current project progress.
- Return the personal validation checklist.
- Show the latest Notion diff summary after automation is connected.

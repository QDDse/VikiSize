# VikiSize WeChat Mini Program

This directory contains the first WeChat Mini Program startup slice for VikiSize.

## Current scope

- Three local pages: home, ideas, and progress.
- Local seed data only, with no backend, login, payment, cloud functions, or plugin dependency.
- AppID is configured in `project.config.json`. Upload secrets must stay outside the repository.

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


## Automated upload

This repo includes `npm run deploy:wechat`, powered by `miniprogram-ci`.

Required environment variables:

- `WECHAT_APPID`: WeChat Mini Program AppID.
- `WECHAT_UPLOAD_PRIVATE_KEY`: code upload private key from the WeChat Mini Program admin console. Store this as a GitHub Actions secret.

Do not use the Mini Program AppSecret as `WECHAT_UPLOAD_PRIVATE_KEY`; WeChat code upload requires the separate code upload private key.

Optional environment variables:

- `WECHAT_VERSION`: upload version, defaults to `package.json` version.
- `WECHAT_DESC`: upload description.
- `WECHAT_ROBOT`: upload robot number, defaults to `1`.

GitHub Actions uses `.github/workflows/deploy-wechat.yml` and expects the `WECHAT_UPLOAD_PRIVATE_KEY` repository secret.

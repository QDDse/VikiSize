# VikiSize WeChat Mini Program

This directory contains the WeChat Mini Program for VikiSize.

## Current scope

- Four user-facing tabs: home, services, records, and profile.
- Static mock data only, with no backend, login, payment, cloud functions, or plugin dependency.
- AppID is configured in `project.config.json`. Upload secrets must stay outside the repository.

## Manual validation

1. Open WeChat Developer Tools.
2. Import this directory: `apps/wechat-miniprogram/`.
3. Confirm the tab bar opens Home, Services, Records, and Profile.
4. Confirm placeholder actions show a temporary toast instead of calling unavailable services.

## Automated upload

This repo includes `npm run deploy:wechat`, powered by `miniprogram-ci`.

Required environment variables:

- `WECHAT_APPID`: WeChat Mini Program AppID. Local deploy can also read `project.config.json`.
- `WECHAT_UPLOAD_PRIVATE_KEY`: code upload private key from the WeChat Mini Program admin console. Store this as a GitHub Actions secret or local ignored `.env` value.

Do not use the Mini Program AppSecret as `WECHAT_UPLOAD_PRIVATE_KEY`; WeChat code upload requires the separate code upload private key.

Optional environment variables:

- `WECHAT_VERSION`: upload version, defaults to `package.json` version.
- `WECHAT_DESC`: upload description.
- `WECHAT_ROBOT`: upload robot number, defaults to `1`.

GitHub Actions uses `.github/workflows/deploy-wechat.yml` and expects the `WECHAT_UPLOAD_PRIVATE_KEY` repository secret.

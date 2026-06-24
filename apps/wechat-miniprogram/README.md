# VikiSize WeChat Mini Program

This directory contains the WeChat Mini Program for VikiSize.

## Current scope

- Four user-facing tabs: Today, Plans, Life, and Decisions.
- Life Spaces with Owner / Member / Guest roles.
- Shared Item Cards across Plans, Life, and Decisions.
- Travel Team MVP seeded from the Tokyo 8-day travel template.
- Local preview adapters for development without WeChat Cloud credentials.
- Cloud function boundaries for login, spaces, invitations, cards, comments, opinions, archive, and reminders.
- AppID is configured in `project.config.json`. Upload secrets must stay outside the repository.

## Manual validation

1. Open WeChat Developer Tools.
2. Import this directory: `apps/wechat-miniprogram/`.
3. Confirm the tab bar opens Today, Plans, Life, and Decisions.
4. Confirm the default space is `关东东京 8 天旅行小队`.
5. Open Plans, inspect Itinerary / Tasks / Budget / Activity, and edit a travel node.
6. Open Settings, generate a Member or Guest invitation, and confirm the invitation page can join the space.

## Automated validation

Run these checks from the repository root:

```bash
npm run validate:wechat
npm run test:domain
```

The validation checks page registration, config JSON, cloud function boundaries, collection boundaries, and absence of old registered shell entry points. The domain test checks template-to-instance copying, permissions, archive behavior, comments/activity, invitations, and reminder type restrictions.

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

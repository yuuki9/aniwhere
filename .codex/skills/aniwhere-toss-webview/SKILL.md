---
name: aniwhere-toss-webview
description: Work on Aniwhere as an Apps in Toss non-game WebView miniapp. Use for @apps-in-toss/web-framework, granite.config.ts, Toss login, geolocation permissions, ads, promotion rewards, TDS/mobile design-system work, sandbox verification, deployment readiness, and launch checklist tasks in this repository.
---

# Aniwhere Toss WebView

## Start

1. Read `GIT_CONVENTIONS.md`, `guard.md`, `README.md`, and `docs/product-decisions.md`.
2. Inspect the relevant client files before editing:
   - `client/package.json`
   - `client/granite.config.ts`
   - `client/src/shared/lib/*`
   - touched page/component files under `client/src`
3. Treat Aniwhere as an Apps in Toss non-game partner WebView service, not a browser-only SPA.
4. Prefer official Apps in Toss docs over assumptions. Browse official docs when SDK behavior, launch policy, or package guidance may have changed.

## Project Defaults

- Frontend: `client/`
- Framework: `@apps-in-toss/web-framework`
- WebView config: `client/granite.config.ts`
- WebView type: non-game/partner unless product policy changes
- Core product areas: shops, shop detail, search/explore, community, admin review, reward-related flows

## Config Checklist

- `appName` matches the Apps in Toss console app ID.
- `brand.displayName`, `brand.primaryColor`, and `brand.icon` match console/service identity.
- `permissions` include only SDK features the app actually uses.
- `web.commands.build` writes to the same directory configured by `outdir`.
- Real-device sandbox testing can reach the dev server host.
- `webViewProps.type` stays appropriate for a non-game service.

## Feature Rules

### Login

- Use `appLogin` and operational environment checks from `@apps-in-toss/web-framework`.
- Keep Toss identity separate from Aniwhere roles and user records.
- Never hard-code OAuth secrets, mTLS files, private keys, console credentials, ad IDs, or promotion codes.
- If callback URLs, terms URLs, client IDs, certificates, or console values are missing, ask for them or leave explicit placeholders.

### Permissions

- Ask permissions just in time.
- Location denial must not block search/region exploration.
- Align `granite.config.ts` permissions with actual SDK calls.

### Ads And Rewards

- Require real console-issued ad group IDs or promotion codes before wiring production behavior.
- Replace mock ads explicitly; do not leave ambiguous mock/real paths.
- Prevent duplicate reward grants with server state, a ledger, or a clearly documented guard.
- Verify reward conditions against `docs/product-decisions.md`.

### TDS And Mobile UI

- Check current official guidance before adding or changing TDS dependencies.
- Preserve Toss-style information exploration UX.
- Verify at narrow mobile widths and in Apps in Toss sandbox where possible.

## Official Links

- WebView: https://developers-apps-in-toss.toss.im/tutorials/webview.html
- Common config: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Config.html
- Permissions: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EA%B6%8C%ED%95%9C/permission.html
- Non-game checklist: https://developers-apps-in-toss.toss.im/checklist/app-nongame.html
- Login development: https://developers-apps-in-toss.toss.im/login/develop.html
- Login console: https://developers-apps-in-toss.toss.im/login/console.html
- Promotion reward: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EB%B9%84%EA%B2%8C%EC%9E%84/promotion.html
- Request review: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EC%9D%B8%ED%84%B0%EB%A0%89%EC%85%98/requestReview.html

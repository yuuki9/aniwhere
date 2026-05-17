---
name: aniwhere-toss-webview
description: Work on Aniwhere as an Apps in Toss non-game WebView miniapp. Use for @apps-in-toss/web-framework, granite.config.ts, Toss login, geolocation permissions, ads, promotion rewards, TDS/mobile design-system work, sandbox verification, deployment readiness, and launch checklist tasks in this repository.
---

# Aniwhere Toss WebView

## Start

1. Read `GIT_CONVENTIONS.md`, `guard.md`, `README.md`, and `docs/product-decisions.md`.
2. Read `.codex/skills/aniwhere-skill-workflow/references/session-operating-guard.md` and apply its TDS notice, UTF-8, PR boundary, PR description, and review-feedback rules.
3. Inspect the relevant client files before editing:
   - `client/package.json`
   - `client/granite.config.ts`
   - `client/src/shared/lib/*`
   - touched page/component files under `client/src`
4. Treat Aniwhere as an Apps in Toss non-game partner WebView service, not a browser-only SPA.
5. Prefer official Apps in Toss docs over assumptions. Browse official docs when SDK behavior, launch policy, or package guidance may have changed.
6. Treat Apps in Toss sandbox as the deciding environment for SDK-dependent behavior, especially ADS, login, permissions, navigation bar, promotion rewards, review requests, and sharing.

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
- For ADS work, start from the Apps in Toss ADS sandbox path. Local mocks and desktop browser checks can support development, but they do not prove launch readiness.
- Capture the ad lifecycle as observable behavior: load, show, impression, click, dismiss, failure, and reward-earned where relevant.
- Do not grant rewards from ad completion unless the sandbox/runtime reward-earned event and server-side duplicate guard are both accounted for.

### TDS And Mobile UI

- Check current official guidance before adding or changing TDS dependencies.
- Preserve Toss-style information exploration UX.
- Verify at narrow mobile widths and in Apps in Toss sandbox where possible.
- Before editing a route, follow `docs/tds-route-audit.md`: classify the route, search official TDS Mobile docs with the Apps in Toss MCP, record the docs checked, then classify each visible delta as `TDS-required`, `Product-approved`, or `Regression`.
- Do not wait for user-provided TDS links. Discover route-appropriate official docs for buttons, typography, lists, top/title areas, bottom CTAs, sheets, search fields, toasts, dialogs, and any other touched primitive.
- Compare route-level UI changes against current main behavior before removing `Ait*` route elements. If an adapter migration changes visible layout, call out whether the change is required by TDS guidance or is a product/design decision.
- Page code uses the project TDS facade (`@aniwhere/tds-mobile`), not direct `@toss/tds-mobile` or `@toss/tds-mobile-ait` imports. This is a build-target boundary: Apps in Toss/ads/local builds must resolve to official TDS, while public/domain builds may resolve to local fallback to avoid Toss-only runtime leakage.
- If official TDS component DOM, padding, or typography breaks a product-approved 375px main/public screen, use route-specific app-owned UI plus `--ait-*` token compatibility only with an explicit `TDS-required`, `Product-approved`, or `Regression` classification and follow-up/removal plan.
- Keep adapter work and page redesign work separate unless the user explicitly asks for the combined PR scope.

## Debugging And Implementation Loops

Use these loops when an Apps in Toss behavior breaks, an ADS integration is uncertain, or UI changes regress.

1. Build a feedback loop first: failing test, route check, headless browser assertion, mobile screenshot, SDK event log, or sandbox reproduction.
2. Reproduce the exact symptom before changing code. Wrong symptom means wrong fix.
3. List 3-5 falsifiable hypotheses before editing; for example, "If the SDK environment check is wrong, the sandbox event log will never reach ad load."
4. Instrument only the boundary that distinguishes the hypotheses. Use temporary `[DEBUG-...]` prefixes and remove them before completion.
5. Fix one vertical slice at a time: one user-visible behavior, one check, minimal code, then refactor.
6. End with the original repro, relevant build command, and sandbox status. Mark SDK-only gaps as `Needs sandbox` instead of passed.

### Launch Review

- Use `$aniwhere-launch-checklist` before submission, deployment review, or any release candidate.
- Do not mark SDK-dependent items passed unless they were checked in Apps in Toss sandbox or on a real mobile device.

## Official Links

- WebView: https://developers-apps-in-toss.toss.im/tutorials/webview.html
- Common config: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Config.html
- Permissions: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EA%B6%8C%ED%95%9C/permission.html
- Non-game checklist: https://developers-apps-in-toss.toss.im/checklist/app-nongame.html
- Login development: https://developers-apps-in-toss.toss.im/login/develop.html
- Login console: https://developers-apps-in-toss.toss.im/login/console.html
- Promotion reward: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EB%B9%84%EA%B2%8C%EC%9E%84/promotion.html
- Request review: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EC%9D%B8%ED%84%B0%EB%A0%89%EC%85%98/requestReview.html

---
name: aniwhere-launch-checklist
description: Run Aniwhere's Apps in Toss non-game launch review checklist. Use before release, deployment, PR review, sandbox testing, or when checking rejection risks for WebView config, navigation, login, permissions, UX, ads, rewards, sharing, performance, and mobile behavior.
---

# Aniwhere Launch Checklist

## Start

1. Read `GIT_CONVENTIONS.md`, `guard.md`, `README.md`, and `docs/product-decisions.md`.
2. Read `docs/agent-skills.md`, `docs/design-tokens.md`, and `docs/ux-mobile-research.md` when UI is in scope.
3. Inspect `client/granite.config.ts`, `client/package.json`, and touched client files.
4. Prefer official Apps in Toss launch docs when any checklist item is ambiguous or may have changed.

## Required Evidence

Collect evidence before marking an item passed:

- Build output from `npm.cmd run build` in `client/`.
- Current `client/granite.config.ts` values.
- Screen or manual notes for navigation, first screen, search/explore, detail, community, and admin paths.
- Sandbox/mobile-device notes for SDK-only features such as login, permissions, ads, rewards, review requests, and sharing.

If an item cannot be verified locally, mark it `Needs sandbox` or `Needs console value`; do not mark it passed.

## Checklist

### 1. App Identity And Build

- `appName` matches the Apps in Toss console app ID.
- `brand.displayName` matches the Korean service name registered in console.
- `brand.primaryColor` matches the service token `--ait-color-brand`.
- `brand.icon` is a real console-hosted image URL before launch.
- `webViewProps.type` is `partner` for non-game.
- Build produces `client/aniwhere-client.ait`.

### 2. Navigation

- Apps in Toss non-game navigation bar is enabled.
- Back behavior is clear on every screen.
- Toss navigation back and app-owned back controls are not duplicated confusingly.
- Home button behavior is intentional when enabled.
- Right-side miniapp function buttons are limited and necessary.
- More menu/common Toss functions are not blocked.
- Floating tab bar, if used, follows Toss-style behavior and does not obscure primary content.

### 3. Entry And Core Features

- Miniapp opens normally from the configured scheme.
- All functions registered as app functions work inside the miniapp.
- Scheme entry and back navigation work together.
- Intro explains what Aniwhere does before login or permission prompts.
- Search, explore, shop detail, community, and admin paths are reachable.

### 4. User Identity And Persistence

- Toss login or user identity is handled only where product scope requires it.
- Aniwhere user roles and service records remain separate from Toss identity.
- Required user data persists after closing and reopening the miniapp.
- Disconnect/logout behavior does not leave stale sensitive user data.

### 5. Permissions

- Location permission is requested only after value is explained.
- Denying location still allows region/search exploration.
- `granite.config.ts` permissions match actual SDK usage.
- No permission is requested only because it might be useful later.

### 6. UX And Content

- Miniapp uses light mode.
- No bottom sheet opens automatically on first entry.
- No screen transition forces user action through a bottom sheet.
- Every screen has a clear way to leave or go back.
- CTA text makes the next action predictable.
- Copy avoids profanity, illegal content, excessive slang, and misleading reward claims.
- User confirmation or important guidance uses TDS-style modal/patterns.
- UI styling follows `client/src/styles/tokens.css`.

### 7. Interaction And Performance

- Scroll, touch, and screen transitions respond within 2 seconds.
- Pinch zoom is disabled unless required by map behavior.
- External links open correctly.
- Network and memory usage do not spike abnormally during normal flows.
- Map/list/detail interactions remain usable on a 375px-wide viewport.

### 8. Login-Specific Checks

Apply only if Toss login is active:

- Login terms URL is visible and valid.
- Closing the Toss login prompt exits or returns in the intended way.
- Disconnecting Toss login causes the next entry to request terms/login again.
- Non-Toss login methods are not offered inside Apps in Toss.

### 9. Ads And Rewards

Apply only if ads or rewards are active:

- Ads do not appear on intro, loading, cutscene, or temporary modal screens.
- Ads are not shown at surprising moments.
- Ads preload before playback rather than loading only at the playback moment.
- Playback returns to Aniwhere correctly.
- Rewarded ads grant rewards only after full completion.
- Duplicate rewards are prevented.
- Banner ads are placed on scrollable screens at appropriate top/middle/bottom positions.
- Reward claims match actual configured Toss promotion/ad conditions.

### 10. Sharing And Review

- Share flows do not use private `intoss-private://` links.
- Share/reward screens return to Aniwhere correctly.
- Review request prompts appear only after the user has experienced value.

### 11. Final Report

Return a concise report with:

- `Passed`
- `Needs sandbox`
- `Needs console value`
- `Risks`
- `Recommended fixes before submission`
- Exact commands run and their outputs.

## References

- Read `references/official-launch-links.md` for launch and design source links.
- Read `references/webinar-launch-skill-note.md` for the PDF-derived context.

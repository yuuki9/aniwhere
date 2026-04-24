# Aniwhere Launch Review - 2026-04-24

This review follows `.codex/skills/aniwhere-launch-checklist/SKILL.md`, `docs/agent-skills.md`, and the official Apps in Toss documents.

## Sources

- Apps in Toss WebView: https://developers-apps-in-toss.toss.im/tutorials/webview.html
- Apps in Toss non-game checklist: https://developers-apps-in-toss.toss.im/checklist/app-nongame.html
- Miniapp branding guide: https://developers-apps-in-toss.toss.im/design/miniapp-branding-guide.html
- TDS components: https://developers-apps-in-toss.toss.im/design/components.html
- TDS Mobile start: https://tossmini-docs.toss.im/tds-mobile/start/

## Superpowers Review

- `writing-skills`: already reflected by the repo-local Aniwhere skills.
- `verification-before-completion`: build and artifact verification completed.
- `requesting-code-review`: still recommended before production submission because sandbox-only SDK behavior cannot be proven locally.
- `systematic-debugging`: not needed in this pass; no local build or route blocker was found.

## Passed

- First entry page follows TDS `Top`, `ListRow`, and `Button` structure using local `--ait-*` tokens.
- Runtime imports from `@toss/tds-mobile` are intentionally avoided because the package throws outside approved Apps in Toss domains such as the public `aniwhere.link` deployment.
- Intro copy keeps one primary CTA and one secondary route, matching the one-purpose mobile UX rule.
- UI styling for custom surrounding layout is routed through `client/src/styles/tokens.css`.
- Brand title in `client/index.html` is `Aniwhere`, matching `brand.displayName`.
- `client/src/assets/aniwhere_icon.png` is a 600x600 PNG with a full square background and no transparent pixels.
- `npm.cmd run build` completed and generated `client/aniwhere-client.ait`.

## Needs Sandbox

- Common navigation back behavior on first screen and subpages.
- Toss/common navigation logo and home button behavior.
- Geolocation permission bottom sheet and denial fallback in the actual Apps in Toss environment.
- Deep link and guide URL routing from Apps in Toss console.
- Any SDK-only bridge behavior in real Toss app or sandbox.

## Needs Console Value

- `client/granite.config.ts` has `brand.icon: ''`.
- After uploading the 600x600 logo to Apps in Toss console, paste the same hosted logo URL into `brand.icon`.
- Confirm the console app name and `appName: 'aniwhere-client'` are identical.
- Confirm console function guide URLs for intro, discover/explore, shop detail, community, and admin routes.

## Feature-Gated

- Payments: not active in current client scope.
- Ads: not active in current client scope.
- Share rewards: not active in current client scope.

## Risks

- Current build warns that the main chunk is larger than 500 kB.
- Local code inspection cannot prove launch readiness for navigation, permissions, and guide URLs.
- The generated logo satisfies upload dimensions and transparency rules, but final brand approval still depends on console review.

## Commands Run

- `npm.cmd uninstall @toss/tds-mobile @toss/tds-mobile-ait`
- `npm.cmd run build`
- `npm.cmd run build:static`

Key build output:

```text
AIT build completed (aniwhere-client.ait)
dist/assets/index-CtdJ2Zby.js 1,470.05 kB
Some chunks are larger than 500 kB after minification.
```


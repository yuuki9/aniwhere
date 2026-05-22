---
name: aniwhere-launch-checklist
description: Use before Aniwhere Apps in Toss non-game launch, deployment, sandbox testing, PR review, or rejection-risk checks involving WebView config, navigation, login, permissions, UX, ads, payments, rewards, sharing, external links, TDS, and mobile behavior.
---

# Aniwhere Launch Checklist

Run this as Aniwhere's final Apps in Toss non-game review. It adapts Robin's 11-step webinar checklist to this repository and keeps official Apps in Toss docs as the source of truth when rules differ.

## Start

1. Read `GIT_CONVENTIONS.md`, `guard.md`, `README.md`, and `docs/product-decisions.md`.
2. Apply `docs/agent-hooks.md` plus the TDS, PR-boundary, UTF-8, PR-description, and review-feedback rules from `GIT_CONVENTIONS.md`, `guard.md`, `docs/agent-skills.md`, and task-specific skills before classifying risks.
3. Read `docs/agent-skills.md`, `docs/design-tokens.md`, `docs/tds-compatible-ui-layer.md`, `docs/tds-route-audit.md`, and `docs/ux-mobile-research.md` when UI is in scope.
4. Inspect `client/granite.config.ts`, `client/package.json`, `client/index.html`, and touched client files.
5. Prefer official Apps in Toss docs when any checklist item is ambiguous or may have changed.

## Evidence Rules

- Run `npm.cmd run build` in `client/` before any "ready" claim.
- Verify the generated `client/aniwhere-client.ait` exists.
- Use sandbox/mobile-device evidence for SDK-only behavior: Toss login, permissions, navigation bar, ads, payments, promotion rewards, review request, and sharing.
- Treat ADS sandbox evidence as mandatory for ad readiness. Desktop browser, public web, static build, and mocked ad behavior are not enough to classify ads as passed.
- Mark unverifiable items as `Needs sandbox` or `Needs console value`; never mark them passed from code inspection alone.

## 11-Step Checklist

### 1. Access And App Functions

- Main guide URL opens the miniapp normally.
- Every function registered in the Apps in Toss console works inside the miniapp.
- Registered function guide URLs do not return 404.
- Core Aniwhere routes are reachable: intro, search/explore, shop detail, community, and admin paths.
- No required core flow depends on leaving the miniapp for an external browser.

### 2. Navigation Bar

- Apps in Toss common navigation bar is enabled for the non-game WebView.
- App-owned back buttons, custom top headers, and custom hamburger menus are removed when they duplicate the common navigation bar.
- Common back button returns through history on subpages.
- Back on the first screen exits the miniapp instead of only refreshing.
- Toss/common logo is visible in the common navigation area.
- Accessory button uses a monochrome icon, is limited to one button, and works on registered function pages.
- Home button behavior is intentional when enabled.

Reference shape:

```ts
navigationBar: {
  withBackButton: true,
  withHomeButton: true,
  initialAccessoryButton: {
    id: 'heart',
    title: 'Heart',
    icon: { name: 'icon-heart-mono' },
  },
}
```

### 3. Login, Auth, And Permissions

Apply login checks only if Toss login is active.

- Toss login appears after an intro/value screen, not immediately on miniapp start.
- The app does not implement its own terms consent flow for Toss login terms.
- Unlink callbacks log the user out and the next login flow works.
- Withdrawal/disconnect flows clear stale sensitive user state.
- OAuth authorization code is exchanged server-side within the one-time 10-minute window.
- Toss OAuth access/refresh tokens stay server-side; the client receives Aniwhere's own session token/JWT only.
- Console callback URLs are registered for unlink/withdrawal flows.
- Permission bottom sheets follow Toss guidance and request only permissions actually used.
- Permission denial has a fallback path and re-request guidance.
- Location permission is requested only after explaining the value; denial still allows region/search exploration.

### 4. Guides And Routing

- Every console-registered guide URL renders a valid landing page.
- Function guide landing pages show the intended function and route into the miniapp correctly.
- Deep links, scheme entries, and navigation history work together.

### 5. UI And UX

- Bottom sheets never cover the whole screen without a reachable close action.
- No screen has unnecessary horizontal scroll, including 375px-wide mobile viewports.
- Favorites, saved data, and user actions are reflected immediately.
- Chance-limited features explain what happens after chances are exhausted.
- Buttons over images or media remain tappable.
- Excessive flashing or distracting animations are removed.
- Pinch zoom is disabled unless a map interaction explicitly requires it.
- Native `alert()` and `confirm()` are replaced with TDS-style or app-owned modals.
- CTAs make the next action predictable.
- Tab bars, if present, use a Toss-like profile/rounded style with appropriate spacing, icon size, and label size.
- UI styling uses `client/src/styles/tokens.css` and `docs/design-tokens.md` rather than new raw one-off values.

### 6. Text And Brand

- Service name matches `brand.displayName` and the console registration.
- `client/index.html` title and Open Graph title match the display name.
- Share copy, metadata, and visible brand strings use one consistent name.
- Subscription-like wording is absent unless the product is actually a subscription.
- Payment amounts shown in UI match the actual charged amount.
- Logo is a 600x600 square and remains visible in light/dark contexts.
- `brand.primaryColor` is a six-digit hex color with `#`.

### 7. Payments

Apply only if payments are active.

- IAP consumable and non-consumable products are correctly distinguished.
- Sound/video or other active media pauses during payment.
- Paid features unlock only after successful payment completion.
- Product name, quantity, and total amount are clearly shown.
- Toss Pay uses an Apps in Toss dedicated merchant rather than a reused external merchant.
- Order numbers are unique.
- Discount and refund rules are visible when relevant.

### 8. In-App Ads

Apply only if ads are active.

- Apps in Toss ADS sandbox is the source of truth for readiness.
- Console-issued ad group IDs are configured for the correct environment.
- Mock ad paths are removed or clearly gated away from sandbox/production behavior.
- IntegratedAd v2 is preferred when available.
- Full-screen ads call load before show.
- Banner ads use the Apps in Toss banner attach flow.
- Ad events are handled: loaded, show, impression, clicked, dismissed, failedToShow.
- Rewarded ads grant rewards only after the reward-earned event.
- Ads do not appear on intro, loading, cutscene, or temporary modal screens.
- Duplicate ad rewards are prevented.
- Sandbox evidence includes the event sequence used by the feature, especially reward-earned for rewarded ads.

### 9. External Links And App-Install Policy

- No copy, image, banner, or CTA directly encourages installing the app.
- No marketplace link is embedded.
- No install-benefit guidance is shown.
- All console-registered functions can be experienced inside the miniapp.
- External payment windows are not used.
- Share links land on Toss share links, not Aniwhere's own website.
- External links are limited to allowed cases such as legal notices, official public pages, partner information, or simple informational pages.

Read `references/external-link-rules.md` when links are in scope.

### 10. TDS Design System

Apps in Toss launch is the product priority, so Aniwhere should follow the official TDS/design-token direction strictly for launch-facing UI.

- Prefer TDS components wherever an official component fits.
- When TDS packages are not used, app-owned UI should visually fit Toss-style mobile UX.
- Use official `@toss/tds-mobile` only through project facades such as `@aniwhere/tds-mobile`, so Apps in Toss builds resolve to official TDS and public web builds do not import Toss-only runtime code.
- Treat `@aniwhere/tds-mobile` as an adapter boundary, not a substitute design system: Apps in Toss/ads/local builds must resolve it to official `@toss/tds-mobile`; public/domain builds may resolve it to a local fallback only to keep Toss-only runtime markers out of `aniwhere.link`.
- Keep colors, radii, spacing, typography, and shadows routed through Aniwhere tokens.
- Treat `client/src/shared/ui/ait` components as migration debt to remove, not as replacements for official TDS when official components are available.
- Treat existing `Ait*` route imports as migration debt. New `Ait*` imports are not allowed; do not expand the allowlist.
- Page code must not import `@toss/tds-mobile` or `@toss/tds-mobile-ait` directly; direct imports belong only inside adapter/facade boundaries.
- Do not add a new visual system for one screen.
- Before editing a route, follow `docs/tds-route-audit.md`: classify the route, search official TDS Mobile docs with the Apps in Toss MCP, record the docs checked, then classify each visible delta as `TDS-required`, `Product-approved`, or `Regression`.
- Do not rely on the user to provide the TDS links. The agent should discover route-appropriate official docs for buttons, typography, lists, top/title areas, bottom CTAs, sheets, search fields, toasts, dialogs, and any other touched primitive.
- When migrating a page off `Ait*`, compare against the current main route and the TDS/local token docs before changing typography, spacing, navigation, or row connectors. Classify any visible delta as either `TDS-required`, `Product-approved`, or `Regression`.
- If official TDS component structure creates a visible regression against a product-approved 375px main/public screen, route-specific app-owned UI plus `--ait-*` token compatibility is allowed only with the above classification and a follow-up/removal plan.

### 11. Sharing Rewards

Apply only if sharing or share rewards are active.

- Share links are generated with the Toss share-link flow.
- The Apps in Toss share API opens correctly.
- Share result screens render normally.
- Rewards are granted only when the configured share/reward condition is satisfied.

## Final Classification

- `Required`: steps 1-6 and 9. Any fail is a launch rejection risk.
- `Recommended`: step 10. TDS itself may not be mandatory, but consistency reduces review risk.
- `Feature-gated`: steps 7, 8, and 11. Required only when those features are active.
- `Sandbox-required`: SDK/console behaviors that cannot be proven by local code or desktop build.

## Report Format

Return a concise report with:

- `Passed`
- `Needs sandbox`
- `Needs console value`
- `Risks`
- `Recommended fixes before submission`
- Exact commands run and key output lines.
- For ads, include `ADS sandbox status` with the tested environment, ad unit/ad group placeholder status, event sequence, and reward duplicate-guard status.

## References

- `references/official-launch-links.md`
- `references/webinar-launch-skill-note.md`
- `references/robin-rejection-cases.md`
- `references/external-link-rules.md`

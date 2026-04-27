# Welcome / Discover Redesign Review - 2026-04-24

## Scope

- Welcome page: `client/src/pages/IntroPage.tsx`
- Discover page: `client/src/pages/HomePage.tsx`
- Shared navigation and local TDS-compatible styles: `client/src/shared/ui/GlobalNavigationMenu.tsx`, `client/src/App.css`

## Review Basis

- Apps in Toss non-game WebView review checklist: navigation clarity, predictable CTA behavior, light theme, responsive touch interactions, and permission denial tolerance.
- TDS component guidance: keep the page structure close to Top, Button, ListRow, and simple navigation patterns.
- Aniwhere product UX rule: one primary purpose per screen, with Discover focused on choosing how to start exploring.

## Changes Applied

- Replaced the Discover auto-rotating draggable hero carousel with a static `AitTop` hero.
- Reduced the first Discover viewport to one primary search CTA, one map/explore CTA, and one supporting ListRow-style guide list.
- Changed the Discover ranking module from hidden horizontal cards to an ordered vertical link list.
- Added loading, error, and empty states to the Discover ranking area.
- Improved Welcome copy, error announcement, loading state announcement, and secondary link touch target.
- Added focus-visible styles for key interactive elements.
- Added focus entry, Escape close, Tab containment, current-page state, and focus return to the global menu dialog.

## TDS-Compatible Notes

- No `@toss/tds-mobile` runtime dependency is used.
- The implementation uses the local `client/src/shared/ui/ait` layer for Top, Button, and ListRow-like composition.
- New CSS uses existing `--ait-*` tokens for spacing, color, radius, typography, and shadows.
- Discover now avoids custom carousel controls and small dot buttons that were difficult to align with mobile touch target expectations.

## WebView And Accessibility Notes

- The Discover page no longer starts motion automatically.
- Search, map exploration, and ranking comparison are separate actions instead of competing carousel slides.
- Location permission is still deferred to the Explore flow; Discover explains the value without triggering permission prompts.
- Focus visibility and dialog keyboard flow are improved for review and assistive technology checks.

## Remaining Verification Needed

- Validate the final visual result in a 375px Apps in Toss sandbox or real Toss WebView.
- Confirm whether the custom hamburger should stay once the Apps in Toss navigation bar configuration is finalized.
- If Toss login becomes mandatory at entry, verify that the Intro CTA fully completes the login callback flow in sandbox.

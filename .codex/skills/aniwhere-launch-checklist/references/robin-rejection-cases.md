# Robin Rejection Cases

Use this as a compact rejection-risk reference when running `aniwhere-launch-checklist`.

## Navigation

- Self-built back button instead of Apps in Toss common navigation.
- Common back button does not return to the previous page.
- Back on the first screen refreshes but does not exit the miniapp.
- Toss/common logo is missing from the navigation area.
- App-owned top header makes the miniapp look like an embedded browser.
- App-owned hamburger menu duplicates common navigation behavior.
- Custom accessory button does not work or uses a colored icon.
- Function-guide entry does not apply the intended navigation settings.

## Login, Auth, Permissions

- Toss login opens immediately before the user sees intro/value context.
- App-owned terms consent duplicates Toss login terms.
- Unlink callback is not handled, so the user remains logged in after unlink.
- Re-login fails after unlink/withdrawal.
- Permission request bottom sheet does not follow Toss guidance.
- Permission list includes permissions the app does not actually request.
- Permission denial has no fallback or re-request guidance.
- Withdrawal/disconnect exists in UI but does not actually work.

## Guides And Routing

- Console-registered function guide URL returns 404.
- Function guide landing page renders incorrectly.
- Registered functions require leaving the miniapp instead of working inside it.

## UI And UX

- Bottom sheet covers the whole screen and cannot be closed.
- Unnecessary horizontal scroll appears on mobile screens.
- Favorites or saved state do not update immediately.
- Chance-limited features do not explain the exhausted state.
- Primary buttons over images do not respond.
- Excessive flashing animations reduce usability.
- Pinch zoom is enabled accidentally.
- Native `alert()` or `confirm()` is used instead of a modal pattern.
- Tab bar shape, spacing, icon size, or label size does not fit Toss-like mobile UI.
- Ad loading or playback breaks return flow.

## Text And Brand

- App name differs between console, `brand.displayName`, `index.html`, and share metadata.
- Share/metadata brand names are inconsistent.
- Subscription-like wording appears for non-subscription products.
- Payment amount shown in UI differs from actual charge.
- Logo is not a 600x600 visible square asset.
- `brand.primaryColor` is not a valid `#RRGGBB` value.

## Triage Order

1. Confirm the exact rejection reason from console/review feedback.
2. Map it to the matching checklist step.
3. Re-check adjacent items in the same category.
4. Rebuild and retest in sandbox before resubmission.

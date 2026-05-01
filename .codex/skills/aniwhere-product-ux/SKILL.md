---
name: aniwhere-product-ux
description: Apply Aniwhere product decisions and mobile UX rules. Use when changing screens, navigation, copy, search/explore/detail flows, admin or reward scope, location permission timing, Toss-style mobile UI, or user-facing client behavior.
---

# Aniwhere Product UX

## Start

1. Read `docs/product-decisions.md` before changing product scope.
2. Read `docs/ux-mobile-research.md` before changing layout, navigation, or copy.
3. Read `docs/design-tokens.md` before changing client CSS or UI styling.
4. Preserve product decisions unless the task explicitly updates the decision document first.
5. Optimize for Apps in Toss mobile WebView use, not desktop landing-page behavior.

## Product Boundaries

- Main user value: discover subculture/anime/goods-related shops and community information.
- Core surfaces: shops, shop detail, search/explore, community posts/comments.
- Admin MVP: shop manual registration, shop status/editing, user review/report verification, manual or approved reward handling.
- Store owner self-service is out of current scope unless `docs/product-decisions.md` changes.
- Rewards should not dominate the product before admin verification and policy are clear.

## UX Rules

- Give each screen one primary purpose.
- Keep the first viewport focused on the next useful action.
- Do not stack search, map, recommendations, filters, and community with equal priority.
- Separate search focus from explore results where possible.
- Ask for location only after explaining value; support region/search fallback after denial.
- Use direct, user-centered copy.
- Avoid admin-table feel in user-facing screens.
- Keep CTA count low: one primary CTA, two at most when genuinely needed.
- Use `client/src/styles/tokens.css` tokens for color, spacing, radius, typography, shadow, and repeated component sizing.

## Screen Guidance

- Intro: service value and one start CTA.
- Discover/Home: one main entry and at most one supporting recommendation module.
- Search Focus: input, recent searches, recommended searches, popular terms.
- Explore: results summary, lightweight filters, list/map comparison.
- Detail: visit decision support, open status, latest update, official links, reviews/reports.

## Image And Illustration Guidance

- Use generated or custom illustrations only when they clarify the screen purpose.
- Prefer clean Toss-style 3D or simple object illustrations with bright, organized composition.
- Avoid copyrighted anime/game character resemblance, existing brand logos, text inside images, manga-like styles, and overly decorative effects.
- Aniwhere's mascot may appear as a small guide, but the main subject should stay tied to store discovery: map pins, storefronts, gachapon machines, goods boxes, or location cues.
- Intro can use one optimized bundled image when it improves first-screen comprehension.
- Home curation should use images sparingly; mascot usage should be a small brand marker, not the content itself.
- For multiple or heavy images, prefer managed CDN/static URLs over increasing the `.ait` bundle.
- Before generating an image, propose the prompt and explain why the image helps the current screen.

## Review Checklist

1. Can the screen's main purpose be described in one sentence?
2. Is the first viewport focused on the most useful information or action?
3. Are search, explore, and detail responsibilities separated clearly?
4. Is repeated information minimized across cards, map markers, and detail panels?
5. Are buttons used for clear actions rather than decorative labels?
6. Is location or login requested at a moment that makes sense to the user?
7. Does the screen still work when location permission is denied?
8. Is the flow usable at a 375px mobile width?
9. Does the UI feel like a Toss-style information exploration service rather than an admin console?

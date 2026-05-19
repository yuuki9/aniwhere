# TDS Route Audit

Aniwhere route UI work must start from official Apps in Toss/TDS evidence, then compare the current implementation against that evidence. This prevents a route from looking visually acceptable while drifting away from the launch review basis.

## Mandatory Workflow

1. Classify the route by product role before editing.
2. Search official TDS Mobile docs with the Apps in Toss MCP for the route's UI primitives.
3. Record the official document URLs or MCP document titles used for the route.
4. Compare the implementation against the official docs and the approved 375px Aniwhere baseline.
5. Classify every visible delta as one of:
   - `TDS-required`: official TDS guidance requires the change.
   - `Product-approved`: the product-approved baseline intentionally differs from default TDS.
   - `Regression`: the change broke the approved UX or an official TDS expectation.
6. Edit only after the route audit has a clear classification.
7. Verify with tests/builds and a 375px mobile screenshot. Mark runtime-only behavior as `Needs sandbox`.

Do not rely on a user-supplied TDS link as the first time official docs are checked. The agent must discover the relevant official docs for the route.

## Official Doc Discovery

Use Korean or exact component/API terms with the Apps in Toss MCP:

```text
search_tds_web_docs("Typography")
search_tds_web_docs("Button")
search_tds_web_docs("Top")
search_tds_web_docs("ListRow")
search_tds_web_docs("BottomCTA")
search_tds_web_docs("BottomSheet")
search_tds_web_docs("SearchField")
search_tds_web_docs("Toast")
```

If MCP is not loaded, use the `ax` CLI fallback from `docs/agent-skills.md`, then record that fallback was used.

## Route Matrix

| Route or surface | Product role | Official docs to check first |
| --- | --- | --- |
| `/`, `/intro` | Onboarding, value proposition, entry CTA | Typography, Top, ListRow, Button, BottomCTA.Single |
| `/home` | Discovery hub and shortcut entry | Typography, Top/ListHeader, ListRow, Button, Badge/Asset, Tab or navigation if touched |
| `/explore` | Map exploration, search entry, result list, overlays | SearchField, IconButton, Button, ListRow, BottomSheet, BottomCTA, Toast, SegmentedControl/Selector if filters are touched |
| `/shops` | Redirect to explore | Router/navigation docs plus target route audit |
| `/shop/detail/:shopId` | Shop detail and action surface | Top, Asset/Image, ListRow, Post, Button, BottomCTA, BottomSheet, Toast |
| `/search` | Search and filter flow | SearchField, ListRow, Button, BottomSheet, Selector/SegmentedControl, Toast |
| `/community`, `/community/:postId` | Review/post list and detail | Top/ListHeader, ListRow, Post, TextField/TextArea, Button, BottomCTA, Toast/Dialog |
| `/admin/**` | Operational forms and management | TextField/TextArea, Button, ListRow, TableRow, BottomSheet/Dialog, Toast |
| Bottom-up sheets | Modal task surface | BottomSheet, BottomCTA.Single/Double, Button, ListRow, Selector, SearchField as relevant |

## Current Intro Audit

Official docs checked:

- Typography: https://tossmini-docs.toss.im/tds-mobile/foundation/typography/
- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- Top: https://tossmini-docs.toss.im/tds-mobile/components/top/
- ListRow overview: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/
- ListRow components: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-components/
- BottomCTA overview: https://tossmini-docs.toss.im/tds-mobile/components/BottomCTA/check-first/
- BottomCTA.Single: https://tossmini-docs.toss.im/tds-mobile/components/BottomCTA/Single/

| Area | Current classification | Notes |
| --- | --- | --- |
| TDS import boundary | Passed | Page code imports `Button` from `@aniwhere/tds-mobile`; official TDS resolves through the facade for Apps in Toss builds. |
| Button shape/API | Passed | `Button` uses official props and `display="block"` so TDS renders `--button-border-radius: 16px`. `display="full"` rendered a square full-bleed button and is not used for the intro CTA. |
| Typography | Partial / Needs follow-up | Text goes through `--ait-*` tokens instead of raw page-local values. Body text and Button match TDS-sized tokens; the hero title and feature title preserve the approved intro rhythm and should be treated as `Product-approved`, not as strict semantic TDS typography. `fontScaleAvailable={false}` means large-text accessibility still needs a product/runtime decision. |
| Top/title region | Product-approved | Official `Top` supports title and asset layout, but the approved intro hero uses a custom image, two-line title, and coral highlight. Keep app-owned markup unless a design pass explicitly moves it to `Top.TitleParagraph`. |
| Feature rows | Product-approved | Official `ListRow` has `left`, `contents`, and `right` regions, but the intro chain connector is not a documented `ListRow` pattern. Keep app-owned rows plus token compatibility for the chain, and do not call the connector itself a TDS component. |
| Bottom CTA | Partial / Needs follow-up | Official BottomCTA is the documented bottom call-to-action primitive. Current intro uses official `Button` inside an app-owned bottom action area to preserve the approved single-viewport rhythm. Before PR, classify this as `Product-approved` or migrate to `BottomCTA.Single` with visual verification. |
| Runtime verification | Needs sandbox | Local browser and build verification do not prove Apps in Toss common navigation, safe area, large-text scaling, or runtime font behavior. |

## Current Home Audit

Official docs checked with Apps in Toss MCP on 2026-05-17:

- Typography: https://tossmini-docs.toss.im/tds-mobile/foundation/typography/
- Top: https://tossmini-docs.toss.im/tds-mobile/components/top/
- ListHeader: https://tossmini-docs.toss.im/tds-mobile/components/list-header/
- SearchField: https://tossmini-docs.toss.im/tds-mobile/components/search-field/
- ListRow overview: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/
- ListRow components: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-components/
- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- Badge: https://tossmini-docs.toss.im/tds-mobile/components/badge/
- Asset: https://tossmini-docs.toss.im/tds-mobile/components/Asset/check-first/

| Area | Current classification | Notes |
| --- | --- | --- |
| Route role | Product-approved | `/home` is the discovery hub after entry, so it keeps a dense mobile storefront rhythm instead of a strict form/list screen. |
| TDS import boundary | Passed | Home uses the shared API/view-model boundary and app-owned CSS tokens; no direct `@toss/tds-mobile` imports were introduced outside the local facade strategy. |
| Typography | Product-approved | Section titles and poster labels use `--ait-*` typography tokens with tighter sizing than the intro hero. The `인기 작품 TOP 20` title stays short and matches the current `popularity`-ordered work API without implying real-time trend data. |
| Search entry | Product-approved | Official `SearchField` is the reference primitive, but home keeps a button-like search entry to route into `/search` without opening an inline input on the discovery page. |
| Quick menu | Product-approved / Needs server role follow-up | The shortcut set keeps public actions visible by default: map exploration and community reviews. `매장 관리` is hidden unless an admin session is already unlocked; future Toss login role sync should replace the temporary admin-session visibility check. |
| Work poster carousel | Product-approved | Official `Asset` and `Badge` docs informed the poster media and internal badge shape, but the carousel is app-owned because TDS does not define a horizontal work-discovery rail. It calls `GET /api/v1/works`, renders the first 20 items from the returned popularity order to limit home image cost, hides duplicate genre metadata, uses poster art with contained rank numerals, shows about 2.5 cards at 375px, and links to `/search?scope=work&keyword=:workName&returnTo=/home` so the search route calls the shop search API with `workKeyword`. |
| Work shop count | Needs backend follow-up | The server work catalog currently exposes work metadata, not per-work shop counts. Home therefore uses `취급 매장 보기` inside the poster instead of an invented `n개 매장` count. |
| More affordance | Product-approved | No separate more affordance is shown because the current destination would be the generic Explore list, not a work-ranking page. A future `/works` route can reintroduce more as a work-specific action. |
| Recent reviews | Partial / Needs backend follow-up | The section is labeled `최근 방문 후기` and uses `GET /api/v1/posts` as the available recent-post API. If the server later separates review-only posts, replace this query with that endpoint. |
| Empty/error cards | Product-approved | Loading, empty, and error copy avoids `제보` wording on home and keeps the section neutral. |
| Explore return | Product-approved | Work poster links pass route state so the Explore list back action can return to `/home` instead of dropping to the base `/explore` screen. |
| Runtime verification | Needs sandbox | Local build/lint/test verification does not prove Apps in Toss safe area, webview navigation, or Toss runtime font scaling. |

## PR Evidence Format

Every route-level TDS PR must include:

- Route(s) audited.
- Official TDS docs checked.
- `TDS-required` / `Product-approved` / `Regression` classifications.
- Screenshot viewport used, normally 375px wide.
- Commands run.
- `Needs sandbox` items that cannot be proven locally.

# TDS Route Audit

Aniwhere route UI work must start from official Apps in Toss/TDS evidence, then compare the current implementation against that evidence. This prevents a route from looking visually acceptable while drifting away from the launch review basis.

UI/UX 자연어 요청은 `docs/agent-hooks.md`의 UI/TDS hook을 먼저 적용합니다. Aniwhere WebView 화면의 기본 UI 준수 대상은 TDS Mobile docs (`https://tossmini-docs.toss.im/tds-mobile`)입니다. `tds-react-native`와 Unity docs는 해당 플랫폼을 직접 다루는 작업이 아니라면 `Non-target reference`로 분류합니다.

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
| Home section vertical rhythm | Product-approved / TDS-informed | Official SearchField, ListRow, Typography, and Button docs were checked for the touched primitives. The search entry to CTA banner visual gap is about 16px, so the work and review section top padding was reduced from `--ait-space-3` to `--ait-space-1` to keep the CTA → work rail and work rail → review rhythm proportional without changing card sizes or route structure. |
| Work shop count | Needs backend follow-up | The server work catalog currently exposes work metadata, not per-work shop counts. Home therefore uses `취급 매장 보기` inside the poster instead of an invented `n개 매장` count. |
| More affordance | Product-approved | No separate more affordance is shown because the current destination would be the generic Explore list, not a work-ranking page. A future `/works` route can reintroduce more as a work-specific action. |
| Recent reviews | Partial / Needs backend follow-up | The section is labeled `최근 방문 후기` and uses `GET /api/v1/posts` as the available recent-post API. If the server later separates review-only posts, replace this query with that endpoint. |
| Empty/error cards | Product-approved | Loading, empty, and error copy avoids `제보` wording on home and keeps the section neutral. |
| Explore return | Product-approved | Work poster links pass route state so the Explore list back action can return to `/home` instead of dropping to the base `/explore` screen. |
| Runtime verification | Needs sandbox | Local build/lint/test verification does not prove Apps in Toss safe area, webview navigation, or Toss runtime font scaling. |

## Current Full Route Import Audit

Official docs checked on 2026-05-22 with web fallback because Apps in Toss MCP was not loaded in this session:

- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- Checkbox: https://tossmini-docs.toss.im/tds-mobile/components/checkbox/
- AgreementV4: https://tossmini-docs.toss.im/tds-mobile/components/Agreement/v4/
- Grid List: https://tossmini-docs.toss.im/tds-mobile/components/grid-list/
- Top: https://tossmini-docs.toss.im/tds-mobile/components/top/
- TextField: https://tossmini-docs.toss.im/tds-mobile/components/TextField/text-field/
- TextArea: https://tossmini-docs.toss.im/tds-mobile/components/TextField/text-area/
- SearchField: https://tossmini-docs.toss.im/tds-mobile/components/search-field/
- ListRow overview: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/
- Segmented Control: https://tossmini-docs.toss.im/tds-mobile/components/segmented-control/
- BottomCTA.Single: https://tossmini-docs.toss.im/tds-mobile/components/BottomCTA/Single/
- useBottomSheet: https://tossmini-docs.toss.im/tds-mobile/hooks/OverlayExtension/use-bottom-sheet/
- useToast: https://tossmini-docs.toss.im/tds-mobile/hooks/OverlayExtension/use-toast/

| Area | Current classification | Notes |
| --- | --- | --- |
| Route/page Ait import boundary | TDS-required | `/`, `/intro`, `/home`, `/explore`, `/search`, `/shop/detail/:shopId`, `/community`, `/community/:postId`, and `/admin/**` no longer import `client/src/shared/ui/ait` directly. `client/scripts/assert-ait-usage-allowlist.mjs` now has an empty allowlist. |
| Temporary local top navigation | Product-approved / Follow-up | `AppTopNavigation` preserves the approved local/public top bar behavior and hides itself in Apps in Toss runtime. It intentionally reuses existing CSS classes to avoid visual churn; replacing the app-owned public shell with a fuller official `Top`/native navigation model remains a separate visual PR. |
| Admin taxonomy selectors | Product-approved | Admin create/edit now uses Swagger-backed category/work IDs. The selector is app-owned because the current public facade exports only the proven TDS primitives in this repo; it follows the checked Checkbox, AgreementV4, Grid List, TextField, Button, ListRow, and segmented selection references without adding new `Ait*` usage. |
| Runtime verification | Needs sandbox | `tsc`, lint, and public bundle verification passed locally, but Apps in Toss native navigation, safe area, and Pixel 8a sandbox behavior still need device confirmation. |

## Current Admin CRUD ADS Follow-up

Official docs checked with Apps in Toss MCP on 2026-05-25:

- MCP result: `search_tds_web_docs` returned `Transport closed`.
- Recovery/fallback: `ax search docs --query WebView --limit 2` and `ax search tds-web --query Button --limit 2` both succeeded, so the current session used the `ax` CLI as the official-doc fallback. Stale `ax.exe` processes left after searches were stopped; no TDS cache rebuild was required because `ax search tds-web` worked after process cleanup.
- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- SearchField: https://tossmini-docs.toss.im/tds-mobile/components/search-field/
- ListRow overview: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/
- Badge: https://tossmini-docs.toss.im/tds-mobile/components/badge/
- WebView: https://developers-apps-in-toss.toss.im/tutorials/webview.md

| Area | Current classification | Notes |
| --- | --- | --- |
| `/admin/shops` create CTA | Regression fixed / TDS-required | The route already used `Button` through `@aniwhere/tds-mobile`, but `display="full"` rendered as a square full-bleed ADS button. It now uses `display="block"` with a route class only for preserving the rounded TDS button radius. |
| `/admin/shops/new` and edit submit CTA | Regression fixed / TDS-required | The save CTA also moved from `display="full"` to `display="block"` so the ADS/local TDS Button keeps the same rounded boundary as other admin action buttons. |
| Work catalog selector | Product-approved / TDS-informed | Category selection remains a compact checkbox-chip grid, but work selection now uses official `SearchField` plus `ListRow` suggestion rows through the facade. The work picker follows the Laftel finder reference at https://laftel.net/finder for the typed-query state only: selected works stack as removable chips above the search bar, and the search bar opens a directly attached vertical result list only when the user enters a Korean query. Search result rows show only the work name; selected state is represented by the chip stack plus a TDS `Badge` in the `ListRow.right` area because the Badge doc defines it as an item status indicator. The blank-query ranked recommendation panel and English/romaji matching were removed because admin shop editing needs deliberate Korean work lookup, not public discovery. |
| Form heading placement | Product-approved | `매장 등록` / `매장 수정` is rendered inside the form above the photo strip so the first editable region has a clear local task title even when Apps in Toss native navigation owns the top bar. |
| Location to region facet linkage | Product-approved / API-required | `AdminShopLocationPage` now loads `/api/v1/regions` and stores a matching `regionId` when the search query, road address, jibun address, or normalized address contains a region name such as `홍대` or `강남`. The server still persists the supplied `regionId`; no backend auto-classification was added. |
| Bundle analyzer and route splitting | Product-approved / Tooling | `npm run analyze:bundle` runs Vite in public mode and writes `client/dist-analyze/bundle-stats.html` through `rollup-plugin-visualizer`. Route pages now use `React.lazy` so admin/search/explore/detail screens are not statically pulled into the app entry chunk. Apps in Toss builds isolate official `@toss/tds-mobile`, `@toss/tds-mobile-ait`, and React vendor code into named chunks; the Apps in Toss chunk warning limit is raised only for the monolithic official TDS runtime chunk while public builds keep the default warning limit. The remaining Node `DEP0190` build warning is emitted by the upstream Apps in Toss CLI/Node runtime boundary, not Aniwhere route code. |
| Runtime verification | Needs sandbox | Source tests and lint can verify route structure, but ADS rendering of official Button radius, SearchField keyboard behavior, and real geocoder results should be checked in Apps in Toss sandbox at 375px. |

## Current Search/Explore Filter Audit

Official docs checked with Apps in Toss MCP on 2026-05-24:

- SearchField: https://tossmini-docs.toss.im/tds-mobile/components/search-field/
- ListRow overview: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/
- BottomSheet: https://tossmini-docs.toss.im/tds-mobile/components/bottom-sheet/
- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- Toast: https://tossmini-docs.toss.im/tds-mobile/components/toast/

| Area | Current classification | Notes |
| --- | --- | --- |
| Route role | Product-approved | `/search` keeps keyword-first search and `/explore` keeps map-first exploration. Filters are a supporting sheet, not a replacement for the primary route purpose. |
| TDS import boundary | TDS-required | The filter sheet imports `Button` from `@aniwhere/tds-mobile`, which resolves to `@toss/tds-mobile` in Apps in Toss builds. Unused legacy `client/src/shared/ui/ait` components were removed so page code cannot drift back to `Ait*` imports. |
| Facet filter sheet | Product-approved / API-required | The sheet now uses Swagger-backed `GET /api/v1/shops/facets` as a filter-option API for region and category labels. The current deployed server contract exposes `regions`, `categories`, and `workTypes` option lists via `includeRegions`, `includeCategories`, and `includeWorkTypes`, not keyword/bbox/selected-state facet counts. Selecting a region/category chip updates only local draft state until the user applies filters. `영업중` stays a map quick chip, and `작품` stays in `/search` keyword/work-scope discovery instead of becoming a sheet facet. Facets render as section titles with wrapping selection chips, matching the approved mobile store-filter reference instead of full-width vertical list rows. The shell and chips remain app-owned because the current facade exposes only proven primitives; the checked BottomSheet/Button docs are the behavior reference. |
| Search API params | Product-approved / API-required | `/search` preserves repeated `regionIds`, repeated `categoryIds`, `workId`, and `status` while changing keywords or pages, then sends `regionIds`, `categoryIds`, `workIds`, and `status` to `GET /api/v1/shops`. Work-scope fallback still uses `workKeyword`. |
| Explore API params | Product-approved / API-required | `/explore` reads the same URL filter params and sends them to the map source query instead of filtering region/work only on the client. The active quick chip toggles the `ACTIVE` status filter, and visual-only quick chips are intentionally excluded until an API-backed filter exists. |
| Runtime verification | Needs sandbox | Local tests prove source behavior, but Apps in Toss sheet animation, safe area, and Pixel 8a tap behavior still require sandbox/device verification. |

## Current Intro/Home/Search/Explore TDS Follow-up Audit

Official docs checked with `ax search tds-web` CLI fallback on 2026-05-24 because the current Codex MCP transport was closed after TDS cache recovery:

- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- SearchField: https://tossmini-docs.toss.im/tds-mobile/components/search-field/
- ListRow overview: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/
- Top: https://tossmini-docs.toss.im/tds-mobile/components/top/
- BottomSheet: https://tossmini-docs.toss.im/tds-mobile/components/bottom-sheet/
- Toast: https://tossmini-docs.toss.im/tds-mobile/components/toast/

| Area | Current classification | Notes |
| --- | --- | --- |
| Route/page Ait markup boundary | TDS-required | `/intro` no longer renders page-level `ait-list-row*` classes. `/home`, `/search`, and `/explore` have no `shared/ui/ait` imports or `Ait*` route/page components. Shared public fallback may still render `ait-*` classes internally as the public-build compatibility layer. |
| `/search` actual input | TDS-required | The editable search input imports `SearchField` through `@aniwhere/tds-mobile`, which resolves to official `@toss/tds-mobile` in Apps in Toss builds. |
| `/home` search entry | Product-approved | Kept as an app-owned button-like route entry because it navigates to `/search` instead of acting as an inline editable text field. |
| `/explore` top search entry | Product-approved | Kept as an app-owned `map-search-row search-screen-toolrow` route entry because it navigates to `/search` instead of acting as an inline editable text field. Official `SearchField` remains the reference for the editable `/search` input; the map/home route-entry button keeps the shared `.map-search-field` icon and spacing contract. |
| `/intro` feature chain | Product-approved | The feature chain keeps the approved app-owned connector treatment; official ListRow informed the left/content structure, but the connector itself is not a documented ListRow pattern. Page-level `ait-list-row*` classes were removed. |
| Runtime verification | Needs sandbox | Local tests and builds do not prove Apps in Toss native navigation, safe area, runtime font, or Pixel 8a tap behavior. |

### 2026-05-24 Search/Explore Follow-up

- `/search` editable input now leaves official `SearchField` chrome unwrapped: page code no longer attaches `search-screen-input` to `SearchField` and no longer uses `form.search-screen-bar` around it. Apps in Toss DOM may still include generated Emotion classes such as `css-*`; those are official TDS runtime classes, not Aniwhere route classes.
- Region facets are multi-select. URL state uses repeated `regionIds`, and the current Swagger-backed `/api/v1/shops` contract accepts `regionIds` directly.
- Multi-region `/search` now sends repeated `regionIds` in one shop search request instead of fanning out per region.
- `/explore` keeps the current map bbox as a client-side viewport filter for the result list/map. `GET /api/v1/shops/facets` does not expose bbox params in the deployed Swagger contract, so it is used only to fetch option labels/count-neutral options.

### 2026-05-25 Applied Filter Chip Follow-up

Official docs checked with `ax search tds-web` CLI fallback because the Apps in Toss MCP transport returned `Transport closed`:

- SearchField: https://tossmini-docs.toss.im/tds-mobile/components/search-field/
- Badge: https://tossmini-docs.toss.im/tds-mobile/components/badge/
- Checkbox: https://tossmini-docs.toss.im/tds-mobile/components/checkbox/
- BottomSheet: https://tossmini-docs.toss.im/tds-mobile/components/bottom-sheet/

| Area | Current classification | Notes |
| --- | --- | --- |
| Applied filter chips | Product-approved | TDS Mobile docs expose `SearchField` for the input and `Badge` for non-interactive status labels, but no exported `Chip` component was found in docs or the installed `@toss/tds-mobile` type surface. `/search` and `/explore` therefore render app-owned removable applied-filter chips under the search row, using TDS-compatible tokens and the Swagger-backed facet names. |
| Chip removal behavior | Product-approved / API-required | Removing a chip updates URL-backed `ShopFilters` through `writeShopFilters` without opening the filter sheet. Region and category chips remove only the selected ID, and status removes only `status`. Current-location and map-bbox actions no longer create applied filter chips. |
| Explore placement | Product-approved | In map mode, applied chips share the quick-chip row and appear to the right of the quick chips. In list mode, applied chips render inside `MapResultsSheet` directly below the search bar because the map overlay top controls are intentionally hidden while the list sheet is open. |
| SearchField alignment | Product-approved | `/search` keeps official `SearchField` via `@aniwhere/tds-mobile`; route CSS only adapts the official root height inside this inline toolbar so the visible TDS input face, filter button, and applied chips align without reintroducing a second search UI. |

### 2026-05-25 Explore Detail Bottom Sheet Follow-up

Official docs checked with `ax search tds-web` CLI fallback because the Apps in Toss MCP transport returned `Transport closed`:

- BottomSheet: https://tossmini-docs.toss.im/tds-mobile/components/bottom-sheet/
- useBottomSheet: https://tossmini-docs.toss.im/tds-mobile/hooks/OverlayExtension/use-bottom-sheet/
- BottomCTA overview: https://tossmini-docs.toss.im/tds-mobile/components/BottomCTA/check-first/
- BottomCTA.Single: https://tossmini-docs.toss.im/tds-mobile/components/BottomCTA/Single/

### 2026-05-30 Search/Explore Route Field Follow-up

Official docs reused from the current Search/Explore audit because the touched primitives are the same:

- SearchField: https://tossmini-docs.toss.im/tds-mobile/components/search-field/
- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- ListRow overview: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/

| Area | Current classification | Notes |
| --- | --- | --- |
| Shared search field shell | Product-approved | `/search` and `/explore` now share `MapSearchFieldShell` so the route-entry button and editable form keep the same `search-screen-bar map-search-field` structure. This preserves the approved Aniwhere map/list search rhythm while using official SearchField as the behavior reference. |
| `/search` route shell | Regression fixed / Product-approved | `/search` no longer owns a separate `search-screen search-screen-v2` surface. It now uses the same `map-page-shell`, `map-page-list-mode`, `map-list-view-top`, and `map-results-list-panel` shell as `/explore?view=list`; only the inner input form and pre-search content differ by route purpose. The search-entry state intentionally omits `search-result-head` so the screen does not imply results before a query is submitted. |
| Routed keyword display | Product-approved / Regression fixed | `/explore?view=list&keyword=:keyword` now displays the routed keyword in the top search field. Home work poster links and recent-history selections therefore arrive in the list route with visible context instead of falling back to placeholder copy. |
| Recent search chips | Product-approved | Recent searches are app-owned removable chips with an adjacent `전체 삭제` action. TDS docs do not expose a dedicated chip primitive in this facade, so the UI uses TDS-compatible tokens and Button-like hit targets. |

### 2026-05-30 Explore Peek/Nearby Follow-up

Official docs checked with Apps in Toss MCP:

- Badge: https://tossmini-docs.toss.im/tds-mobile/components/badge/
- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- ListRow overview: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/
- ListRow components: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-components/

| Area | Current classification | Notes |
| --- | --- | --- |
| Peek sheet summary | Product-approved | The map peek sheet now prioritizes shop name, review signal, address, and category chips. The previous status pill was removed from the peek state because category and address are more useful before opening detail; status remains a detail-level field. |
| Category chips | Product-approved | Official Badge informed the compact status-label shape, but the peek category chips are app-owned because they are filter-like metadata inside a map summary, not standalone TDS `Badge` statuses. |
| Map area search | API-required | Swagger exposes `GET /api/v1/shops/nearby?lat=&lng=` for a server-defined 1km nearby result. `map-area-search-button` now calls this endpoint with the current map center and keeps existing URL/facet filtering on top. |
- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- Icon Button: https://tossmini-docs.toss.im/tds-mobile/components/icon-button/
- ListRow overview: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/
- ListRow components: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-components/
- Asset: https://tossmini-docs.toss.im/tds-mobile/components/Asset/check-first/
- Tab: https://tossmini-docs.toss.im/tds-mobile/components/tab/
- Top: https://tossmini-docs.toss.im/tds-mobile/components/top/
- Typography: https://tossmini-docs.toss.im/tds-mobile/foundation/typography/

| Area | Current classification | Notes |
| --- | --- | --- |
| Detail sheet route role | Product-approved | `/explore?sheet=expanded` is the map detail decision surface. It supports map comparison, route opening, tabbed detail info, and native/browser back folding through URL state. |
| Peek and expanded sheet frame | Product-approved | Official `BottomSheet` is the reference for bottom-up panels, but the explore map uses a persistent map-attached peek sheet and a drag-aware expanded sheet rather than a modal overlay with dimmer/focus lock. Keeping the app-owned `map-bottom-sheet*` frame avoids breaking map comparison, peek drag, and URL-driven back behavior. Treat this as a documented app-owned shell, not a recreated `Ait*` layer. |
| useBottomSheet migration | Follow-up PR | Official `useBottomSheet` is designed for overlay sheets opened imperatively with `open`/`close`. `/explore` currently has three persistent map-attached states (`list`, `peek`, `expanded`) coupled to URL state, map comparison, pointer drag, and browser/native back behavior. Replacing it should be planned as a separate route migration with a behavior matrix and sandbox verification rather than folded into admin form cleanup. |
| Ait/alt route layer | TDS-required / Passed | `MapPeekSheet`, `MapDetailSummaryCard`, `MapDetailInfoCard`, `MapDetailMediaSection`, and `MapDetailSupplementSections` do not import `client/src/shared/ui/ait`, do not render `Ait*` components, and do not use `ait-*` or `alt-*` route classes. `--ait-*` CSS tokens remain the allowed compatibility token layer. |
| Detail info rows | TDS-required / Product-approved | Repeated shop detail rows import `ListRow` and `Button` through `@aniwhere/tds-mobile`. Address keeps the documented `left` and `contents` structure, then uses an app-owned two-column value line inside `contents` so the address text and route action share the same left/right rhythm without the outer right slot making this row feel misaligned. The clean icon stays in `left`, the TDS-generated left wrapper is constrained to the same 36px box as the icon, and the first row uses a documented inline correction token so its visible content aligns with the following TDS detail rows. The route action remains a small weak TDS button. |
| Detail tabs | Product-approved | TDS Mobile `Tab` supports `small` and `large` sizes and handles tab semantics, but `/explore?sheet=expanded` keeps an app-owned sticky tab rail because it must live inside the persistent map-attached sheet and support URL/tab state with the existing sheet header. The tab text now uses the smaller app token to align visually with TDS `Tab size="small"` density. |
| AI summary placement | Product-approved | The Olive Young mobile store detail reference keeps the store identity and action area above the tabs, then shows address, hours, services, and notices inside the `기본 정보` tab. `/explore?sheet=expanded` keeps the top identity card focused on the shop name, keyword chips, and tabs, then places a compact `AI가 요약한 정보` card at the top of the `정보` tab before factual `ListRow` rows. The card uses ADS-width spacing, a shorter two-line preview, and a `더보기` control so it works as a first-read decision aid without taking over the detail sheet. It also avoids duplicating the same visit-tip text when the AI summary falls back to `visitTip`. Reference checked: https://m.oliveyoung.co.kr/m/mtn/store/information/DF3C |
| Expanded sheet spacing rhythm | Product-approved | The expanded detail sheet uses one route-level inline spacing variable for identity, tabs, factual rows, and the AI summary block so the 375px detail surface has a consistent left/right rhythm. The extra info header was removed, and `ListRow` keeps its own vertical rhythm while route CSS only supplies the shared horizontal inset. This adapts the checked `Top`, `ListRow`, and `BottomSheet` references to Aniwhere's persistent map-attached sheet. |
| Detail metadata emphasis | Product-approved | The previous update badge beside `기본 정보` was removed. Freshness is now a `최근 업데이트` row with an icon and bold value, keeping address, location, status, categories, visit tip, and update metadata in one scannable ListRow stack. |
| AI chat entry | Product-approved / Hidden feature | The map AI chat panel remains componentized but is disabled by a feature flag because the user-facing AI chat button is still under development. Re-enable only after product approval and sandbox verification. |
| Quick chips | Product-approved / API-required | `/explore` quick chips now expose only filter-backed chips. The visual-only `관심매장` chip was removed so current-location, map-area, and favorite-like non-facet state cannot appear as applied filter chips. |
| `/search` top/content alignment | Regression fixed | `/search` now shares one inline padding token between `search-screen-top-v2` and `search-screen-content-v2`, keeping the official `SearchField` chrome and filter button aligned with the result content. |
| Media hero and tab content | Product-approved | The media preview, keyword chips, tab rail, photo/review sections, and route thumbnail button remain app-owned because the current official docs do not define this map-specific media/detail composition. The works tab changed from a passive chip cloud to a compact work feed with 44px poster thumbnails, fallback initials, a `/search?scope=work&keyword=:workName` row action, and preview expansion. Official ListRow and Asset docs informed the left/media/content rhythm, but the work feed itself remains app-owned and must not be described as an official TDS component. |
| Runtime verification | Needs sandbox | Local tests/builds can verify imports and layout source, but Apps in Toss sheet animation, safe area, focus behavior, and native back behavior still need sandbox/device confirmation. |

### 2026-05-25 Explore Map Marker Follow-up

Official docs checked with `ax search tds-web` CLI fallback because the Apps in Toss MCP transport returned `Transport closed`:

- Badge: https://tossmini-docs.toss.im/tds-mobile/components/badge/
- Tooltip: https://tossmini-docs.toss.im/tds-mobile/components/tooltip/
- Typography: https://tossmini-docs.toss.im/tds-mobile/foundation/typography/
- `지도 마커` search: no dedicated TDS Mobile map marker component was found.

| Area | Current classification | Notes |
| --- | --- | --- |
| Map marker component boundary | Product-approved | TDS Mobile exposes `Badge` for compact status recognition, but no dedicated map marker component was found. `/explore` map markers are therefore app-owned Naver Maps HTML overlays styled with TDS-compatible tokens, not official TDS components. |
| Individual shop markers | Product-approved | Individual shop markers now render as store-name chips so users can identify nearby shops directly on the map. Labels are truncated and HTML-escaped before being injected into the Naver marker content. |
| Cluster markers | Product-approved | Clustering remains enabled at lower zoom levels to protect dense shop areas and WebView performance. The visual cluster marker changed from a round icon to a count chip so the map reads as a consistent chip-based surface instead of mixing icon and label metaphors. |
| Runtime verification | Needs sandbox | Local source tests and builds can verify marker generation, but overlapping labels, tap hit area, and real Naver Maps WebView rendering should be checked on a 375px Apps in Toss sandbox device. |

### 2026-05-26 Login Bypass, Explore List Sheet, Shop Favorite Follow-up

Official docs checked with official web fallback because `ax` was not on PATH in this session:

- BottomSheet: https://tossmini-docs.toss.im/tds-mobile/components/bottom-sheet/
- useBottomSheet: https://tossmini-docs.toss.im/tds-mobile/hooks/OverlayExtension/use-bottom-sheet/
- Icon Button: https://tossmini-docs.toss.im/tds-mobile/components/icon-button/
- Toast: https://tossmini-docs.toss.im/tds-mobile/components/toast/
- Swagger `addFavoriteShop`: https://api.aniwhere.link/swagger-ui/index.html#/Shop/addFavoriteShop

| Area | Current classification | Notes |
| --- | --- | --- |
| `/intro` login-free home entry | Superseded by 2026-05-28 nickname mock entry | The earlier `로그인 없이 둘러보기` bypass routed directly to `/home` while Toss login token exchange was blocked in sandbox. It has been replaced by a nickname setup mock entry so ADS/local visual adjustments happen through the same modal surface used by real Toss login onboarding. |
| `/explore` list results sheet | TDS-required / Product-approved adaptation | `MapResultsSheet` now renders through the `@aniwhere/tds-mobile` `BottomSheet` facade. It uses `disableDimmer` and `UNSAFE_disableFocusLock` because the list mode is part of the map exploration surface rather than a blocking modal task. Peek and expanded shop detail sheets remain app-owned persistent map-attached surfaces because they are coupled to URL state, drag gestures, and native/browser back folding; replacing them should remain a separate behavior migration with sandbox evidence. |
| `/explore` quick status chip | Product-approved / Regression fix | `영업중` remains a map quick chip backed by the `status=ACTIVE` shop API parameter, but it no longer creates a duplicate applied filter chip labelled `Open`. The active quick chip itself is the visible state affordance. |
| `/explore` sheet controls | Product-approved / Regression fix | The selected-shop peek sheet stays app-owned. After the list sheet moved to TDS `BottomSheet`, the existing map list FAB could visually overlap the peek summary at 375px. Peek mode now gets a dedicated `map-surface-sheet-peek` surface class that lifts the shared zoom/list control stack with a responsive `--map-control-bottom` value and hides only the current-location FAB while the shop route/summary action is visible. In list-sheet mode, the map toggle FAB is lifted and the scrollable result panel reserves bottom padding so sheet content and the FAB do not compete. The list FAB remains available instead of being hidden. |
| `/explore` list toggle vs selected shop sheet | Product-approved / Regression fix | The blue list toggle is scoped to the base map/list view switch only. When a shop is selected (`shopId` is present), the selected-shop bottom sheet keeps ownership of the lower surface and the list toggle is not rendered, so tapping map controls cannot replace the shop summary/detail bottom sheet with result `ListRow` content. The toggle still appears on first `/explore` entry and while the list sheet is open, where it switches between map and list view. |
| `/search` result to `/explore` detail | Product-approved / Regression fix | Search results no longer add an implicit `regionIds` filter when opening a selected shop in `/explore`, so selecting a shop from a work rail/search result does not create a region facet chip. The current search URL is passed through route state, and the `/explore` back icon returns to that URL when the selected detail was opened from search, preserving the work keyword/rail context. |
| `/shop/detail/:shopId` favorite action | Product-approved / API-required | Shop detail now exposes a heart icon action beside the status pill. It calls Swagger-backed `POST /api/v1/shops/{id}/favorite` and `DELETE /api/v1/shops/{id}/favorite` through existing API helpers, uses stored Aniwhere auth when available, and shows TDS `Toast` feedback. The backend currently does not expose an initial `favorite` field on `Shop`, so the first render starts unselected and updates local state after a successful action. |
| Runtime verification | Needs sandbox | Source tests verify routing/API wiring and TDS facade usage. Apps in Toss BottomSheet animation, safe area, back behavior, and authenticated favorite mutation still need sandbox/device confirmation after login is fixed. |

### 2026-05-26 Home CTA Carousel Follow-up

Official docs checked with official web fallback:

- GridList: https://tossmini-docs.toss.im/tds-mobile/components/grid-list/
- Asset: https://tossmini-docs.toss.im/tds-mobile/components/Asset/check-first/
- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/

| Area | Current classification | Notes |
| --- | --- | --- |
| `/home` quick menu replacement | Product-approved | The previous icon quick menu is replaced with a three-card horizontal CTA rail headed `오늘 어디를 둘러볼까요?`. Official `GridList` supports image/text menu items, but `/home` keeps an app-owned carousel because the approved discovery pattern needs one larger visual card per action and TDS Mobile does not expose a dedicated carousel primitive in the checked docs. The checked `Asset` and `Button` docs inform image usage and action semantics, while the route uses token-compatible CSS and plain links/articles. |
| `/home` CTA routing | Product-approved / API-follow-up | Only `지도로 주변 매장 보기` is active and routes to `/explore?view=map`. `즐겨찾기 많은 매장` and `후기 많은 매장` render as disabled `준비 중` cards until the backend exposes favorite-count and review-count sort/filter contracts. |
| Runtime verification | Needs sandbox | Source tests, lint, and build can verify the CTA assets and route wiring, but 375px ADS visual rhythm and image loading should be checked in Apps in Toss sandbox. |

### 2026-05-26 Home CTA Carousel Visual Follow-up

Official docs checked with Apps in Toss MCP in the current session:

- GridList: https://tossmini-docs.toss.im/tds-mobile/components/grid-list/
- Asset: https://tossmini-docs.toss.im/tds-mobile/components/Asset/check-first/
- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- ListHeader: https://tossmini-docs.toss.im/tds-mobile/components/list-header/

| Area | Current classification | Notes |
| --- | --- | --- |
| `/home` CTA card frame | Product-approved | The CTA rail keeps an app-owned horizontal carousel because the route needs a preview of the next card and a larger discovery image than the checked `GridList` menu pattern. The visual treatment moved away from full-bleed banner imagery: each CTA is now a white card with a bounded media area and copy below it, preserving the user's requested white carousel feel. |
| `/home` CTA media usage | Product-approved / Asset-informed | Existing CTA images are still used, but they render inside a clipped media frame instead of as the full card background with a route overlay gradient. This keeps image replacement independent from layout work and aligns better with the checked `Asset` guidance around framed media. The review CTA image still needs a later asset replacement to reduce duplicated pointing-pose mascot usage. |
| Runtime verification | Passed / Needs follow-up asset | Source test `node --test tests/homeViewModel.test.ts` verifies the structure. ADS sandbox on Pixel 8a emulator at 412px confirmed the white carousel card rhythm, visible next-card preview, and image loading after HMR. The review CTA image still needs later replacement to remove the duplicated pointing-pose visual. |

### 2026-05-26 Home Vertical CTA And Explore List Button Follow-up

Official docs checked with Apps in Toss MCP in the current session:

- Asset: https://tossmini-docs.toss.im/tds-mobile/components/Asset/check-first/
- ListHeader: https://tossmini-docs.toss.im/tds-mobile/components/list-header/
- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- BottomSheet: https://tossmini-docs.toss.im/tds-mobile/components/bottom-sheet/
- useBottomSheet: https://tossmini-docs.toss.im/tds-mobile/hooks/OverlayExtension/use-bottom-sheet/
- Icon Button: https://tossmini-docs.toss.im/tds-mobile/components/icon-button/

| Area | Current classification | Notes |
| --- | --- | --- |
| `/home` vertical CTA carousel | Product-approved / Asset-informed | The three CTA cards now use the generated visual assets and a compact two-line copy pattern. Favorite/review wording is standardized with the facet sort labels: `관심 많은 매장 / 먼저 둘러보기` maps to `관심 많은순`, and `리뷰 많은 매장 / 믿고 찾아보기` maps to `리뷰 많은순`. This follows the approved Olive Young-like content-curation carousel direction; TDS `Asset` informed the stable media frame, but TDS Mobile still does not define this exact horizontal content rail. |
| `/explore` map-backed list results sheet | Superseded by 2026-05-27 split | This earlier map-backed sheet direction was replaced after the Olive Young reference review. `/explore?view=list` is now a full route-level list surface, while `/explore?view=map` owns the map surface. |
| `/explore` list toggle over selected POI peek | Superseded by 2026-05-27 split | The list FAB still clears selected-shop query state, but its destination is now the full `/explore?view=list` list route instead of a map-backed `BottomSheet` results surface. |
| Runtime verification | Superseded by 2026-05-27 checks | The vertical CTA and map-backed list-sheet checks from this entry were replaced by the 2026-05-27 horizontal CTA restoration and full list/map route split verification below. |

### 2026-05-27 App-Owned Shadow Removal Follow-up

Official docs checked with Apps in Toss MCP in the current session:

- `Shadow 그림자` search: no dedicated TDS Mobile shadow/foundation document found in the returned results.
- GridList: https://tossmini-docs.toss.im/tds-mobile/components/grid-list/
- BottomSheet: https://tossmini-docs.toss.im/tds-mobile/components/bottom-sheet/

| Area | Current classification | Notes |
| --- | --- | --- |
| App-owned shadow usage | Product-approved / Regression fix | All `box-shadow` declarations were removed from Aniwhere-owned CSS files under `client/src`, and the unused `--ait-shadow-*` / `--shadow` tokens were removed from `tokens.css`. The previous shadow tokens and custom shadow values made card, sheet, marker, and admin surfaces read as unwanted blue/raised layers, especially around the `/home` curation cards. Layer separation now relies on spacing, borders, background, and persistent map/sheet layout rather than shadows. |
| `Ait*` and `ait-*` boundary | TDS-required / Passed | `client/src` still has no route/page `Ait*` imports from `shared/ui/ait`. Remaining `ait-*` class names belong to the TDS public fallback/compatibility facade and token-compatible internal wrappers, not route-level Ait component usage. Shadow declarations were removed from those app-owned fallback styles as well. |
| Runtime verification | Needs ADS screenshot | Source tests, lint, and build verify the CSS no longer contains `box-shadow`. ADS/device visual verification should still confirm that shadow removal does not reduce tap-target recognition on map controls, sheets, admin forms, and home curation cards. |

### 2026-05-27 Home CTA Density Follow-up

Official docs checked with official web fallback because `ax` was not on PATH in this session:

- GridList: https://tossmini-docs.toss.im/tds-mobile/components/grid-list/
- Asset: https://tossmini-docs.toss.im/tds-mobile/components/Asset/check-first/
- Asset.Image: https://tossmini-docs.toss.im/tds-mobile/components/Asset/asset/

| Area | Current classification | Notes |
| --- | --- | --- |
| `/home` CTA card density | Product-approved / Asset-informed | The CTA rail remains app-owned because TDS Mobile GridList covers image/text menu grids but does not define Aniwhere's horizontal content-curation carousel. The CTA assets were restored to the earlier 1536x1024 horizontal set from `ebe8d0b^`, and the card frame now uses a 3:2 horizontal crop at `min(82vw, 320px)`. The image fills the media frame with `object-fit: cover` and no scale transform, while a lightweight left gradient keeps the two-line copy readable without bringing back app-owned shadows. |
| Runtime verification | Passed local / Needs sandbox | `node --test tests/homeViewModel.test.ts` and a local 375px browser check verified the horizontal CTA card size, first CTA image fill, and `/explore?view=map` href. Full lint/build verification is tracked in the Explore follow-up below. Apps in Toss sandbox should still confirm image crop, safe-area spacing, and HMR/device rendering. |

### 2026-05-27 Home CTA Routing Follow-up

| Area | Current classification | Notes |
| --- | --- | --- |
| `/home` first CTA routing | Product-approved / Regression fix | The first CTA remains the active map exploration shortcut and links to `/explore?view=map` so Explore opens in map mode explicitly. Local browser verification confirmed clicking `a.home-cta-card` changes the address from `/home` to `/explore?view=map`. |

### 2026-05-27 Home Vertical CTA Restore Follow-up

Official docs checked with Apps in Toss MCP in the current session:

- GridList: https://tossmini-docs.toss.im/tds-mobile/components/grid-list/
- Asset: https://tossmini-docs.toss.im/tds-mobile/components/Asset/check-first/
- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/

| Area | Current classification | Notes |
| --- | --- | --- |
| `/home` CTA card orientation | Product-approved / Regression fixed | The horizontal `3:2` CTA density pass was reverted because the requested product direction is the earlier vertical content-curation CTA. Cards are restored to a compact `4:5` frame with the 1024x1536 vertical image assets cropped inside the card, and the image content is slightly scaled inside `home-cta-media` so the illustration fills the card frame more fully. The current no-shadow decision remains intact. TDS `Asset` informed the stable media frame; the carousel itself remains app-owned because the checked `GridList` docs cover image/text grid menus rather than Aniwhere's horizontal discovery rail. |
| Runtime verification | Passed local / Needs sandbox | `node --test tests/homeViewModel.test.ts` verifies the vertical CTA CSS contract and image dimensions. ADS sandbox should still confirm the visual rhythm on the target device because local tests do not prove WebView safe area, image decode, or native scroll feel. |

### 2026-05-27 Explore List And Map View Split Follow-up

Official docs checked with official web fallback because Apps in Toss MCP was not loaded and `ax` was not on PATH in this session:

- BottomSheet: https://tossmini-docs.toss.im/tds-mobile/components/bottom-sheet/
- useBottomSheet: https://tossmini-docs.toss.im/tds-mobile/hooks/OverlayExtension/use-bottom-sheet/
- Icon Button: https://tossmini-docs.toss.im/tds-mobile/components/icon-button/
- ListRow overview: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/
- ListRow components: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-components/

| Area | Current classification | Notes |
| --- | --- | --- |
| `/explore?shopId=:id` list FAB routing | Regression fixed | Clicking the map/list FAB while a selected-shop peek sheet is open clears `shopId` and `sheet`, then replaces the URL with `/explore?view=list`. The destination is now a full list route, not a map-attached result sheet. |
| `/explore?view=list` full list surface | Product-approved / Regression fixed | The list view now follows the Olive Young reference split more closely: `/explore?view=map` owns the map surface, while `/explore?view=list` renders search, filter chips, and result rows in a full-height list surface without mounting `ShopMap`. The official `BottomSheet` component is not used for this state because the target behavior is a route-level list screen, not modal or persistent map disclosure. List cards remain app-owned but follow the checked ListRow rhythm and use the existing status pill/status copy. |
| `/explore?view=list` map quick-chip isolation | Regression fixed | The full list route no longer renders the map-only `MapQuickChips`/`map-chip-status` toolbar. List mode keeps only removable applied filter chips, while map mode retains the quick status chip for map exploration. |
| `/search?returnTo=/explore?view=list` submission | Regression fixed | The TDS `SearchField` did not reliably trigger the surrounding form submit on Enter in the local runtime, so SearchPage now handles Enter directly on the field and preserves the encoded list-route `returnTo` while writing `keyword` and `page=0`. |
| Runtime verification | Passed local / Needs sandbox | `node --test tests/homeViewModel.test.ts`, `node --test tests/explorePage.test.ts`, `node --test tests/searchPage.test.ts`, `npm run lint`, `npm run build`, and local 375px browser checks verified horizontal CTA restoration, `/explore?view=list` without a map or map quick chip, visible search/filter/list rows, `/search?returnTo=%2Fexplore%3Fview%3Dlist` Enter search, and the floating map button changing the URL to `/explore?view=map`. Apps in Toss sandbox should still confirm native back behavior, list/FAB positioning, and native keyboard search submission on device. |

### 2026-05-28 Explore Favorite Action Follow-up

Official docs checked with Apps in Toss MCP:

- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- Toast: https://tossmini-docs.toss.im/tds-mobile/components/toast/
- ListRow overview: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/
- ListRow components: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-components/

Swagger checked:

- `POST /api/v1/shops/{id}/favorite` (`operationId: addFavoriteShop`)
- `DELETE /api/v1/shops/{id}/favorite` (`operationId: removeFavoriteShop`)
- Both return `ApiResponseUnit`; `Shop` does not expose an initial favorite-state field.

| Area | Current classification | Notes |
| --- | --- | --- |
| `/explore` selected shop favorite action | Product-approved / API-required | The expanded shop detail summary now exposes a 44px app-owned heart icon button. It calls Swagger-backed `addFavoriteShop` and `removeFavoriteShop` through `client/src/shared/api/shops.ts`, uses the stored Aniwhere auth token, and shows TDS `Toast` feedback through `@aniwhere/tds-mobile`. Because the current Swagger `Shop` schema has no favorite-state field, the button starts unselected on first render and updates local route state only after a successful mutation. |
| Button placement | Product-approved | The action sits beside the shop identity title rather than becoming a quick filter chip. This keeps `/explore` quick chips API-backed filters only, avoids reintroducing the removed visual-only favorite chip, and keeps the action scoped to the selected shop decision surface. |
| Runtime verification | Needs sandbox | Source tests verify endpoint wiring and CSS token usage. Authenticated mutation behavior still needs Apps in Toss sandbox/device verification after login because local unauthenticated browser checks can only verify the login-required toast path. |

### 2026-05-28 Home CTA List Banner Experiment

Official docs checked with Apps in Toss MCP in the current session:

- GridList: https://tossmini-docs.toss.im/tds-mobile/components/grid-list/
- Asset: https://tossmini-docs.toss.im/tds-mobile/components/Asset/check-first/
- Typography: https://tossmini-docs.toss.im/tds-mobile/foundation/typography/
- ListRow overview: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/
- ListRow components: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-components/
- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- Apps in Toss ADS list banner reference: https://developers-apps-in-toss.toss.im/ads/develop.html

| Area | Current classification | Notes |
| --- | --- | --- |
| `/home` CTA layout | Product-approved / Experiment | The three route CTAs move from the vertical horizontal carousel to a one-column list-banner stack inspired by the Apps in Toss ADS list banner rhythm. These remain app-owned routing CTAs, not SDK ad placements, so no ad labels, ad lifecycle, or reward behavior is implied. |
| `/home` CTA media usage | Product-approved / Asset-informed | Three separately generated 1600x400 banner images from the local Downloads folder are bundled as `home-cta-*-banner.png`. The left side stays copy-safe, while the illustration occupies the center/right. TDS `Asset` informs the stable clipped media frame, and `ListRow`/`GridList` inform the list-like tap rhythm, but the exact banner surface remains app-owned. The previous vertical CTA assets (`home-cta-map.png`, `home-cta-favorites.png`, `home-cta-reviews.png`) remain in the repository, so reverting the isolated banner-conversion commit restores the 2026-05-27 vertical card path. |
| `/home` CTA label and frame follow-up | Product-approved / Regression fix | The local `home-section-head` title above the CTA stack was removed so the first actionable banner owns the surface directly. CTA copy was shortened to two compact lines and uses token-based body-large typography. A dark overlay was intentionally not used; the banner instead uses the stronger border token, an inset outline, and a gray-50 copy gradient so it separates from the white page without making the bright 3D assets read like ads. |
| Runtime verification | Needs sandbox | `node --test tests/homeViewModel.test.ts` should verify the source/CSS contract. Local browser screenshot can show the 375px visual, but Apps in Toss sandbox still needs image decode, safe-area spacing, and native scroll confirmation. |

### 2026-05-28 Toss Login Nickname Onboarding Follow-up

Official docs checked with official web fallback in the current session:

- Apps in Toss login development: https://developers-apps-in-toss.toss.im/login/develop.html
- `appLogin` reference: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EB%A1%9C%EA%B7%B8%EC%9D%B8/appLogin.html
- TextField: https://tossmini-docs.toss.im/tds-mobile/components/TextField/text-field/
- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- Toast: https://tossmini-docs.toss.im/tds-mobile/components/toast/

| Area | Current classification | Notes |
| --- | --- | --- |
| `/intro` Toss login boundary | TDS-required / Apps in Toss-required | The official login docs still describe `appLogin()` as the client-side authorization-code step, with token exchange and user lookup handled by the server. Aniwhere keeps this boundary: the Intro CTA starts `appLogin()`, then the client sends the authorization code and referrer to Aniwhere's server before loading `/api/v1/users/me`. |
| `/intro` nickname setup field | TDS-required / Product-approved adaptation | New or unnamed Aniwhere users now render the nickname input through the project `@aniwhere/tds-mobile` `TextField` facade. Apps in Toss builds resolve the facade to official `@toss/tds-mobile` `TextField`; public/domain builds use a local fallback that preserves the same label, helper, input, and token-compatible visual structure. |
| Nickname copy and purpose | Product-approved | Nickname entry remains Aniwhere-owned profile setup, not another login or Toss identity step. The copy says the nickname is used inside Aniwhere and appears on reviews/comments. |
| Runtime verification | Needs sandbox | Source tests verify the facade boundary and Intro source contract. Apps in Toss sandbox still needs uploaded `.ait` verification for `appLogin()`, server token exchange, missing-nickname display, keyboard behavior, and successful nickname save back to `/home`. |

### 2026-05-28 Toss Login Nickname Sheet And Admin Entry Follow-up

Official docs checked with official web fallback in the current session:

- Apps in Toss login intro: https://developers-apps-in-toss.toss.im/login/intro.html
- Modal: https://tossmini-docs.toss.im/tds-mobile/components/modal/
- BottomSheet: https://tossmini-docs.toss.im/tds-mobile/components/bottom-sheet/
- Asset.Image: https://tossmini-docs.toss.im/tds-mobile/components/Asset/asset/
- TextField: https://tossmini-docs.toss.im/tds-mobile/components/TextField/text-field/
- Top: https://tossmini-docs.toss.im/tds-mobile/components/top/
- Apps in Toss game profile setup reference: https://developers-apps-in-toss.toss.im/game-center/intro.html

| Area | Current classification | Notes |
| --- | --- | --- |
| Toss service-use consent | Apps in Toss-required / Needs console verification | The official login intro states that login terms and partner service terms are configured in the Apps in Toss console and the user consent screen is automatically constructed from that setup. Aniwhere does not add a duplicate in-app terms screen; missing consent in the uploaded build should be verified against console login setup and whether the sandbox account already consented. |
| `/intro` nickname sheet | TDS-required / Product-approved | Missing-nickname users now complete Aniwhere profile setup in a TDS `BottomSheet` containing TDS `BottomSheet.Header`, `Asset.Image`, `TextField`, and bottom CTA `Button`. The copy was shortened to the game profile setup rhythm: `애니웨어에서 사용할 닉네임이 필요해요`, emoji profile selection, `닉네임`, input, and `확인`. Empty values surface `hasError` and `help` copy inside the field, and the real save flow still calls Swagger-backed nickname availability before updating `/api/v1/users/me/nickname`. |
| `/intro` nickname mock entry | Product-approved / ADS adjustment aid | The secondary intro action is now `닉네임 설정하고 입장` and opens the same `NicknameOnboardingSheet` without starting `appLogin()`. Mock submission validates one or more characters and routes to `/home` with the same welcome-toast state, but intentionally skips the backend nickname availability/update calls so ADS/local layout tuning can reuse the exact real-login sheet surface without mutating user data. |
| `/home` welcome toast | Product-approved / TDS-informed | Existing named users who complete Toss login and users who just saved a nickname enter `/home` with route state that renders a top TDS `Toast`: `{emoji} {nickname}님 반가워요!` when an emoji was selected, otherwise `{nickname}님 반가워요!`. This replaces the previous confetti welcome panel so login completion stays compact and matches the game profile setup reference. |
| Nickname emoji | API-required / Product-approved | Swagger now exposes `emojiIconFilename` on both `UpdateNicknameRequest` and `UserSummary`. The frontend sends the selected Toss static emoji filename with the nickname save payload and keeps the selected symbol in route state only for the immediate welcome toast. |
| `/home` admin entry | Product-approved / API-required | Home shows a small operation-management entry after the primary CTA stack only when the stored Toss login session role is admin-like (`ADMIN`, `ROLE_ADMIN`, or `*_ADMIN`). It links to `/admin` and preserves the existing `AdminAccessGate`; no admin bypass or auto-redirect is introduced. |
| Runtime verification | Needs sandbox | Local source tests and builds can verify contract and bundle shape, but the Toss consent screen, official BottomSheet animation, TDS Lottie rendering, and authenticated admin role visibility require Apps in Toss sandbox verification. |

### 2026-05-28 Main Backend Contract Follow-up

Official docs checked with official web fallback in the current session:

- Backend Swagger JSON: https://api.aniwhere.link/v3/api-docs
- ListRow overview: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/
- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/

| Area | Current classification | Notes |
| --- | --- | --- |
| Review API migration | API-required / Product-approved | Backend `main` removed legacy `/api/v1/posts` community endpoints and added shop-scoped review APIs under `/api/v1/shops/{shopId}/reviews`. Client stale post request helpers were removed, and `/community` now routes to an API-safe review 안내 surface until a fuller shop-review composer is designed. |
| `/home` recent review preview | API-required / Product-approved | Home no longer fetches removed `GET /api/v1/posts`. The section now explains that reviews are organized per shop because there is no aggregate recent-review Swagger endpoint yet. |
| `/shop/detail/:shopId` review summary | Product-approved / API-required | Shop detail now reads `Shop.averageRating`, `Shop.reviewCount`, and the first page of `GET /api/v1/shops/{shopId}/reviews` to expose current backend review data without inventing a cross-shop feed. |
| `/explore` review tab link | Regression fixed / API-required | The selected-shop review tab no longer links to `/community?shopId=...`; it links to the shop detail route where the new shop-scoped review data can be shown. |
| Runtime verification | Needs sandbox | Source tests, lint, and build can verify removed post endpoints and new API types. Authenticated review create/update/like flows still need a product UI pass and Apps in Toss sandbox verification before launch. |

### 2026-05-30 Explore Map Quick Chip Favorite And Sort Follow-up

Official docs checked with Apps in Toss MCP in the current session:

- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- Icon Button: https://tossmini-docs.toss.im/tds-mobile/components/icon-button/
- SearchField: https://tossmini-docs.toss.im/tds-mobile/components/search-field/
- ListRow: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/
- Backend Swagger JSON: https://api.aniwhere.link/v3/api-docs

| Area | Current classification | Notes |
| --- | --- | --- |
| `/explore` map quick chips | Product-approved / TDS-informed | The quick chips remain an app-owned compact map toolbar, implemented with native `button` semantics, `aria-pressed`, and explicit labels for icon-heavy actions. TDS `Button` and `IconButton` docs informed the action semantics, state clarity, and `aria-label` requirement for the time-only chip. |
| Open-status chip replacement | Product-approved / Follow-up filter | The `영업중` quick chip is kept as a hidden placeholder in the configuration with a clock icon for the future hours/open-status filter, but it is not rendered in the current map chip rail so unfinished behavior is not exposed. |
| Favorite quick chip | Product-approved / API-required | `관심매장` is the only visible map quick chip and now reads Swagger-backed `GET /api/v1/users/me/favorite-shops` when an Aniwhere auth token exists. The local `favoriteShopIds` set remains only for detail mutation state after `POST/DELETE /api/v1/shops/{id}/favorite`; it is no longer the source for the quick-chip result list. |
| Sort facets and home CTA routing | Product-approved / API-required | `리뷰많은순` remains removed from the map quick-chip rail. `/home` now routes the favorite/review banners into `/explore?view=map&sort=FAVORITE_COUNT_DESC` and `/explore?view=map&sort=REVIEW_COUNT_DESC`. The filter sheet requests `includeSorts=true`, renders only user-selectable non-default Swagger sort facets, and keeps `NEWEST` as the implicit default instead of a visible chip. Sort labels are normalized client-side to `관심 많은순` and `리뷰 많은순` so `/home` CTA wording and facet chips stay matched even if the backend label text differs. |
| Sorted map POIs | Product-approved / API-required | `/explore` preserves API order for `REVIEW_COUNT_DESC` and `FAVORITE_COUNT_DESC` in list surfaces, but the map keeps the existing neutral shop-name POI chip with no rank badge. Ranking is treated as result ordering/filter context rather than a map-marker decoration, matching the direction observed in map-first references where POIs show membership/location and lists explain priority. The neutral shop chip no longer includes the earlier coral dot because it did not communicate status, category, or rank; the chip prioritizes the full shop name and only falls back to CSS clipping for very long labels. |
| `/explore` list cards | Product-approved / API-required | The list surface uses Swagger `Shop` response fields for summary content and additionally fetches recent review pages only for currently visible list cards through `GET /api/v1/shops/{shopId}/reviews`. Card photos now combine shop images and review images in latest-first order, with the same four-slot carousel and `더보기 n개` overlay used by expanded detail. It still does not fill review copy with `visitTip` or `description`, avoiding misleading fallback text. The visible `검색 결과` title was removed because applied chips and cards already establish context, and the scroll container reserves right-side gutter so the scrollbar does not cover right-aligned review counts. |
| `/search` and `/explore?view=list` result heading | Product-approved / Regression fix | Both routes now share the `search-result-head` pattern with `매장목록` and the API-backed count. `/explore?view=list` keeps search as a route transition into `/search` with the encoded current list route as `returnTo`, so keyword entry and result counting use the same mental model as work/shop search. The top route-entry control was restored to `map-search-row search-screen-toolrow` because converting it to a read-only `SearchField` broke the shared home search affordance and blurred the editable-vs-navigation boundary. `/search?returnTo=/explore?view=map` now also uses the same `map-search-row search-screen-toolrow`, `search-screen-bar map-search-field`, and `map-filter-button` rhythm; the inner search control is an app-owned native `input` so it no longer renders `tds-mobile-search-field` chrome inside the shared map row. |
| Shared search placeholder | Product-approved / Regression fix | Official SearchField doc checked again with Apps in Toss MCP on 2026-05-30: `SearchField` (https://tossmini-docs.toss.im/tds-mobile/components/search-field/). The app-owned shared map search row now uses one copy source, `SHOP_SEARCH_PLACEHOLDER`, so `/home`, `/explore`, and `/search?returnTo=/explore?view=map` all show `작품, 매장명, 지역으로 검색` instead of route-specific placeholder variants. |
| Search-to-list routing cleanup | Product-approved / Regression fix | Official SearchField, Button, Icon Button, Text Button, and ListRow docs were checked with Apps in Toss MCP on 2026-05-30. `/search` is now the keyword/filter entry route only; submitting a keyword or recent search navigates to `/explore?view=list` and result rendering is owned by `MapResultsSheet`. `/explore` search entry encodes a list-mode `returnTo`, home work posters and detail work links open `/explore?view=list&scope=work&keyword=...`, and applied filter chips in list mode render below `search-result-head` rather than in a separate top strip. This is product-approved because it reduces duplicated result UI while preserving the app-owned search row that matches the approved mobile baseline. |
| Map/list toggle | Product-approved / TDS-informed | The map/list toggle is a consistent bottom-center floating pill with icon and text (`목록보기`/`지도보기`) across map and list states. TDS Button `variant="weak"` + `color="dark"` was tested but was too low-contrast on Naver map tiles, so the toggle now uses the checked TDS Button `color="dark"` fill token (`--tDarkFillButtonBackground`) with inverse text. This keeps it distinct from the selected blue map POI chip while preserving enough map-surface visibility. |
| Runtime verification | Passed local / Needs sandbox | Source tests, lint, and build verify API contract, filter counting, sheet sort facets, home CTA routes, favorite-list query wiring, and neutral map marker source/CSS. An authenticated Apps in Toss sandbox check is still required for final PR confidence because local browser auth cannot prove real Toss login/favorite state. |

### 2026-05-31 Category Catalog Sync Follow-up

Official docs checked with Apps in Toss MCP in the current session:

- Checkbox: https://tossmini-docs.toss.im/tds-mobile/components/checkbox/
- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- BottomSheet: https://tossmini-docs.toss.im/tds-mobile/components/bottom-sheet/
- Backend Swagger JSON: https://api.aniwhere.link/v3/api-docs
- Deployed categories API: https://api.aniwhere.link/api/v1/categories

| Area | Current classification | Notes |
| --- | --- | --- |
| `/admin/shops` category selector | API-required / Product-approved | The admin shop form continues to use Swagger-backed `GET /api/v1/categories` rather than a local category list. The deployed category masters now include `가챠`, `굿즈`, `제일복권`, and `피규어`; the query refetches on mount so newly added backend categories are not hidden by an older client-side cache when an operator returns to the form. |
| Search/explore facet category selector | API-required / Product-approved | The filter sheet continues to render every category returned by `GET /api/v1/shops/facets?includeCategories=true`. Facet query keys now include `includeSorts` and refetch on mount, preventing mixed/stale facet payloads when category and sort options change on the backend. |
| Admin save invalidation | API-required | Saving a shop invalidates `shops`, `categories`, and `shops/facets` query scopes so category counts and filter option caches refresh after create/update flows. |
| Runtime verification | Needs sandbox | Local tests/build can prove source wiring and API contract alignment, but actual Apps in Toss admin access and production category data should still be checked in sandbox or an authenticated admin session. |

### 2026-05-31 Work Type Facet Follow-up

Official docs checked with Apps in Toss MCP in the current session:

- Segmented Control: https://tossmini-docs.toss.im/tds-mobile/components/segmented-control/
- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- BottomSheet: https://tossmini-docs.toss.im/tds-mobile/components/bottom-sheet/
- Backend Swagger JSON: https://api.aniwhere.link/v3/api-docs
- Deployed facets API: https://api.aniwhere.link/api/v1/shops/facets

| Area | Current classification | Notes |
| --- | --- | --- |
| Search/explore work type facet | API-required / Product-approved | `GET /api/v1/shops/facets?includeWorkTypes=true` now drives the `작품 유형` filter chips. Selecting `애니메이션` or `게임` writes `workType=ANIMATION\|GAME` to the URL and sends the same Swagger-backed `workType` param to `GET /api/v1/shops`. |
| Applied filter chips | Product-approved / API-required | Applied chips now include work type labels from the facet payload and can remove only the selected work type without clearing region/category/sort filters. |
| `/admin/shops` work selector | Product-approved / TDS-informed | Admin create/edit keeps the existing SearchField + ListRow work picker, and adds app-owned work-type chips above the search box. The chips use the Swagger `workTypes` labels to narrow suggestion results while save payload remains `workIds`, matching the current `ShopRequest` contract. |
| Runtime verification | Needs sandbox | Source tests/build can verify filter and admin source wiring. Authenticated admin editing in Apps in Toss runtime still needs sandbox verification. |

### 2026-05-31 Explore Review Station Follow-up

Official docs checked with official web fallback in the current session because `ax search tds-web --query Rating --limit 3` timed out:

- Rating: https://tossmini-docs.toss.im/tds-mobile/components/rating/
- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- Top: https://tossmini-docs.toss.im/tds-mobile/components/top/
- Icon Button: https://tossmini-docs.toss.im/tds-mobile/components/icon-button/
- Modal: https://tossmini-docs.toss.im/tds-mobile/components/modal/
- Backend Swagger JSON: https://api.aniwhere.link/v3/api-docs

| Area | Current classification | Notes |
| --- | --- | --- |
| `/explore` map camera restore | Product-approved / Regression fix | Map/list toggles keep using `replace` navigation so browser/native history does not accumulate. The last Naver camera is stored as transient in-memory viewport state and passed back into `ShopMap` when returning from the full list, avoiding URL camera params while preserving the user's cluster-zoom context. |
| `/explore` review station | TDS-required / Product-approved | The old `/shop/detail/:shopId` UI was removed. Review creation now opens inside `/explore?shopId=:id&sheet=review`, keeping the selected shop/map context and using official TDS `Rating`, `Modal`, and `Button` through the `@aniwhere/tds-mobile` facade. The visible form follows the Toss Place review-writing reference: shop summary first, centered visit question and rating, review textarea, photo strip, and bottom completion CTA. The review form follows the current Swagger contract: `rating` and `content` are query params, and optional `images` are multipart form data. The CTA becomes available once rating and non-empty text exist, then the 10-character rule is validated on submit so short drafts remain visible with a field-level message instead of being cleared. |
| Review station navigation guard | Product-approved / Regression fix | The custom `map-review-station-back` button and the later TDS `IconButton` back action were removed so Apps in Toss native navigation owns the back affordance. The station still protects unsaved rating/content/photo drafts with a TDS `Modal` confirmation when native/browser route navigation is triggered. The modal copy uses task-focused wording (`리뷰 작성을 그만할까요?`) instead of route-oriented wording, and browser `alert()`/`confirm()` is intentionally avoided. |
| Review owner actions | API-required / TDS-informed | The selected-shop review tab now reads `GET /api/v1/shops/{shopId}/reviews` in expanded mode and shows edit/delete actions only when the stored Aniwhere session user id matches `ShopReview.authorUserId`. Editing reuses the same review station with prefilled rating/content and calls `PATCH /api/v1/shops/{shopId}/reviews/{reviewId}`. Deleting uses a TDS `Modal` confirmation before `DELETE /api/v1/shops/{shopId}/reviews/{reviewId}`. Existing image removal is intentionally deferred because Swagger exposes image upload on update but no per-image delete contract. |
| Review station map-layer isolation | Regression fixed | Review mode now hides map zoom/location/list/LLM controls and raises the review station above the Naver map layer, preventing `/explore?view=map` controls and map copyright from appearing inside the review CTA area. |
| Legacy detail route | Product-approved / Compatibility | `/shop/detail/:shopId` remains only as a redirect into `/explore?shopId=:id&sheet=expanded` so stale links do not break while the duplicate detail UI/CSS surface is removed. |
| Photo attachment | Product-approved | TDS does not provide a confirmed photo-picker primitive in the checked scope, so the station uses app-owned file input and preview chips with token styling. The control limits selection to image files and a maximum of five previews before calling the review API. |
| Runtime verification | Needs sandbox | Source tests can verify route/API wiring and public fallback shape. Authenticated review submission, native file picker behavior, and official TDS Rating rendering need Apps in Toss real-device sandbox verification. |

### 2026-05-31 Admin And Explore Detail Polish Follow-up

Official docs checked with Apps in Toss MCP in the current session:

- Rating: https://tossmini-docs.toss.im/tds-mobile/components/rating/
- Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- Modal: https://tossmini-docs.toss.im/tds-mobile/components/modal/
- Top: https://tossmini-docs.toss.im/tds-mobile/components/top/
- Asset: https://tossmini-docs.toss.im/tds-mobile/components/Asset/check-first/

| Area | Current classification | Notes |
| --- | --- | --- |
| `/admin/shops` work type filter separation | Product-approved / Regression fix | 작품 유형은 저장 payload가 아닌 작품 검색을 좁히는 facet이므로 `취급 작품` 섹션 내부에서 분리해 별도 `작품 유형 필터`로 배치했다. 저장은 계속 Swagger `ShopRequest.workIds`만 보낸다. |
| `/admin/**` back routing | Product-approved / Regression fix | 관리자 목록, 등록/수정, 주소검색의 back 동작은 `navigate(-1)` 대신 고정 admin 경로 `replace`를 사용한다. 같은 화면이 history에 쌓여 native/app-owned back icon이 같은 route를 반복 표시하는 문제를 막는다. |
| Admin update time | API-required / Regression fix | 매장 목록의 절대 시간 포맷은 KST 기준(`Asia/Seoul`)으로 고정했다. 상대 시간은 서버 timestamp 자체를 기준으로 계산하므로 sandbox에서 서버 timestamp offset을 추가 확인한다. |
| `/explore` expanded media | Product-approved / TDS-informed | TDS Asset 문서는 이미지/비디오를 일관된 frame/content 구조로 표시하는 원칙을 제공하지만, 전체 사진 조회 갤러리 primitive는 확인되지 않았다. 상세 히어로는 앱 소유 이미지 영역으로 유지하되 장식 overlay/tone 테두리를 제거하고 등록 이미지를 full-bleed로 채운다. 사진 탭은 2장 이상부터 노출해 전체 사진 피드로 이동할 수 있게 했다. |
| `/explore` detail rhythm | Product-approved / Regression fix | 카테고리 키워드는 매장명 하단 chip으로 이동하고, AI 요약과 정보 리스트의 inline 범위를 맞췄다. 탭 텍스트는 375px 기준으로 너무 작게 보이던 `body-sm`에서 `body-md`로 키웠다. |
| Review station and review list Rating | TDS-required / Needs sandbox | 공식 Rating 문서는 `variant: full \| compact \| iconOnly`를 명시한다. 리뷰 작성 완료 후 실기기에서 발생한 `unhandled variant` 방어를 위해 작성/목록 Rating에 `variant="full"`을 명시하고 리뷰 목록 rating 값을 0~5로 보정했다. 실기기에서 동일 submit flow 재확인이 필요하다. |
| Review content counter and list photos | Product-approved / Regression fix | 리뷰 textarea는 `n/800` 글자 수를 표시한다. `/explore?view=list` 카드 사진은 매장 사진과 리뷰 사진을 최신순으로 합친 가로 캐러셀을 유지하고, 5장 이상이면 4번째 카드에 `더보기 n개` overlay를 표시한다. |

| `/explore` peek/list summary polish | Product-approved / Regression fix | 리스트 카드의 `map-results-card-meta`는 peek sheet 카테고리와 같은 chip 리듬으로 맞췄다. Peek sheet는 길찾기 CTA를 제거하고, 당근마켓 참고처럼 별점과 리뷰 수를 오른쪽에 세로로 배치했다. 별점/리뷰가 아직 없는 매장도 `0.0`, `리뷰 0개`로 같은 영역을 유지한다. 길찾기는 expanded detail 정보 영역에서만 제공한다. |
| `/explore` detail media and expanded order | Product-approved / TDS-informed | `/explore?sheet=expanded`는 기존 큰 히어로 우선 구조에서 당근마켓식 정보 우선 구조로 조정했다. Sheet 상단 drag handle을 분리하고, 본문 순서를 `매장 요약 → 사진 캐러셀 → 탭/정보`로 바꿨다. 리스트 카드와 상세 사진 모두 3.5장 노출 가로 캐러셀을 쓰며, 5장 이상인 경우 마지막 보이는 사진에 blur overlay, photo icon, `더보기 n개` 라벨을 표시한다. 상세 rail의 더보기 타일은 이미지 뷰어 대신 사진 탭을 활성화한다. |
| `/explore` to `/search` return routing | Regression fix | `/explore?view=map`에서 검색 화면으로 진입했다가 back을 누르면 list로 고정되던 문제를 수정했다. 검색 결과 제출은 계속 `/explore?view=list`를 사용하지만, 검색 화면의 `returnTo`는 진입 당시 `routeViewMode`를 보존해 map/list 중 원래 접근한 view로 돌아간다. |
| Favorite auth header on device | Regression fix / Needs sandbox | 실기기 favorite 토글에서 WebKit `the string did not match the expected pattern` 오류가 보고되어, 저장 세션 토큰과 API client Authorization 헤더 생성 모두에서 `Bearer` 중복, wrapping quote, CR/LF/tab 문자를 제거하도록 방어했다. 로컬 source test/build는 가능하지만 실제 Apps in Toss 저장 토큰 형태는 실기기 sandbox에서 재확인이 필요하다. |

| `/explore` expanded detail header structure | Product-approved / TDS-informed | Expanded shop detail은 당근/토스플레이스식 구조를 더 직접적으로 따른다: drag handle, 매장명과 같은 row에 배치된 관심/공유 액션, 한 줄 별점/리뷰 row, 카테고리 chip, 세로 포스터형 사진 레일, `정보 / 리뷰 n / 사진 / 취급작품` 탭, 정보 row 순서로 정리했다. 주소 row 자체가 밑줄 링크형 길찾기 trigger가 되므로 기존 별도 길찾기 버튼은 제거했다. TDS ListRow 내부 padding이 expanded detail content grid를 깨는 구간은 app-owned row로 전환하고 동일한 16px content inset을 적용했다. |
| `/explore` review item feed | Product-approved / API-required | TossPlace review reference를 기준으로 review item은 작성자 avatar/emoji, 별점, 닉네임, 작성일을 한 메타 row에 묶고, 사진은 2열 square grid로 본문보다 먼저 노출한다. `origin/main`의 review 응답 동기화 이후 Swagger `ShopReview.authorEmojiIconFilename`을 우선 사용하며, 내 리뷰에서만 저장 세션의 emoji를 보조 fallback으로 유지한다. |

| `/explore` expanded detail tabs | Regression fix | The four-tab rail no longer uses negative inline margins inside the `overflow-x: hidden` detail body. It keeps the sticky rail in the sheet bounds, applies the detail inline padding to the tab content, and gives tab labels `min-width: 0` plus `white-space: nowrap` so the first and last labels do not look clipped on mobile widths. |
| `/explore` photo tab and viewer | Product-approved / TDS-informed | Official TDS docs checked for this pass: Asset (`/tds-mobile/components/Asset/check-first/`), Modal (`/tds-mobile/components/modal/`), BottomSheet (`/tds-mobile/components/bottom-sheet/`). TDS does not expose a confirmed full-screen photo review carousel primitive, so the photo feed and viewer are app-owned. The photo tab now combines shop-uploaded images and review images; feed images keep their natural aspect ratio instead of square-cropping. Tapping a review image opens a full-screen, horizontal scroll-snap viewer with the related review content, rating, author, and a `리뷰 보기` action. Tapping a shop-uploaded image opens the same viewer as image-only content. |

### 2026-05-31 Explore Media Source Cleanup Follow-up

Official docs checked with Apps in Toss MCP in the current session:

- Asset: https://tossmini-docs.toss.im/tds-mobile/components/Asset/check-first/
- Modal: https://tossmini-docs.toss.im/tds-mobile/components/modal/
- Rating: https://tossmini-docs.toss.im/tds-mobile/components/rating/
- BottomSheet: https://tossmini-docs.toss.im/tds-mobile/components/bottom-sheet/
- Typography: https://tossmini-docs.toss.im/tds-mobile/foundation/typography/
- Result: https://tossmini-docs.toss.im/tds-mobile/components/result/
- Asset/Icon: https://tossmini-docs.toss.im/tds-mobile/components/Asset/check-first/
- Toss graphic resources: https://developers-apps-in-toss.toss.im/design/resources.md
- Lottie reference checked but not used: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Lottie.md

| Area | Current classification | Notes |
| --- | --- | --- |
| `/explore` expanded media source | API-required / Product-approved | Detail media uses Swagger-backed shop images from `Shop.images` and review images from `GET /api/v1/shops/{shopId}/reviews`; the legacy local admin photo storage fallback was removed so user-facing media cannot show images outside the server/API contracts. |
| `/explore` expanded media more tile | Product-approved / TDS-informed | The app-owned media rail shows up to four combined shop/review images. When the combined set has five or more images, the fourth tile receives the existing blur/photo-icon/`더보기 n개` overlay; one to four images render without the overlay. Tapping that more tile activates the `사진` tab rather than opening a single-image viewer. |
| `/explore` review/photo viewer grouping | Product-approved / TDS-informed | Review photos continue to open as the tapped review's own image set with persistent review metadata, while shop-uploaded images open as image-only viewer content. TDS does not define this full-screen carousel primitive, so the implementation stays app-owned and uses checked Asset/Modal/Rating guidance as supporting evidence. |
| `/explore` info tab address row | Product-approved / TDS-informed | Official ListRow, Typography, Button, and TextButton docs were checked for the touched primitives. The separate `위치` row stays removed because `regionName` is primarily a facet/search context and duplicated the address row. The address text itself is now the underlined map search action, while only `floorLabel` appears as optional compact metadata beside it when available. |
| `/explore?view=list` result list inset | Product-approved / TDS-informed | Official ListRow and Typography docs were checked for the touched list/content primitives. The list panel keeps the existing 12px outer inset and stable scrollbar gutter, but the inner scroll container's right padding is reduced from `--ait-space-4` to `--ait-space-1` so result cards no longer feel more clipped on the right than the left. |
| `/explore` review actions and photo rail | Product-approved / API-required / TDS-informed | Official docs checked for this pass: Menu (`https://tossmini-docs.toss.im/tds-mobile/components/menu/`), Icon Button (`https://tossmini-docs.toss.im/tds-mobile/components/icon-button/`), Toast (`https://tossmini-docs.toss.im/tds-mobile/components/toast/`), Modal, Rating, and Backend Swagger JSON. Review cards and the full-screen review-photo viewer now use a three-dot menu pattern for `리뷰 신고하기`; Swagger exposes no review report endpoint yet, so the action is intentionally wired to a short Toast notice instead of a fake API call. Review helpful/like uses the Swagger `POST/DELETE /api/v1/shops/{shopId}/reviews/{reviewId}/likes` contract, with `ShopReview.likeCount` and `likedByMe` driving `n명이 도움된다고 해요` and button state. When `likeCount` is `0`, the secondary helper is hidden to avoid empty-count noise; the button label is `유용해요`. The separate review-tab-only photo strip was removed. The expanded and list card photo rails now combine shop-uploaded images and review images, sorted by latest available registration time; tapping a review image in detail still opens the review photo viewer and can continue to `리뷰 보기`. Review count is already available in the tab/header, so the review panel heading avoids repeating `방문 리뷰 n개`. |
| `/explore` review tab write CTA | TDS-required / Product-approved | The review tab write CTA now uses TDS `Result` through `@aniwhere/tds-mobile`, with average-rating copy removed because rating/count are already present in the detail header and tab label. The title is personalized as `{nickname}님, {shopName}에 다녀오셨나요?` with `방문자님` fallback, and the nickname/shop name are highlighted inside the title so the prompt can stay compact while preserving context. The helper explains that reviewed visits may receive points after admin verification. The CTA always starts a new review so repeat visits can be recorded as separate visits; existing reviews authored by the current user are edited or deleted from each review's three-dot menu instead. The old `u1FA99.png` emoji rendered as a bank icon in the Toss static set, so the CTA uses a small static won coin marker rather than the bank icon or a Lottie treatment. Route CSS overrides the official Result default padding at this specific surface so the mobile prompt stays compact, and the CTA button content keeps a restrained 4px icon/text gap. |
| `/explore?sheet=review` rating prompt | Product-approved / Regression fix | The review writing station no longer shows the shop name as a separate standalone row above the rating question. Instead, the first prompt reads `{shopName} 방문이 어떠셨나요?` with the shop name bolded and ellipsized in one line. This avoids adding another divider inside the form while still making the rating target clear before the TDS `Rating` control. |
| `/explore?sheet=review` textarea and photo rhythm | Product-approved / TDS-informed | The review form keeps the app-owned textarea/photo picker because no confirmed TDS photo attachment primitive is available in the checked scope. The character counter now sits inside the textarea frame at the bottom-right, matching the reference review-writing rhythm without adding a separate row. The textarea uses a fixed 196px frame, the photo section gets the larger post-textarea breathing room from the reference, and the `+ 사진 추가` tile uses the same inline 88px action-card treatment with the reference orange solid border. Selected previews remain adjacent to the add tile, with a smaller top-right remove button so the strip reads as one continuous row. |
| Runtime verification | Needs sandbox | Source tests verify the API source boundary and viewer grouping. Apps in Toss WebView photo scrolling, safe-area behavior, and image loading should still be checked on device. |

### 2026-05-31 Explore Review Device Polish Follow-up

Official docs checked in the current session:

- TDS Icon Button: https://tossmini-docs.toss.im/tds-mobile/components/icon-button/
- TDS Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- TDS Menu: https://tossmini-docs.toss.im/tds-mobile/components/menu/
- TDS Rating: https://tossmini-docs.toss.im/tds-mobile/components/rating/
- TDS TextArea: https://tossmini-docs.toss.im/tds-mobile/components/TextField/text-area/
- TDS Asset: https://tossmini-docs.toss.im/tds-mobile/components/Asset/frame/
- Apps in Toss openURL: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%ED%99%94%EB%A9%B4
- Apps in Toss external link guideline: https://developers-apps-in-toss.toss.im/checklist/miniapp-external-link.md
- Naver Maps URL Scheme: https://guide-gov.ncloud-docs.com/docs/naveropenapiv3-maps-url-scheme-url-scheme
- Backend Swagger JSON: https://api.aniwhere.link/v3/api-docs

| Area | Current classification | Notes |
| --- | --- | --- |
| Review ownership and modified date | Product-approved / API-required | Review cards now mark the current user's own review with `내가 쓴 리뷰예요!` and show an additional `(yy.MM.dd에 수정됨)` label only when `updatedAt` is later than `createdAt`. The badge is app-owned but follows checked Menu/Rating review-card rhythm. |
| Review station existing photos | Product-approved / API-required | Existing review images render in the same horizontal attachment rail as newly selected images, count toward the 5-image limit, and expose a compact remove button. Swagger still exposes no existing review image ID retention/deletion field on update, so persistent deletion of already-uploaded review images remains a backend contract gap. |
| Review station vertical rhythm | Product-approved / Regression fix | The review form reduces body gap, textarea-to-photo spacing, and bottom reserve so the photo rail and completion CTA are less likely to split across two mobile viewports. |
| Photo tab image stability | Product-approved / Regression fix | The masonry photo feed keeps the two-column CSS column layout, but feed images now load eagerly with async decoding and each item gets a compositor hint to avoid WebView scroll-time visual deactivation. |
| Naver directions | Product-approved / Needs sandbox | Apps in Toss runtime now tries the Naver Maps `nmap://route/public` or `nmap://search` app scheme through `openURL`, then falls back to the existing Naver mobile web URL when the scheme cannot open. The copy remains a directions action, not an app install prompt, to stay within the external-link guideline. Real-device sandbox should confirm iOS/Android scheme handling. |
| Favorite auth header | Regression fix / Needs sandbox | Auth token normalization now removes duplicate `Bearer`, wrapping quotes, WebView control characters, line/paragraph separators, NBSP, and whitespace before creating the `Authorization` header. Source tests and lint/build pass; the previously reported WebKit pattern error still needs real-device confirmation. |
| Photo more overlay icon | Product-approved / Regression fix | The more tile keeps `더보기 n개` and now uses a camera/photo glyph instead of a square image frame glyph in both detail and list carousels. |

### 2026-06-01 Explore Detail Empty Taxonomy And Back Routing Follow-up

Official docs checked in the current session:

- TDS Result: https://tossmini-docs.toss.im/tds-mobile/components/result/
- TDS Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- TDS ListRow overview: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/
- TDS ListRow components: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-components/
- TDS Top: https://tossmini-docs.toss.im/tds-mobile/components/top/
- TDS Toast: https://tossmini-docs.toss.im/tds-mobile/components/toast/
- TDS Typography: https://tossmini-docs.toss.im/tds-mobile/foundation/typography/

| Area | Current classification | Notes |
| --- | --- | --- |
| `/explore` detail taxonomy rows | Product-approved / Regression fix | If a shop has no registered category or work-type labels, the detail information tab now omits those rows entirely instead of showing fallback absence copy. The top summary chip row already hides itself when there are no category/work-type chips, so the detail screen no longer repeats empty taxonomy states. |
| `/explore` empty review tab | Product-approved / TDS-informed | The review write prompt continues to use TDS `Result`, but when the loaded review list is empty the review tab centers that prompt in the panel and removes the separate `아직 등록된 리뷰가 없어요.` footnote. This keeps the empty state focused on the review action rather than a status message. |
| `/explore?view=list` detail back routing | Regression fix / Needs sandbox | Selecting a shop from list view still pushes a detail history entry, so browser/native back can return to the previous list entry. The route transition now restores the saved list scroll position and visible count, and the local back handler uses `navigate(-1)` for list-origin expanded detail instead of replacing the URL with another list entry. Real Apps in Toss native back behavior should still be confirmed on device. |

### 2026-06-01 Favorite Marker And Admin Home Follow-up

Official docs checked in the current session:

- TDS Top: https://tossmini-docs.toss.im/tds-mobile/components/top/
- TDS Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- TDS ListRow overview: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/
- TDS Toast: https://tossmini-docs.toss.im/tds-mobile/components/toast/

| Area | Current classification | Notes |
| --- | --- | --- |
| `/explore` favorite POI/list state | Product-approved / API-required | Authenticated explore now loads `GET /api/v1/users/me/favorite-shops` whenever an auth token is present, not only when the favorite quick chip is active. The resulting favorite id set is passed to the list sheet and map marker layer. List cards render a compact red heart icon beside the saved shop name, while map POIs render a red heart before the shop label only; facet/category/work-type chip text is not changed, so the favorite signal stays separate from filtering taxonomy. |
| `/admin` home layout | Product-approved / TDS-informed | The admin hub keeps the existing app-owned route shell and `AppTopNavigation`, but the first viewport now uses a 375px-friendly single-column card stack with stable side padding, compact icon/title/status/copy grouping, and a two-column enhancement only above 720px. The change fixes the previously cramped `/admin` entry without adding new `Ait*` imports or expanding admin scope. |
| Runtime verification | Needs sandbox | Source tests and local browser inspection can verify layout structure, but Apps in Toss native safe area and device font behavior should still be checked on real devices. |

### 2026-06-01 Admin Branch Hub Follow-up

Official docs checked in the current session:

- Apps in Toss MCP unavailable in this Codex session; `ax` CLI was also unavailable on PATH, so official web fallback was used.
- TDS Top: https://tossmini-docs.toss.im/tds-mobile/components/top/
- TDS Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- TDS ListRow overview: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/
- TDS ListRow components: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-components/
- TDS Typography: https://tossmini-docs.toss.im/tds-mobile/foundation/typography/

| Area | Current classification | Notes |
| --- | --- | --- |
| `/admin` branch-point hierarchy | Product-approved / TDS-informed | `/admin` is treated as an operational branch point, not a metrics dashboard. The screen now separates the active `바로 처리` branch from `다음 연결` planned branches so admins can enter the currently usable shop-management flow without scanning inactive cards. |
| `/admin` Swagger-backed branches | Product-approved / API-required | Review verification, user/role management, point grants, and account info now link to real admin branch pages. Review status uses `PATCH /api/v1/admin/shops/{shopId}/reviews/{reviewId}/status`; user roles use `PATCH /api/v1/admin/users/{userId}/role`; account info uses `GET /api/v1/users/me` and `GET /api/v1/users/me/reviews`; points keep the existing `VITE_ADMIN_POINT_ENDPOINT`/local `SERVER_QUEUE` boundary because no fixed Swagger point-grant endpoint exists in the checked backend controllers. |
| Local `/admin` preview entry | Product-approved / Local-only | Local dev builds now expose the home admin entry and allow `/admin` through `AdminAccessGate` when `import.meta.env.DEV` is true. Production/public builds still require an admin role from the persisted auth session, so the local WebView preview path does not weaken deployed access control. |
| `/admin` card density | Product-approved / TDS-informed | Official Top/ListRow/Typography/Button docs informed the compact title, section labels, touch rows, and status/action emphasis. Cards remain app-owned because the route uses a custom branch-card pattern, but spacing and token usage stay aligned with the 375px admin baseline. |
| `/admin/reviews`, `/admin/users`, `/admin/points`, `/admin/account` layout | Product-approved / TDS-informed | The new branch pages reuse the app-owned admin route shell with `AppTopNavigation`, compact section panels, horizontal chips, action buttons, and TDS Toast feedback. They avoid `alert()`/`confirm()`, do not add direct `@toss/tds-mobile` imports, and keep unsupported server endpoints out of the UI. |
| Runtime verification | Needs sandbox | Local source tests and browser screenshots can check the route layout, but Apps in Toss native navigation, safe area, and device font behavior still need sandbox/device confirmation. |

### 2026-06-01 User Profile Follow-up

Official docs checked in the current session:

- Apps in Toss MCP unavailable in this Codex session; `ax` CLI was also unavailable on PATH, so the same official web fallback set from the admin branch audit applies.
- TDS Top: https://tossmini-docs.toss.im/tds-mobile/components/top/
- TDS ListRow overview: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/
- TDS Typography: https://tossmini-docs.toss.im/tds-mobile/foundation/typography/

| Area | Current classification | Notes |
| --- | --- | --- |
| `/my` general account route | Product-approved / API-required | The logged-in user profile is a normal user surface, separate from `/admin/account`. `/my` uses existing Swagger-backed `GET /api/v1/users/me`, `GET /api/v1/users/me/favorite-shops`, and `GET /api/v1/users/me/reviews`; it does not require an admin role and does not display raw access or refresh tokens. |
| `/home` profile entry | Product-approved / Local preview | Home now exposes `내 정보` as a compact floating action for signed-in sessions and local dev preview instead of a primary content card. The admin entry remains governed by the existing admin/dev check, so a general user profile entry is not tied to admin authorization or the main discovery CTA stack. |
| Runtime verification | Needs sandbox | Source tests and local build can verify routing/API/UI contracts. Apps in Toss login/session handoff and native navigation should still be checked in sandbox. |

## PR Evidence Format

Every route-level TDS PR must include:

- Route(s) audited.
- Official TDS docs checked.
- `TDS-required` / `Product-approved` / `Regression` classifications.
- Screenshot viewport used, normally 375px wide.
- Commands run.
- `Needs sandbox` items that cannot be proven locally.

### 2026-05-31 Explore/Admin Taxonomy And Review Emoji Follow-up

Official docs checked in the current session:

- TDS Badge: https://tossmini-docs.toss.im/tds-mobile/components/badge/
- TDS Button: https://tossmini-docs.toss.im/tds-mobile/components/button/
- TDS Checkbox: https://tossmini-docs.toss.im/tds-mobile/components/checkbox/
- TDS TextField: https://tossmini-docs.toss.im/tds-mobile/components/TextField/text-field/
- TDS ListRow overview: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/
- TDS ListRow components: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-components/
- Backend Swagger JSON: https://api.aniwhere.link/v3/api-docs

| Area | Current classification | Notes |
| --- | --- | --- |
| Main sync for review emoji | API-required / Regression fix | `origin/main` was merged into the feature branch and brought the server-side `ShopReview.authorEmojiIconFilename` response field. The client type now treats the field as `string \| null` instead of an optional-only frontend guess, so other users' review emoji can render from the review response without relying on the current user's session fallback. |
| Review edited date label | Product-approved / Regression fix | Review cards keep the original created-date label, but the edited marker now mirrors the relative-date rule: updates from today or the last six days show `오늘 수정됨` or `n일 전 수정됨`; older edits show `yy.MM.dd에 수정됨`. |
| `/admin/shops` taxonomy selector rhythm | Product-approved / TDS-informed | The work-type selector keeps narrowing the work search results rather than becoming a persisted `ShopRequest` field, because the current write contract still sends `workIds` and `categoryIds`. Its visible title is now `작품유형` instead of `작품유형 필터`, and it reuses the same rounded selection-chip pattern as category selection. |
| `/explore` taxonomy display | Product-approved / API-required | `Shop.works` still lacks `type` in the deployed Swagger, so Explore enriches shop summaries from the `GET /api/v1/works` catalog by work id and also accepts a future optional `Shop.works[].type`. List cards and the detail title chips show compact `작품유형: 애니메이션/게임` chips after category chips; the information tab renames `취급 정보` to `카테고리` and adds a separate `작품유형` row. |
| Runtime verification | Needs sandbox | Source tests prove the API/type wiring and source-level UI contracts. Real Apps in Toss WebView should still confirm chip wrapping and list-card density at 375px after server deployment. |

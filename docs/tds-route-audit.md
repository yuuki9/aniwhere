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
| `/explore` top search entry | Product-approved | Kept as an app-owned map overlay route entry. Official `SearchField` remains the reference for editable search fields, not navigation-only affordances. |
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
| `/intro` login-free home entry | Product-approved / Temporary unblock | While Toss login token exchange is blocked in sandbox, intro exposes a secondary `로그인 없이 둘러보기` action that routes to `/home`. The primary Toss login CTA remains first and unchanged, so this is a temporary exploration bypass rather than a replacement login path. Runtime login still needs sandbox verification. |
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
| `/home` vertical CTA carousel | Product-approved / Asset-informed | The three CTA cards now use the newly generated 1024x1536 vertical images from the local Downloads folder. The card frame stays white and app-owned, while the image fills a 2:3 card and the copy is reduced to two title lines: `가까운 매장부터 / 한눈에 보기`, `많이 찜한 매장 / 먼저 둘러보기`, and `후기 많은 매장 / 믿고 찾아보기`. This follows the approved Olive Young-like content-curation carousel direction; TDS `Asset` informed the stable media frame, but TDS Mobile still does not define this exact horizontal content rail. |
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

## PR Evidence Format

Every route-level TDS PR must include:

- Route(s) audited.
- Official TDS docs checked.
- `TDS-required` / `Product-approved` / `Regression` classifications.
- Screenshot viewport used, normally 375px wide.
- Commands run.
- `Needs sandbox` items that cannot be proven locally.

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

## PR Evidence Format

Every route-level TDS PR must include:

- Route(s) audited.
- Official TDS docs checked.
- `TDS-required` / `Product-approved` / `Regression` classifications.
- Screenshot viewport used, normally 375px wide.
- Commands run.
- `Needs sandbox` items that cannot be proven locally.

# Aniwhere Design Tokens

Aniwhere manages client styling through Apps in Toss/TDS-inspired CSS tokens.

## Source

Global tokens live in `client/src/styles/tokens.css` and are imported by `client/src/index.css`.

Route-level TDS migration and token exceptions are audited in `docs/tds-route-audit.md`. Before adding or changing typography, spacing, radius, color, or component-size tokens for a route, check the route's official TDS docs and classify the delta as `TDS-required`, `Product-approved`, or `Regression`.

Use tokens for new CSS instead of raw values:

- Color: `--ait-color-*`
- Spacing: `--ait-space-*`
- Radius: `--ait-radius-*`
- Typography: `--ait-font-size-*`, `--ait-line-height-*`
- Shadow: `--ait-shadow-*`
- Component sizing: `--ait-component-*`

## Rules

- Keep Apps in Toss WebView as a light-theme service unless official guidance changes.
- Use `--ait-color-brand` as the service primary color and keep it aligned with `client/granite.config.ts`.
- Use component tokens for repeated controls such as buttons, icon buttons, cards, list rows, sheets, and tab bars.
- Prefer `375px` as the narrow mobile design baseline, matching Apps in Toss app-builder guidance.
- Do not introduce new raw color, radius, spacing, or shadow values in feature CSS unless the value is truly one-off or asset-specific.

## Migration

Legacy aliases remain available while the large existing stylesheet is migrated:

- `--brand`
- `--surface`
- `--surface-soft`
- `--text-strong`
- `--text-subtle`
- `--border`
- `--shadow`

New code should prefer the `--ait-*` tokens directly.

## TDS Runtime Priority

Apps in Toss/ads/local 출시 기준 화면은 프로젝트 TDS facade를 통해 공식 `@toss/tds-mobile` 컴포넌트를 먼저 사용한다. page code는 `@toss/tds-mobile`을 직접 import하지 않는다. 기존 `client/src/shared/ui/ait`와 local token layer는 제거 대상의 migration debt로 취급한다.

Public/domain 배포는 `main` 머지 후 자동 반영되므로, 기능 PR도 public build가 깨지지 않게 해야 한다. 다만 제품/UX 기준은 Apps in Toss 출시를 우선하며, 웹 도메인용 별도 CSS나 product surface는 출시 이후 니즈가 확인되면 별도 범위로 확장한다. 공식 TDS runtime import는 adapter/fallback 경계 안에만 둔다.

`@aniwhere/tds-mobile` facade 사용은 공식 TDS 회피가 아니다. Apps in Toss 빌드에서는 facade가 공식 `@toss/tds-mobile`로 resolve되어야 하며, public/domain 빌드에서만 Toss runtime marker 방지를 위해 local fallback으로 resolve한다. 기존 main/public 화면에서 제품적으로 승인된 375px 레이아웃, 리듬, 토큰은 visual regression 기준값으로 삼되, `Ait*` route/page import와 `client/src/shared/ui/ait` 확장은 계속 제거 대상으로 본다.

## TDS-Compatible Local UI

Aniwhere previously used `client/src/shared/ui/ait` for local UI components that mirror common TDS structures. From the Apps in Toss launch branch onward, this layer should shrink and be removed route by route.

Do not add new `Ait*` imports. Existing usage is allowlisted by `client/scripts/assert-ait-usage-allowlist.mjs` only to make migration explicit, and the allowlist should shrink as route-level TDS migration progresses.

- `AitTop`
- `AitListRow`
- `AitButton`

See `docs/tds-compatible-ui-layer.md` for the full rule.

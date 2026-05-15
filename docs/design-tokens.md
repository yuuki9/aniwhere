# Aniwhere Design Tokens

Aniwhere manages client styling through Apps in Toss/TDS-inspired CSS tokens.

## Source

Global tokens live in `client/src/styles/tokens.css` and are imported by `client/src/index.css`.

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

Apps in Toss/ads/local 우선 화면은 프로젝트 TDS facade를 통해 공식 `@toss/tds-mobile` 컴포넌트를 먼저 사용한다. page code는 `@toss/tds-mobile`을 직접 import하지 않는다. 공식 컴포넌트가 없거나 public/domain fallback이 필요한 영역에서만 `client/src/shared/ui/ait`와 local token layer를 사용한다.

Public/domain 배포는 `main` 머지 후 자동 반영되므로, 기능 PR도 public fallback 경계를 함께 지켜야 한다. 공식 TDS runtime import는 adapter/fallback 경계 안에만 둔다.

## TDS-Compatible Local UI

Aniwhere uses `client/src/shared/ui/ait` for local UI components that mirror common TDS structures when official TDS is unavailable or when a public/domain fallback is explicitly in scope.

Do not add new `Ait*` imports casually. Existing usage is allowlisted by `client/scripts/assert-ait-usage-allowlist.mjs` and should shrink as route-level TDS migration progresses.

- `AitTop`
- `AitListRow`
- `AitButton`

See `docs/tds-compatible-ui-layer.md` for the full rule.

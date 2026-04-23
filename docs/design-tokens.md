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

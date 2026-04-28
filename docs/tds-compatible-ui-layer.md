# TDS-Compatible Local UI Layer

Aniwhere keeps a small local UI layer for Apps in Toss/TDS-style screens that must also run on public web domains such as `aniwhere.link`.

## Why This Exists

The official `@toss/tds-mobile` package is intended for approved Apps in Toss environments. When bundled into the public `aniwhere.link` runtime, it can throw before the app renders.

Because Aniwhere needs both public web access and Apps in Toss WebView readiness, the client should:

- Avoid runtime imports from `@toss/tds-mobile` and `@toss/tds-mobile-ait` in public web bundles.
- Follow official TDS structure and review guidance through local components and `--ait-*` CSS tokens.
- Re-check official Apps in Toss and TDS docs before launch, redesign, or reviewer feedback work.

## Local Components

Local TDS-compatible components live under `client/src/shared/ui/ait`.

- `AitTop`: local equivalent for a compact TDS `Top` area.
- `AitListRow`: local equivalent for TDS `ListRow` with `left` asset and two-line contents.
- `AitButton`: local equivalent for a primary TDS-style button.

These components intentionally provide only the patterns Aniwhere currently uses. Add new props only when a real screen needs them.

## Styling Rules

- Put reusable values in `client/src/styles/tokens.css`.
- Use `--ait-*` tokens for colors, spacing, typography, radii, shadows, and component sizes.
- Keep screen-specific CSS thin; prefer `.ait-*` classes for reusable component behavior.
- Do not add raw colors, radii, or spacing to feature CSS unless the value is asset-specific or genuinely one-off.

## Review Checklist

Before merging UI work that touches this layer:

- The screen still works on `aniwhere.link` without `@toss/tds-mobile` in the bundle.
- The layout follows the latest official TDS component structure as closely as local implementation allows.
- The 375px mobile viewport is usable with no horizontal scroll or text overlap.
- `npm run lint`, `npm run build`, and when public deployment is affected, `npm run build:static` pass.
- The launch checklist records anything that still needs Apps in Toss sandbox or console verification.


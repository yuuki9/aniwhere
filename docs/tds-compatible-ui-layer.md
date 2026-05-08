# TDS-Compatible UI Adapter Layer

Aniwhere uses real TDS runtime packages for Apps in Toss builds and a public-web fallback for `aniwhere.link`. Do not duplicate pages for each environment. Keep page code shared and split only the UI/runtime adapter boundary.

## Runtime Split

- Apps in Toss build: `@toss/tds-mobile-ait` provides `TDSMobileAITProvider`.
- Public web build: the adapter resolves to a local no-op provider and must not import `@toss/tds-mobile` or `@toss/tds-mobile-ait`.
- Shared page code keeps using local `Ait*` components and `--ait-*` CSS tokens.
- `client/vite.config.ts` selects the adapter with `APP_RUNTIME`; `mode=public` always selects the public adapter.

## Local Components

Local TDS-compatible components live under `client/src/shared/ui/ait`.

- `AitTop`: local equivalent for a compact TDS `Top` area.
- `AitListRow`: local equivalent for TDS `ListRow` with `left` asset and two-line contents.
- `AitButton`: local equivalent for a primary TDS-style button.
- `AitNavigation`: local web navigation; Apps in Toss runtime can rely on native navigation behavior.

These components intentionally provide only the patterns Aniwhere currently uses. Add new props only when a real screen needs them.

## Styling Rules

- Put reusable values in `client/src/styles/tokens.css`.
- Use `--ait-*` tokens for colors, spacing, typography, radii, shadows, and component sizes.
- Keep screen-specific CSS thin; prefer `.ait-*` classes for reusable component behavior.
- Do not add raw colors, radii, or spacing to feature CSS unless the value is asset-specific or genuinely one-off.

## Server 관리자 배포 Guide

`aniwhere.link`에 배포할 때는 반드시 public build를 사용합니다.

```bash
cd client
npm ci
npm run build:static:verify
```

Deploy target:

```text
client/dist-static
```

주의사항:

- `aniwhere.link`에는 `client/dist` 또는 `.ait` artifact를 배포하지 않습니다.
- `aniwhere.link` 배포 환경변수는 `APP_RUNTIME=public`이어야 합니다.
- public build 결과물 안에 `@toss/tds-mobile` 관련 문자열이 들어가면 배포를 중단합니다.
- 배포 후 브라우저에서 흰 화면이 아닌지 `/home`, `/explore`, `/intro` 진입을 확인합니다.

검증은 위 `build:static:verify`에 포함되어 있습니다. 내부적으로 `build:static`과 `audit:public-bundle`을 순서대로 실행합니다.

```bash
npm run build:static:verify
```

이 스크립트는 `dist-static/assets/*.js`에서 아래 문자열이 발견되면 실패합니다.

```text
@toss/tds-mobile
@toss/tds-mobile-ait
TDSMobileAITProvider
```

## Build Matrix

| Target | Command | Output | TDS runtime |
| --- | --- | --- | --- |
| Apps in Toss | `npm run build` | `client/dist` / `.ait` flow | Real TDS adapter |
| Public web | `npm run build:static` | `client/dist-static` | Local fallback adapter |
| Public web verified | `npm run build:static:verify` | `client/dist-static` | Local fallback plus audit |

## Review Checklist

Before merging UI work that touches this layer:

- Page code is shared; no duplicated Apps in Toss/public web screens were created.
- The public adapter imports no `@toss/tds-mobile` package.
- The Apps in Toss adapter imports TDS only inside the runtime adapter boundary.
- The screen still works on `aniwhere.link` without TDS runtime code in the bundle.
- The layout follows the latest official TDS component structure as closely as local implementation allows.
- The 375px mobile viewport is usable with no horizontal scroll or text overlap.
- `npm run lint`, `npm run build`, and `npm run build:static:verify` pass where relevant.
- The launch checklist records anything that still needs Apps in Toss sandbox or console verification.

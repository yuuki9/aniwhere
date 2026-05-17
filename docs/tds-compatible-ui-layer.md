# TDS Runtime And Public Split Guard

Aniwhere는 Apps in Toss WebView, ads, local 테스트를 출시 기준으로 UI를 개발합니다. 공식 TDS 컴포넌트가 있는 영역은 먼저 프로젝트 TDS facade를 통해 실제 `@toss/tds-mobile` 사용감과 API를 맞춥니다.

도메인 public 배포(`aniwhere.link`)는 `main` 머지 후 자동으로 반영되는 배포 표면이지만, 현재 제품 판단은 Apps in Toss 출시 우선입니다. 웹 도메인용 별도 CSS/product surface 확장은 출시 이후 니즈를 확인한 뒤 별도 PR 범위로 다룹니다. page code는 `@toss/tds-mobile`을 직접 import하지 않고, Vite alias로 분기되는 `@aniwhere/tds-mobile` facade를 사용합니다.

## Current Priority

- Apps in Toss/ads/local 출시 기준 개발에서는 프로젝트 TDS facade를 통해 공식 `@toss/tds-mobile` 컴포넌트를 먼저 사용한다.
- 기존 `client/src/shared/ui/ait`와 `--ait-*` token은 제거 대상의 migration debt로 취급한다.
- 공식 TDS 컴포넌트가 없어서 임시 local UI가 필요한 경우에도 `Ait*` 계층을 확장하지 않고, 후속 TDS 대체 범위와 제거 계획을 PR에 남긴다.
- page code는 `@toss/tds-mobile`을 직접 import하지 않는다.
- public build에서는 같은 facade가 local fallback으로 resolve되고, public bundle에 TDS runtime marker가 남지 않게 한다.

## Route Audit Requirement

Route-level TDS work must follow `docs/tds-route-audit.md` before editing. The agent must classify the route, discover the relevant official TDS Mobile docs with the Apps in Toss MCP, record the docs checked, and classify each visible delta as `TDS-required`, `Product-approved`, or `Regression`.

Do not wait for the user to provide component or foundation links. If the route touches buttons, typography, lists, top/title areas, bottom CTAs, bottom sheets, search fields, toasts, dialogs, or a similar primitive, search the official docs first and use those docs as the review basis.

## Facade Defense For Launch Review

`@aniwhere/tds-mobile` is an adapter boundary, not a replacement design system.

- Page code imports `@aniwhere/tds-mobile`; it does not import `@toss/tds-mobile` or `@toss/tds-mobile-ait` directly.
- Apps in Toss, ads, and local launch builds must resolve the facade to official `@toss/tds-mobile` components.
- Public/domain builds resolve the same facade to a local fallback only to prevent Toss-only runtime code from leaking into `aniwhere.link`.
- A route-specific app-owned UI is allowed only when an official TDS component is unavailable or its DOM/padding/typography would create a visible regression against a product-approved main/public screen.
- When app-owned UI is used, classify the visible delta as `TDS-required`, `Product-approved`, or `Regression`, and record a follow-up/removal plan in the PR.

## Local Components

Local TDS-compatible components live under `client/src/shared/ui/ait`. These are legacy fallback/building-block components and should shrink until removed. They are not a reason to avoid official TDS in WebView/ads/local work.

- `AitTop`: local equivalent for a compact TDS `Top` area.
- `AitListRow`: local equivalent for TDS `ListRow` with `left` asset and two-line contents.
- `AitButton`: local equivalent for a primary TDS-style button.
- `AitNavigation`: local web navigation; Apps in Toss runtime can rely on native navigation behavior.

Do not add new props or new `Ait*` components. Replace existing usage with official TDS facade components or route-specific app-owned UI that has an explicit removal/follow-up plan.

## Ait Usage Freeze

Existing `Ait*` imports are treated as migration debt. New route/page code must not add `Ait*` imports.

- Use `@aniwhere/tds-mobile` first when an official TDS component exists.
- Use Apps in Toss native/common navigation as the launch target; any app-owned navigation must be justified as a temporary gap.
- Do not update `client/scripts/assert-ait-usage-allowlist.mjs` to allow more route/page files. Reducing the allowlist is the only normal direction.
- Route migration should remove the allowlist over time, starting with `/intro`.

## Styling Rules

- Put reusable values in `client/src/styles/tokens.css`.
- Use `--ait-*` tokens for colors, spacing, typography, radii, shadows, and component sizes.
- Keep screen-specific CSS thin; prefer `.ait-*` classes for reusable component behavior.
- Do not add raw colors, radii, or spacing to feature CSS unless the value is asset-specific or genuinely one-off.

## Status Feedback Rules

- Use inline field errors only for validation that belongs to that exact field.
- Do not render save/server/infrastructure errors under the final form field; users can misread them as field-specific errors.
- For non-field status feedback in Apps in Toss/ads/local work, use official `@toss/tds-mobile` Toast through `@aniwhere/tds-mobile` when it is available.
- Keep toast copy short, temporary, and action-oriented. Prefer `~했어요`, `~해주세요`; do not expose backend/storage internals in user notices.
- If a future public/domain split cannot use official Toast at runtime, the fallback should preserve the same message, duration, placement, and accessibility intent.
- Native browser `alert()` and `confirm()` remain disallowed for launch-facing flows.

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
- page code가 `@toss/tds-mobile`을 직접 import하면 public bundle 검증이 실패해야 합니다.
- 배포 후 브라우저에서 흰 화면이 아닌지 `/home`, `/explore`, `/intro` 진입을 확인합니다.

`main`은 도메인 public 배포로 바로 이어지므로, 모든 client UI PR은 아래 검증을 통과해야 합니다.

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
| Apps in Toss / ads / local | `npm run build` | `client/dist` / `.ait` flow | Real `@toss/tds-mobile` through facade |
| Public web | `npm run build:static` | `client/dist-static` | Facade resolves to local fallback |
| Public web verified | `npm run build:static:verify` | `client/dist-static` | Fallback plus audit |

## Review Checklist

Before merging UI work that touches this layer:

- Apps in Toss/ads/local screens use official `@toss/tds-mobile` components through the project facade first when available.
- Page code imports project TDS facade modules, not `@toss/tds-mobile` directly.
- No new `Ait*` imports are added.
- Existing `Ait*` usage is reduced when the touched route has an official TDS replacement path.
- The public path imports no `@toss/tds-mobile` package and `build:static:verify` passes.
- The layout follows the latest official TDS component structure as closely as the current target allows.
- The 375px mobile viewport is usable with no horizontal scroll or text overlap.
- `npm run lint`, `npm run build`, and `npm run build:static:verify` pass for client UI work.
- The launch checklist records anything that still needs Apps in Toss sandbox or console verification.

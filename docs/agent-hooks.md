# Aniwhere Agent Hooks

This document is the natural-language trigger layer for Aniwhere Codex sessions. The user does not need to name a skill. When a request matches a trigger below, Codex should load the matching skill/docs before implementing.

## Layer Split

- `guard.md`: durable product, platform, and launch constraints.
- `docs/agent-hooks.md`: natural-language triggers and required preflight behavior.
- `.codex/skills/**/SKILL.md`: procedural execution guides for a specific work type.
- `docs/tds-route-audit.md`: route-level evidence log for UI/TDS changes.
- `GIT_CONVENTIONS.md`: branch, commit, PR, and handoff rules.

## Platform Source Priority

1. Apps in Toss WebView and non-game miniapp docs: https://developers-apps-in-toss.toss.im/
2. TDS Mobile UI docs: https://tossmini-docs.toss.im/tds-mobile
3. Aniwhere project docs and product decisions.
4. Backend Swagger: https://api.aniwhere.link/swagger-ui/index.html and OpenAPI JSON `https://api.aniwhere.link/v3/api-docs`.

`tds-react-native` and Unity docs are not Aniwhere's default compliance targets. Use them only when the task explicitly targets React Native or Unity, or when comparing platform differences. For WebView work, classify them as `Non-target reference` and do not implement their platform-specific rules as requirements.

## Natural-Language Trigger Matrix

| User wording or task shape | Hook action | Required docs/skills |
| --- | --- | --- |
| UI, UX, 화면, 레이아웃, 버튼, 필터, 폼, sheet, modal, toast, route, `/intro`, `/home`, `/admin/**`, "TDS 맞춰줘" | Treat as UI/TDS work. Search TDS Mobile docs first, classify the route, then edit. | `aniwhere-product-ux`, `aniwhere-toss-webview`, `docs/tds-route-audit.md`, TDS Mobile docs |
| 앱인토스, sandbox, WebView, Toss login, 권한, navigationBar, 광고, promotion, reward, requestReview, 공유, 출시 | Treat as Apps in Toss runtime/launch work. Check official developer docs before assumptions. | `aniwhere-toss-webview`, `aniwhere-launch-checklist`, Apps in Toss developer docs |
| RN, React Native, Unity, runtime-structure from non-WebView docs | First decide whether the document applies to Aniwhere WebView. Default is non-applicable unless the task targets that platform. | `guard.md`, `docs/agent-hooks.md`, relevant official docs |
| Swagger, API 명세, server contract, CORS, request/response shape, removed field | Treat as API contract work. Compare frontend calls against Swagger/OpenAPI before editing. | `backend-api-contract-audit`, `docs/backend-api-contract.md`, Swagger/OpenAPI |
| 버그, 흰화면, failed to fetch, console, sandbox failure, test/build fail, regression | Reproduce and diagnose before changing code. | `aniwhere-debug-loop`, relevant domain skill |
| 작업 분리, 브랜치, PR 범위, 후속 작업, "무엇부터" | Plan branch/PR scope before implementation. | `aniwhere-work-planning`, `GIT_CONVENTIONS.md` |
| PR, merge, 리뷰, CodeRabbit, description, "PR step" | Run PR preflight and provide PR URL/title/body handoff if direct creation fails. | `aniwhere-pr-preflight`, `GIT_CONVENTIONS.md`, `.github/PULL_REQUEST_TEMPLATE.md` |
| skill, hook, guard, 세션 유지, 자연어 trigger | Treat as workflow maintenance. Keep rules durable and repo-tracked. | `aniwhere-skill-workflow`, `docs/agent-hooks.md`, `docs/agent-skills.md` |

## UI/TDS Hook Contract

Before editing UI or CSS:

1. Identify the touched route or surface.
2. Search official TDS Mobile docs for the touched primitives.
3. Record the docs checked in `docs/tds-route-audit.md` when the change is route-level.
4. Classify visible deltas as `TDS-required`, `Product-approved`, or `Regression`.
5. Use `@aniwhere/tds-mobile` facade for page code when an official TDS component fits.
6. If Apps in Toss runtime behavior cannot be proven locally, mark it `Needs sandbox`.

## Apps In Toss Hook Contract

Before changing SDK/runtime behavior:

1. Check the official Apps in Toss developer docs for the current feature.
2. Confirm the feature is relevant to Aniwhere's WebView non-game app shape.
3. Separate console values and sandbox evidence from code inspection.
4. Mark unresolved console/mobile-device needs as `Needs console value` or `Needs sandbox`.

## Hook Maintenance

- Add or change hooks only when a repeated miss happened or a durable workflow decision was made.
- Keep hooks short enough to read every session.
- Move long evidence, examples, and route-specific decisions into dedicated docs or skill references.
- When adding a hook, update skill descriptions if natural-language discovery would otherwise miss it.

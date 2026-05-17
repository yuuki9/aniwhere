# Aniwhere Session Operating Guard

Use this guard in every Aniwhere session after the required project documents. It is a common layer for TDS/Apps in Toss alignment, critical pushback, encoding safety, PR boundaries, PR descriptions, and review follow-up.

## TDS And Apps In Toss Baseline

- Treat Aniwhere as an Apps in Toss non-game WebView service before treating it as a generic React app.
- Treat the Apps in Toss sandbox as the deciding environment for SDK-dependent behavior. Local browser, static build, and public web checks are useful feedback loops, but they cannot prove ads, Toss login, promotion rewards, navigation bar behavior, permissions, review requests, or share APIs.
- For ads work, default to the Apps in Toss ADS sandbox path. Do not mark ad integration as passed from mocks, desktop browser behavior, or code inspection alone.
- Treat `@aniwhere/tds-mobile` as the required page-code facade for TDS imports. Page code must not import `@toss/tds-mobile` or `@toss/tds-mobile-ait` directly.
- The facade is not a TDS avoidance layer: Apps in Toss/ads/local builds must resolve it to official `@toss/tds-mobile`; public/domain builds may resolve it to local fallback only to prevent Toss-only runtime leakage.
- If official TDS component structure creates a visible regression against a product-approved 375px main/public screen, route-specific app-owned UI plus `--ait-*` token compatibility is allowed only with a `TDS-required`, `Product-approved`, or `Regression` classification and follow-up/removal plan.
- Route-level TDS work must follow `docs/tds-route-audit.md` before editing. The agent must classify the route, search official TDS Mobile docs with the Apps in Toss MCP, record the docs checked, and only then classify deltas as `TDS-required`, `Product-approved`, or `Regression`.
- Do not wait for the user to supply official TDS links. Discover route-appropriate docs first for buttons, typography, lists, top/title areas, bottom CTAs, bottom sheets, search fields, toasts, dialogs, and other touched primitives.
- For UI, routing, navigation, permission, modal/notice, storage/draft, map, share, external-link, CSS, or TDS-adjacent work, read the relevant local docs first:
  - `docs/tds-route-audit.md`
  - `docs/tds-compatible-ui-layer.md`
  - `docs/design-tokens.md`
  - `docs/ux-mobile-research.md`
  - `docs/apps-in-toss-navigation-audit.md` when navigation or guide URLs are touched.
- Use official Apps in Toss/TDS docs when behavior, launch policy, packages, or runtime support may have changed.
- If local docs and memory disagree, repository docs win. If official docs and local docs disagree, stop and surface the conflict before editing.

## Notice Protocol

Use a visible `Notice:` before proceeding when a request would likely violate TDS, Apps in Toss launch rules, product decisions, or established Aniwhere UX.

The notice must include:

- The exact rule or document that creates the concern.
- The practical rejection, review, or UX risk.
- A safer alternative that still tries to satisfy the user goal.

Do not silently implement a request that is clearly outside the guide. Be constructively critical even when the user wording is confident.

## UTF-8 And Korean Text Safety

- Assume PowerShell output may show Korean text as mojibake even when files are valid UTF-8.
- Do not rewrite Korean-heavy docs just to inspect them.
- Prefer `apply_patch` for edits and keep patches narrowly scoped.
- Do not use shell redirection, `cat > file`, or ad hoc encoding conversions for tracked docs.
- If a diff shows existing Korean text turning into replacement characters or mojibake unrelated to the intended edit, stop and report the encoding risk.

## PR Boundary Notice

Use a `Notice:` when the current change is becoming a separate PR concern. Good split signals:

- UI/TDS cleanup mixed with backend/API behavior.
- Launch checklist fixes mixed with feature implementation.
- Refactor mixed with product behavior changes.
- More than one route/surface changing without a shared user story.
- A CodeRabbit or launch finding requires broad follow-up beyond the current task.
- Ads/TDS/SDK adapter work starts changing unrelated product UI to make screenshots pass.

Phrase it as a recommendation, not a hard stop: identify the current PR unit, propose the follow-up PR scope, and keep working only on the agreed slice.

## Engineering Feedback Loops

Use small, observable loops before broad edits. This adapts external engineering-skill patterns to Aniwhere's launch workflow.

- For bugs or visual regressions: reproduce first, capture the exact symptom, make 3-5 falsifiable hypotheses, then change one variable at a time.
- Prefer behavior-level checks: route rendering, user-visible DOM, mobile screenshot, SDK event sequence, build artifact, or sandbox event log.
- For UI/TDS changes, compare against the current main behavior and the relevant TDS/local token docs before inventing new CSS values.
- For feature work, move in vertical slices: one user-visible behavior, one focused check, minimal implementation, then the next slice.
- If no local test can prove the behavior because it depends on Apps in Toss runtime, mark it `Needs sandbox` and keep the local checks as supporting evidence only.

## PR Description And Handoff

When creating, updating, or handing off a PR:

- Read `.github/PULL_REQUEST_TEMPLATE.md`.
- Provide a Korean PR title and body.
- If GitHub connector or `gh` authentication prevents direct PR creation, do not hand off only a PR URL or repeat the auth/403 blocker as the main answer. Briefly note the blocker, then provide the PR creation URL plus the exact Korean PR title and template-shaped PR body the user can paste in the GitHub web UI.
- Write the handoff PR body in a copy/paste-friendly form. Unless the user explicitly asks for a code block, do not wrap the whole description in fenced code blocks, and avoid unnecessary triple backticks inside the description.
- Include changed scope, verification commands and results, Apps in Toss/TDS classification, sandbox or console gaps, and follow-up PR scope.
- Never leave the Apps in Toss/TDS section blank when client UI, WebView, navigation, permissions, external links, modals/notices, storage/draft, maps, SDK loader, or CSS changed.
- Keep PR descriptions factual; do not claim sandbox, mobile-device, or CodeRabbit resolution unless verified.

## CodeRabbit And Review Feedback

When a PR already exists or the user asks to update a PR:

- Read unresolved CodeRabbitAI and human review comments before changing code when GitHub access is available.
- Classify comments as `Required`, `Recommended`, `False positive`, `Needs sandbox`, or `Follow-up PR`.
- Implement technically correct actionable comments in the current PR scope.
- Push back with evidence when a comment conflicts with Apps in Toss/TDS guidance or Aniwhere product decisions.

## Memory Use

If agentmemory is available, search it for prior Aniwhere TDS, launch, CodeRabbit, PR split, and product-decision context before making broad UI or PR-scope decisions. Treat memory as advisory; repository and official docs remain authoritative.

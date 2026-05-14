# Aniwhere Session Operating Guard

Use this guard in every Aniwhere session after the required project documents. It is a common layer for TDS/Apps in Toss alignment, critical pushback, encoding safety, PR boundaries, PR descriptions, and review follow-up.

## TDS And Apps In Toss Baseline

- Treat Aniwhere as an Apps in Toss non-game WebView service before treating it as a generic React app.
- For UI, routing, navigation, permission, modal/notice, storage/draft, map, share, external-link, CSS, or TDS-adjacent work, read the relevant local docs first:
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

Phrase it as a recommendation, not a hard stop: identify the current PR unit, propose the follow-up PR scope, and keep working only on the agreed slice.

## PR Description And Handoff

When creating, updating, or handing off a PR:

- Read `.github/PULL_REQUEST_TEMPLATE.md`.
- Provide a Korean PR title and body.
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

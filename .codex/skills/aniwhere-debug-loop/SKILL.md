---
name: aniwhere-debug-loop
description: Use when Aniwhere has bugs, failing tests or builds, WebView sandbox issues, login/permission/ad/reward failures, API/image/map regressions, or performance problems.
---

# Aniwhere Debug Loop

Use this for bugs and regressions. It adapts the disciplined diagnosis loop from `mattpocock/skills` (`diagnose`) to Aniwhere's Apps in Toss WebView and PR-boundary rules.

## Start

1. Read `GIT_CONVENTIONS.md`, `guard.md`, `README.md`, `docs/product-decisions.md`, `docs/agent-hooks.md`, and `docs/agent-skills.md`.
2. Run `git status --short --branch` before changing files.
3. If agentmemory is available, recall prior failures for the touched area, such as Toss login, permissions, WebView navigation, CodeRabbit findings, image upload, map loading, or API contract mismatches.
4. Load `aniwhere-toss-webview` for SDK/WebView behavior, `backend-api-contract-audit` for API contract mismatches, and `aniwhere-product-ux` for user-facing flow regressions.

## Phase 1: Feedback Loop

Establish the fastest reliable reproduction before fixing.

- Capture the command, route, device/browser, account state, env vars, or sandbox context.
- Record observed behavior and expected behavior.
- For SDK-only behavior, ask for or produce sandbox/mobile evidence when local desktop cannot prove it.
- If no reproduction is available, gather logs, screenshots, HAR files, console output, or temporary instrumentation before editing.

## Phase 2: Minimize

Narrow the failure to the smallest route, component, API call, server handler, config value, or test.

- Inspect nearby code and recent commits.
- Prefer structured parsers or existing API clients over ad hoc string guesses.
- Keep temporary logging reversible and scoped.

## Phase 3: Hypothesize

Work one evidence-backed hypothesis at a time.

- State the hypothesis.
- Identify the check that would falsify it.
- Run the check before broad refactors.
- If the cause is hidden coupling or architecture debt, stop and hand off to `aniwhere-work-planning` for a scoped follow-up instead of expanding the fix silently.

## Phase 4: Fix

Make the smallest change that resolves the reproduced failure.

- Preserve Apps in Toss, TDS, product, and PR-boundary rules.
- Avoid mixing unrelated cleanup with the bug fix.
- Add or update regression coverage when the risk justifies it.
- Do not mark sandbox-only behavior fixed from code inspection alone.

## Phase 5: Prove

Verify with the same feedback loop that reproduced the bug.

- Run relevant tests, type checks, lint, or build commands.
- For client changes, verify narrow mobile behavior when feasible.
- Classify remaining gaps as `Needs sandbox`, `Needs console value`, `Needs mobile device`, or `Follow-up PR`.
- Save durable debugging facts to agentmemory when they will help future sessions.

## Report Shape

Return:

- Reproduction used.
- Root cause.
- Files changed.
- Verification commands and key results.
- Remaining sandbox, console, or mobile gaps.
- Follow-up PR scope if the fix uncovered broader work.

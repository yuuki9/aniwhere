---
name: aniwhere-work-planning
description: Use when planning Aniwhere work, deciding branch or PR boundaries, stress-testing feature scope against repository decisions, preparing issues/tasks, deciding whether to prototype, or preserving useful context in agentmemory.
---

# Aniwhere Work Planning

Use this before broad implementation work. It adapts useful planning patterns from `mattpocock/skills` (`grill-with-docs`, `to-issues`, and `prototype`) to Aniwhere's Apps in Toss constraints.

## Start

1. Read `GIT_CONVENTIONS.md`, `guard.md`, `README.md`, `docs/product-decisions.md`, `docs/agent-hooks.md`, and `docs/agent-skills.md`.
2. Run `git status --short --branch` and inspect recent commits before choosing a branch.
3. If agentmemory is available, recall prior Aniwhere decisions for the touched area. Treat memory as advisory; repository docs and official Apps in Toss docs remain authoritative.
4. Load `aniwhere-product-ux`, `aniwhere-toss-webview`, or `aniwhere-launch-checklist` when the planned work touches their scope.

## Planning Loop

1. Classify the work: client UI/WebView, API contract, server behavior, admin/reward policy, launch/TDS review, docs, or skill maintenance.
2. Check the durable decision source:
   - Product scope: `docs/product-decisions.md`
   - UX/TDS/mobile behavior: `guard.md`, `docs/ux-mobile-research.md`, `docs/design-tokens.md`, `docs/tds-compatible-ui-layer.md`
   - Natural-language routing: `docs/agent-hooks.md`
   - PR boundaries and review handling: `GIT_CONVENTIONS.md`, `guard.md`, `docs/agent-skills.md`, and task-specific Codex hooks
   - Git rules: `GIT_CONVENTIONS.md`
3. Ask only blocking questions. If the answer can be found in code or docs, inspect those instead.
4. Do not update durable docs for every answer. Update them only when the answer becomes a lasting product, architecture, launch, or workflow decision.

## Branch Boundary

- Prefer a fresh branch from `origin/main` for new work after confirming the current worktree is clean.
- Use repo branch families: `feature/*`, `fix/*`, or `chore/*`.
- If the current branch is merged, gone, or about a different PR scope, create a new branch instead of piling on.
- If the worktree has user changes, do not switch branches until their scope is understood.
- Split work when UI/TDS cleanup, backend/API behavior, launch findings, refactors, and product changes can stand as separate review units.

## Slicing Work

Each task or issue should include:

- User-visible or reviewer-visible outcome.
- Primary files or modules likely to change.
- Validation command or evidence needed.
- Apps in Toss/TDS classification when client behavior is involved.
- Whether sandbox, console values, or mobile device verification is required.

Prefer vertical slices that can be reviewed independently. Avoid broad "cleanup" tasks unless the exact failure mode is already known.

## Prototype Rule

Prototype only to answer a specific design, state-model, API-shape, or UX-flow question. Mark prototype code as throwaway, keep it out of shipping paths, and either remove it or convert only the proven decision into production code.

## Memory Rule

Use agentmemory for continuity, not authority.

- Recall before planning when prior PR splits, CodeRabbit decisions, launch risks, TDS choices, or product decisions may matter.
- Save only durable insights: branch policy, repeated workflow decisions, settled product/UX choices, or hard-won debugging facts.
- Include relevant file paths in saved memories.
- Do not save secrets, console credentials, OAuth values, ad IDs, promotion codes, or temporary guesses.

## Output Shape

When handing off a plan, include:

- Recommended branch and why.
- Scope and explicit out-of-scope items.
- Relevant docs checked.
- Task slices with validation.
- Open questions, if any.
- Memory to recall or save, if relevant.

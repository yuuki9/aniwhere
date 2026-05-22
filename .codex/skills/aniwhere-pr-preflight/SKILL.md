---
name: aniwhere-pr-preflight
description: Use before opening, updating, or handing off an Aniwhere pull request, especially after frontend, WebView, map, CSS, navigation, sharing, or SDK-loader changes, to reduce repeated CodeRabbit potential issues and prepare a clean Korean PR summary.
---

# Aniwhere PR Preflight

Use this skill after implementation and before PR creation or PR update. It is not a replacement for CodeRabbit; it catches repeated Aniwhere review patterns before the branch is pushed.

## Workflow

1. Read the required project documents in `AGENTS.md`.
2. Fetch the latest base branch with `git fetch origin --prune`.
3. Inspect branch scope with `git status --short --branch`, `git diff --stat origin/main...HEAD`, and `git diff --name-only origin/main...HEAD`.
4. Confirm the PR represents one reviewable concern with a clear task boundary.
5. If the diff touches `client/` UI, routing, WebView, navigation, maps, permissions, external links, modals/notices, storage/draft state, or CSS, run a PR-level Apps in Toss/TDS risk pass before writing the PR body:

   - Re-read `guard.md`, `docs/design-tokens.md`, `docs/tds-compatible-ui-layer.md`, and `docs/ux-mobile-research.md`.
   - Use `aniwhere-launch-checklist` for the touched scope, not necessarily the whole product.
   - Classify each concern as `Required`, `Recommended`, `Needs sandbox`, `Needs console value`, or `Follow-up PR`.
   - Separate official Apps in Toss/TDS requirements from local TDS-compatible UI decisions and general product UX decisions.
   - Do not call an app-owned fallback an official TDS component unless the official docs or approved runtime package are actually used.

6. Run the preflight script:

```powershell
python .codex\skills\aniwhere-pr-preflight\scripts\pr_preflight.py --base origin/main
```

7. Run the repo checks that match the changed area. For `client/`, run:

```powershell
cd client
npm.cmd run lint
npm.cmd run build
npm.cmd run build:static
```

8. Fix all preflight findings that are technically correct. If a finding is intentionally accepted, mention the reason in the PR body.
9. Prepare the PR title and description in Korean using `.github/PULL_REQUEST_TEMPLATE.md`.
10. Fill the `Apps in Toss / TDS 출시 리스크` section explicitly. Do not leave it blank for client UI/WebView PRs.
11. PR creation handoff hook:

   - Treat the server maintainer as the final merge authority; Codex should push and hand off a reviewable PR, not imply it owns the merge.
   - If direct PR creation succeeds, return the PR URL, title, and a concise summary of the submitted body.
   - If GitHub connector or `gh` authentication prevents direct PR creation, return the PR creation URL plus the exact title and full `.github/PULL_REQUEST_TEMPLATE.md`-shaped description in a copy/paste-friendly form.
   - Do not stop with only an auth/403 explanation or only a PR creation URL.

## Review Patterns To Preempt

- CSS keyword casing and focus-visible rules for new interactive controls.
- `href="#"` or hash fallback links in React actions.
- `navigator.share()` and `navigator.clipboard.writeText()` without rejection handling.
- SDK loaders whose promises can stay pending if callbacks never fire.
- Naver map marker icon DOM size not matching the SDK icon size and anchor.
- External navigation behavior that conflicts with Apps in Toss WebView expectations.
- Duplicate native/App-owned navigation bars in Apps in Toss runtime.
- Server/save errors rendered under the final form field instead of a field-independent status pattern.
- Draft/session persistence added without success-clear and explicit follow-up rules.
- App-owned local UI described as an official TDS component without evidence.

## PR Body Guidance

- Keep the description factual: summary, changed scope, verification, screenshots/logs when useful, and merge-after notes.
- Keep the PR scope tied to task boundaries, not numeric thresholds.
- Include CodeRabbit-relevant verification such as lint/build results and any intentionally accepted risk.
- For client UI/WebView changes, include the PR-level Apps in Toss/TDS classification and any follow-up audit branch/PR.

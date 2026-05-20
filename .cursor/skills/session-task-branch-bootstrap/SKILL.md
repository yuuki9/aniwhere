---
name: session-task-branch-bootstrap
description: Use when starting a new coding session or task and a branch should be created automatically from the work name in this repository.
---

# Session Task Branch Bootstrap

## Goal

At session start, ask for a task name, convert it to a valid branch name, and create/switch to that branch using Aniwhere git conventions.

## Required Rules

- Follow `GIT_CONVENTIONS.md` branch prefixes: `feature/*`, `fix/*`, `chore/*`, `docs/*`.
- Do not use tool-name prefixes such as `codex/*`.
- If the working tree is dirty, do not switch branches until the user confirms how to proceed.

## Workflow

1. Ask for the work name if it is not already provided.
2. Inspect current git state:
   - `git status --short --branch`
3. Pick branch type:
   - Contains `fix`, `bug`, `hotfix`, `오류`, `버그` -> `fix/`
   - Contains `docs`, `문서`, `readme` -> `docs/`
   - Contains `chore`, `설정`, `리팩터링`, `정리`, `mcp` -> `chore/`
   - Otherwise default to `feature/`
4. Create slug from work name:
   - Lowercase
   - Replace spaces and `_` with `-`
   - Keep only `a-z`, `0-9`, `-`
   - Collapse repeated `-`
   - Trim leading/trailing `-`
   - If slug becomes empty, ask the user for an English slug
5. Build final branch name as `<prefix><slug>`.
6. If local changes exist, ask whether to stash/commit first.
7. Create or switch branch:
   - If branch exists locally: `git checkout <branch>`
   - Else: `git checkout -b <branch>`
8. Report result with:
   - task name
   - selected branch type
   - final branch name
   - current branch from `git status --short --branch`

## Response Template

- 작업명: `<work-name>`
- 브랜치 타입: `<feature|fix|chore|docs>`
- 생성/전환 브랜치: `<branch-name>`
- 상태: `git status --short --branch` 확인 완료

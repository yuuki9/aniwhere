# Aniwhere Agent Guide

이 저장소에서 작업을 시작하는 모든 Codex 세션은 아래 순서로 문서를 읽고 기준을 맞춥니다.

## Required Read Order

1. `GIT_CONVENTIONS.md`
2. `guard.md`
3. `README.md`
4. `docs/product-decisions.md`
5. `docs/agent-hooks.md`
6. `docs/agent-skills.md`
7. `docs/tds-route-audit.md` when client UI/TDS work is in scope

## Mandatory Rules

- Client UI/TDS work must follow `docs/tds-route-audit.md`: classify the route, search official TDS Mobile docs with the Apps in Toss MCP, record checked docs, and classify visible deltas as `TDS-required`, `Product-approved`, or `Regression` before editing.
- Natural-language requests must be routed through `docs/agent-hooks.md`. The user does not need to name a skill; Codex must infer the work type and load the matching docs/skills.

- 브랜치, 커밋, 태그 규칙은 항상 `GIT_CONVENTIONS.md`를 기준으로 따릅니다.
- 작업 전 현재 브랜치와 최근 변경사항을 확인합니다.
- **저장소 루트에 `.cursorrules` 파일이 있으면** 내용을 확인하고 그 지침을 따릅니다. **파일이 없으면 이 항목은 적용하지 않습니다.** (Cursor 등 로컬 도구 전용으로 두는 경우가 많으며, 공유하지 않을 때는 `.gitignore`에 포함해도 됩니다.)
- 프론트엔드 작업은 Apps in Toss WebView 서비스 프로젝트라는 전제를 유지합니다.
- 새로운 자동화, 일일 점검, 리팩터링 루프를 제안하거나 수정할 때도 `GIT_CONVENTIONS.md`를 먼저 읽은 뒤 반영합니다.
- 이미 확정된 제품 정책은 `docs/product-decisions.md`를 기준으로 따르며, 뒤집어야 할 때는 먼저 문서를 갱신합니다.

## Repo Context

- `client/`: Apps in Toss WebView 기반 프론트엔드
- `server/`: 백엔드 및 데이터 수집 영역
- `docs/`: 기획 및 운영 문서

## Project Skills

- 프로젝트 전용 Codex 스킬은 `.codex/skills/`에 둡니다.
- 스킬 사용/설치 방법은 `docs/agent-skills.md`를 기준으로 확인합니다.
- Apps in Toss WebView, 제품 UX, 스킬 제작 워크플로우는 가능한 경우 프로젝트 전용 스킬을 우선 참고합니다.
- 모든 세션은 `GIT_CONVENTIONS.md`, `guard.md`, `docs/agent-hooks.md`, `docs/agent-skills.md`, 관련 Codex skill hook을 기준으로 TDS/Apps in Toss 이탈, UTF-8 위험, PR 경계, PR 설명, CodeRabbit 리뷰 확인 필요성을 판단합니다.

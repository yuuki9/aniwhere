# Aniwhere Agent Guide

이 저장소에서 작업을 시작하는 모든 Codex 세션은 아래 순서로 문서를 읽고 기준을 맞춥니다.

## Required Read Order

1. `GIT_CONVENTIONS.md`
2. `guard.md`
3. `README.md`
4. `docs/product-decisions.md`

## Mandatory Rules

- 브랜치, 커밋, 태그 규칙은 항상 `GIT_CONVENTIONS.md`를 기준으로 따릅니다.
- 작업 전 현재 브랜치와 최근 변경사항을 확인합니다.
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

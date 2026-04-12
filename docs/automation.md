# Automation Guide

이 문서는 Aniwhere 프로젝트에서 반복 실행되는 점검, 리팩터링, 기록 자동화의 기준을 정리합니다.

## First Step

모든 자동화 또는 자동화용 프롬프트는 시작 전에 반드시 아래 문서를 읽고 기준을 맞춥니다.

1. `GIT_CONVENTIONS.md`
2. `guard.md`
3. `README.md`

## Automation Baseline

- 브랜치 전략, 커밋 형식, 태그 정책은 `GIT_CONVENTIONS.md`를 그대로 따릅니다.
- 자동화가 변경사항을 제안할 때는 현재 브랜치와 대상 브랜치를 먼저 확인합니다.
- 프론트엔드 자동화는 Apps in Toss 스타일, 서비스 UX, 접근성, 구조 최적화 기준을 함께 봅니다.
- 백엔드 변경과 프론트 영향도를 연결해서 기록합니다.

## Daily Frontend Automation Expectations

- 최신 백엔드 변경사항과 프론트 구조의 매칭 여부 확인
- Toss 디자인 기준과 서비스 UX 기준에서 개선 포인트 점검
- 성능, 구조, 접근성, 리팩터링 후보 도출
- 결과를 날짜별 Markdown으로 기록
- 이력서 bullet 또는 개발일지로 재사용 가능한 요약 생성

## Output Preference

- 기록은 `docs/` 하위 Markdown으로 남깁니다.
- 커밋이 필요한 경우 `type(scope): description` 형식을 지킵니다.
- 의미 없는 cosmetic 변경보다 서비스 명확성, 신뢰도, 탐색 효율을 높이는 변경을 우선합니다.


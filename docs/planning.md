# 프로젝트 기획 및 클라이언트 스택 초안

## 1. 서비스 개요

- 목적: 갸챠샵/피규어샵 위치정보 및 정보 공유
- 1차 방향: 전국 단위 포괄 지도보다 핫플레이스 중심의 지역별 탐색
- 핵심 구조: 지역 -> 카테고리 -> 매장 탐색
- 핵심 정보: 위치, 영업상태, 영업시간, 특징, 최근 확인일, 제보
- 확장 방향: 유저/가게 사장 제보를 통한 신규 등록 및 정보 수정

## 2. 참고 레퍼런스

### 서비스/콘텐츠 참고

- Popply: https://www.popply.co.kr/
- 헤이맵(GDWEB 소개): https://www.gdweb.co.kr/sub/view.asp?displayrow=60&Txt_key=all&Txt_word=&Txt_agnumber=&Txt_fgbn=7&Txt_bcode1=022410001&Txt_gbflag=&Txt_bcode2=&Txt_bcode3=&Txt_bcode4=&Txt_bcode5=&Page=1&str_no=22086
- 건담베이스/오타쿠 지도형 참고 글: http://gundam.re.kr/?p=5203

### 토스 앱인토스 디자인 참고

- 디자인 준비 가이드: https://developers-apps-in-toss.toss.im/design/prepare/design.html
- 앱빌더(Deus) 가이드: https://developers-apps-in-toss.toss.im/design/prepare/deus.html

## 3. 클라이언트 방향

### 제품 관점

- 로드맵은 사용자 기능이 아니라 향후 업데이트 계획표로 사용
- 실제 프론트 기능은 지역별 카테고리 기반 탐색에 집중
- 지도는 메인 기능보다 탐색 보조 수단으로 활용

### 초기 화면 우선순위

1. 홈
2. 지역/카테고리 선택 화면
3. 지도/리스트 탐색 화면
4. 상점 상세 화면
5. 제보 화면(후순위)

## 4. client 기술 스택 초안

- React
- TypeScript
- Vite
- react-router-dom
- @tanstack/react-query
- zustand
- Tailwind CSS
- @apps-in-toss/web-framework

### 선택 이유

- 토스 인앱 WebView 기반과 잘 맞는 가벼운 SPA 구성이 가능함
- 초기 단계에서는 SSR보다 빠른 구현과 배포 단순성이 중요함
- 서버 상태와 UI 상태를 분리해 관리하기 좋음
- 모바일 인앱 화면을 빠르게 시도하기 좋음

### 보류 항목

- Next.js
- Nx/Turborepo
- 복잡한 모노레포 패키지 분리

## 5. 폴더/브랜치 운영 초안

### 저장소 구조

- client/
- server/
- docs/
- infra/ (필요 시 추가)

### 브랜치 전략

- 기본 브랜치: main
- 작업 브랜치 예시:
  - feat/client-bootstrap
  - feat/client-home-wireframe
  - feat/client-map-view
  - chore/docs-planning

## 6. 권장 첫 작업 순서

1. 기획/기술 스택 문서 커밋
2. client 초기 프로젝트 생성(Vite + React + TypeScript)
3. 라우팅/레이아웃/Navigation 쉘 구성
4. 홈/지역/상세 와이어프레임 구현
5. 지도 연동 후보 검토 및 적용

## 7. 첫 커밋 추천

가장 먼저 남기기 좋은 커밋은 문서/기준선 커밋이다.

- 예시 커밋 메시지: `docs: add planning and client stack draft`

그 다음 커밋은 client 초기화 커밋으로 나누는 것이 좋다.

- 예시 커밋 메시지: `feat(client): bootstrap vite react app`

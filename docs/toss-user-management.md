# Apps in Toss 사용자 관리 / 리워드 / 심사 메모

Aniwhere를 Apps in Toss 비게임 미니앱으로 운영할 때, 사용자 관리와 커뮤니티 보상 설계를 어디까지 가져갈 수 있는지 정리한 문서입니다.

## 1. 사용자 관리는 어떻게 잡는가

### 권장 기본 구조

- 앱인토스 로그인(`appLogin`)으로 인가 코드 발급
- 파트너 서버에서 Access Token 교환
- `login-me` 계열 API로 `userKey` 수신
- 우리 서비스 DB에서 `userKey` 기준으로 내부 회원, 활동 이력, 포인트 원장 연결

즉, 앱인토스 안에서 사용자 식별은 토스 로그인으로 받고, 실제 회원 상태와 권한은 Aniwhere 서버가 관리하는 구조가 적합합니다.

### 왜 이렇게 가야 하나

- 비게임 출시 가이드상, 토스 로그인을 사용하는 경우 자사 로그인이나 기타 로그인 방식은 제공하지 않는 방향이 요구됩니다.
- `userKey`는 토스 로그인에서 내려오는 고유 식별자라서 후기, 제보, 신고 이력, 포인트 원장 연결에 적합합니다.
- 사용자가 토스 앱에서 로그인 연결을 끊는 경우 콜백을 받을 수 있으므로 서버에서 세션 정리와 재로그인 유도를 할 수 있습니다.

## 2. 관리자 페이지는 있는가

Apps in Toss 안에 "관리자 페이지"가 기본 제공되는 구조는 아닙니다.

대신 두 가지를 구분해서 보는 게 좋습니다.

- 토스 콘솔
  - 로그인, 프로모션, 공유 리워드, 앱 정보, 리뷰, 신고 등 앱인토스 기능 설정/운영
- Aniwhere 자체 어드민
  - 매장 검수
  - 제보 승인/반려
  - 커뮤니티 신고 처리
  - 포인트 원장 검수
  - 운영 통계

즉, 우리 서비스 운영을 위한 어드민은 `aniwhere.link/admin` 같은 별도 웹 페이지로 직접 만드는 게 자연스럽습니다.

## 3. 후기/제보 포인트를 줄 수 있는가

가능은 하지만, "아무 포인트"가 아니라 어떤 보상인지 먼저 나눠야 합니다.

### A. 서비스 내부 포인트

- 예: `Ani Coin`, `매장 기여도`, `탐험 배지`
- 서버에서 자유롭게 설계 가능
- 심사 부담이 상대적으로 작음
- 단, 토스 포인트로 오인되는 명칭은 피해야 함

### B. 토스 포인트 프로모션

- Apps in Toss 공식 기능으로 지급 가능
- 비게임 프로모션(`grantPromotionReward`) 또는 서버 연동 방식 사용 가능
- 예산, 중복 지급 방지, 지급 조건 고지, 어뷰징 방지 로직이 필요함

후기/제보 보상은 처음부터 토스 포인트로 설계하기보다,

1. 내부 포인트/배지로 시작
2. 검수된 핵심 액션에만 토스 포인트 프로모션 연결

순서가 더 안전합니다.

## 4. 추천 보상 구조

### 1단계

- 후기 작성
- 영업 상태 제보
- 폐점/이전 정보 제보
- 사진/링크 출처 보강

위 활동에 대해 서버 내부 포인트를 적립합니다.

### 2단계

운영 검수 통과 시에만 아래 중 일부를 검토합니다.

- 이벤트성 토스 포인트 지급
- 친구 초대 기반 공유 리워드
- 특정 기간 캠페인형 참여 보상

## 5. 심사/운영 관점 주의점

### 로그인

- 인트로/초기 화면에서 서비스 설명이 있어야 합니다.
- 토스 로그인 화면에서 닫기를 선택했을 때 종료/이탈 흐름이 명확해야 합니다.
- 연결 해제 후에는 사용자 데이터를 남기지 않는 흐름이 필요합니다.

### 권한

- 위치처럼 필요한 권한은 요청 전에 먼저 동의를 받아야 합니다.
- 권한을 거부해도 핵심이 아닌 기능은 계속 사용 가능해야 합니다.

### UX

- 앱 진입 직후 바텀시트 강제 노출 금지
- CTA는 결과를 예측 가능하게 작성
- 외부 서비스 이동/자사 앱 설치 유도 지양
- 리뷰 요청은 사용자가 가치를 체감한 뒤에만 호출

### 리워드

- 현금성/환전성/사행성 보상 불가
- 1인당 지급 한도와 예산 관리 필요
- 중복 지급 방지 로직 필요
- 지급 시점, 조건, 종료 가능성을 사전 고지해야 함

## 6. Aniwhere에 바로 적용하면 좋은 구조

### 사용자 테이블

- `user_key`
- `nickname`
- `role` (`user`, `moderator`, `admin`)
- `status`
- `created_at`
- `last_login_at`

### 활동/보상 테이블

- `post`
- `comment`
- `report`
- `reward_ledger`
- `reward_campaign`
- `review_request_log`

### 어드민 기능

- 매장 정보 승인/보류
- 커뮤니티 신고 처리
- 포인트 적립/차감 이력 확인
- 프로모션 지급 대상 검수

## 7. 제품 방향 권장안

- 1차: 토스 로그인 + 내부 포인트 + 자체 어드민
- 2차: `requestReview`로 앱인토스 리뷰 유도
- 3차: 프로모션/공유 리워드를 토스 포인트와 연결

토스 포인트는 강력하지만 운영/심사 제약이 크므로, 초기에 모든 활동을 토스 포인트 중심으로 묶기보다는 "검수된 핵심 행동만 캠페인성으로 연결"하는 편이 안전합니다.

## 공식 참고

- 비게임 출시 가이드: https://developers-apps-in-toss.toss.im/checklist/app-nongame.html
- 토스 로그인 개발 가이드: https://developers-apps-in-toss.toss.im/login/develop.html
- 토스 로그인 콘솔 가이드: https://developers-apps-in-toss.toss.im/login/console.html
- 비게임 프로모션(토스 포인트): https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EB%B9%84%EA%B2%8C%EC%9E%84/promotion.html
- 프로모션 콘솔 가이드: https://developers-apps-in-toss.toss.im/promotion/console.html
- 공유 리워드 소개: https://developers-apps-in-toss.toss.im/reward/intro.html
- 미니앱 리뷰 요청: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EC%9D%B8%ED%84%B0%EB%A0%89%EC%85%98/requestReview.html
- 공통 설정 / 비게임 내비게이션: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Config.html

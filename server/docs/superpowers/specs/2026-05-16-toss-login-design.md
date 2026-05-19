# Toss 인앱 로그인 서버 설계서

## 문서 목적

토스 인앱(WebView) 환경에서 `server`에 로그인 기능을 추가하기 위한 인증/권한/세션 설계를 정의한다.
본 문서는 브레인스토밍 합의안을 기준으로 작성하며, 구현 전 기준 스펙으로 사용한다.

## 범위

- 일반 사용자 + 관리자 로그인 동시 도입
- Apps in Toss 토스 로그인 연동
- 내부 API 권한 제어(`ROLE_USER`, `ROLE_ADMIN`)
- Access/Refresh 토큰 기반 세션 운영
- 토스 연결 끊기 콜백 후처리

## 비범위

- 자사 로그인, 타 소셜 로그인, 이메일/비밀번호 로그인
- Redis 캐시 도입
- 점주/사장 계정 기능

## 공식 문서 고정 참조

로그인 설계/구현/QA 시 아래 문서를 항상 함께 확인한다.

- [이해하기](https://developers-apps-in-toss.toss.im/login/intro.html)
- [개발하기](https://developers-apps-in-toss.toss.im/login/develop.html)
- [콘솔 가이드](https://developers-apps-in-toss.toss.im/login/console.html)

핵심 준수 사항:

- 미니앱 로그인은 토스 로그인만 사용한다.
- 최초 사용자 인증 근거는 `appLogin` 인가코드 플로우로 고정한다.
- 토스 연결 끊기 이벤트(`UNLINK`, `WITHDRAWAL_TERMS`, `WITHDRAWAL_TOSS`)를 서비스 후처리에 반영한다.

### M0 공식 문서 구현 체크리스트

구현·코드리뷰·QA 전에 아래를 순서대로 확인하고, 변경 시 본 설계서와 API 계약을 함께 갱신한다.

- [ ] [이해하기](https://developers-apps-in-toss.toss.im/login/intro.html): 로그인 UX·인가코드 흐름이 제품 플로우와 일치
- [ ] [개발하기](https://developers-apps-in-toss.toss.im/login/develop.html): 클라이언트→서버 전달 필드·토스 API 호출 순서 반영
- [ ] [콘솔 가이드](https://developers-apps-in-toss.toss.im/login/console.html): 앱/콜백 URL·시크릿·환경 분리 반영

## 설계 결정사항

1. 인증 접근 방식: **토스 OAuth 연동 + 내부 JWT 발급**
2. 사용자 식별 키: **`userKey` 단독**
3. 관리자 권한 모델: **`admins` 테이블 매핑**
4. Refresh 세션 저장소: **Redis 미사용, DB 저장**
5. 적용 대상: **일반 + 관리자 전체**

## 아키텍처

### Auth Entry

- 클라이언트에서 `appLogin` 호출 후 `authorizationCode`, `referrer`를 서버에 전달한다.
- 서버 엔드포인트: `POST /api/v1/auth/toss/login`

### Toss Auth Adapter

- 서버는 토스 API를 아래 순서로 호출한다.
  1. `POST /api-partner/v1/apps-in-toss/user/oauth2/generate-token`
  2. `GET /api-partner/v1/apps-in-toss/user/oauth2/login-me`
- 응답에서 `userKey`를 확보하고 내부 사용자로 매핑한다.

### Identity & Role Layer

- `users.user_key`를 유니크 키로 사용한다.
- `admins.user_id`가 존재하면 `ROLE_ADMIN`, 아니면 `ROLE_USER`로 부여한다.

### Session Token Layer

- 내부 JWT `accessToken` + `refreshToken` 발급
- `refreshToken`은 DB에 해시로 저장(원문 저장 금지)
- Refresh rotation 적용(재발급 시 기존 refresh 폐기)

### Unlink Callback Layer

- 콜백 엔드포인트: `POST /api/v1/auth/toss/unlink-callback`
- Basic Auth 헤더 검증 후 이벤트 저장
- 해당 사용자 refresh 세션 전량 폐기
- 사용자 상태를 `UNLINKED`로 전환

## 데이터 모델

### `users`

- `id` BIGINT PK
- `user_key` BIGINT NOT NULL UNIQUE
- `status` ENUM(`ACTIVE`, `UNLINKED`, `BLOCKED`) NOT NULL
- `last_login_at` DATETIME NULL
- `created_at` DATETIME NOT NULL
- `updated_at` DATETIME NOT NULL

### `admins`

- `id` BIGINT PK
- `user_id` BIGINT NOT NULL UNIQUE (FK -> `users.id`)
- `role` VARCHAR(30) NOT NULL DEFAULT `ADMIN`
- `created_at` DATETIME NOT NULL

### `refresh_tokens`

- `id` BIGINT PK
- `user_id` BIGINT NOT NULL (FK -> `users.id`)
- `token_hash` VARCHAR(255) NOT NULL UNIQUE
- `expires_at` DATETIME NOT NULL
- `revoked_at` DATETIME NULL
- `created_at` DATETIME NOT NULL

인덱스:

- `idx_refresh_user(user_id)`
- `idx_refresh_expires(expires_at)`

### `toss_unlink_events` (감사 로그)

- `id` BIGINT PK
- `user_key` BIGINT NOT NULL
- `referrer` VARCHAR(40) NOT NULL
- `raw_payload` JSON NULL
- `received_at` DATETIME NOT NULL

## API 플로우

### 1) 로그인

- `POST /api/v1/auth/toss/login`
- Request: `authorizationCode`, `referrer`
- 처리:
  1. 토스 토큰 발급
  2. 토스 사용자 조회
  3. `users` 업서트
  4. 권한 계산
  5. 내부 access/refresh 발급
  6. `refresh_tokens` 저장
- Response: `accessToken`, `refreshToken`, `expiresIn`, `role`, `isNewUser`

### 2) 토큰 재발급

- `POST /api/v1/auth/refresh`
- Request: `refreshToken`
- 처리:
  1. refresh 해시 조회 및 유효성 확인
  2. 새 access 발급
  3. refresh rotation(기존 revoke + 신규 저장)
- Response: `accessToken`, `refreshToken`

### 3) 로그아웃

- `POST /api/v1/auth/logout`
- Request: `refreshToken`
- 처리: 해당 refresh 폐기

### 4) 토스 연결 끊기 콜백

- `POST /api/v1/auth/toss/unlink-callback`
- Request: `userKey`, `referrer`
- 처리:
  1. Basic Auth 검증
  2. 이벤트 저장
  3. 사용자 상태 `UNLINKED`
  4. refresh 전량 폐기
- Response: `200 OK` (idempotent 처리)

## 에러 처리 기준

- 토스 인가코드 만료/중복: `401 TOSS_AUTH_CODE_INVALID`
- 토스 연동 실패(업스트림): `502 TOSS_UPSTREAM_ERROR`
- refresh 만료/폐기/불일치: `401 REFRESH_TOKEN_INVALID`
- 관리자 API 권한 없음: `403 FORBIDDEN`

## 보안/운영 기준

- Access TTL: 15분
- Refresh TTL: 14일
- Refresh 토큰은 평문 저장 금지(해시 저장)
- JWT 서명키는 환경변수/시크릿 저장소로 관리
- 토큰/민감정보 로그 출력 금지

## 테스트 계획

- 단위 테스트: JWT 발급/검증, refresh rotation, role 계산
- 통합 테스트: login -> refresh -> logout 정상/예외 흐름
- 콜백 테스트: unlink idempotent, refresh 전량 폐기, 상태 전환
- 회귀 테스트: 기존 공개 API(샵/커뮤니티) 인증 도입 영향 확인

## 마일스톤

- M0: 공식 문서 체크리스트 고정
- M1: DB 스키마 추가(`users`, `admins`, `refresh_tokens`, `toss_unlink_events`)
- M2: 인증 코어(JWT, refresh 저장/회전/폐기, role guard)
- M3: 토스 API 연동 어댑터(`generate-token`, `login-me`)
- M4: unlink 콜백 및 운영 로그
- M5: 샌드박스 기반 QA/스테이징 검증

## 롤아웃 순서

1. 로그인 API 오픈(기존 API optional auth)
2. 관리자 API에 auth required 적용
3. 사용자 write API에 auth required 적용
4. 만료 정책 및 운영 튜닝

## 리스크 및 대응

- 토스 업스트림 장애: timeout/retry 정책과 표준 에러 매핑 적용
- refresh 탈취: rotation, access TTL 단축, 비정상 재발급 탐지
- 권한 오판단: `admins` 변경 이력 관리 및 운영 감사 로그 확보

## 구현 상태

- [x] 구현 계획 문서 작성 완료 (`server/docs/superpowers/plans/2026-05-16-toss-login-auth-implementation.md`)
- [x] M0 공식 문서 체크리스트 본문 반영
- [x] QA 체크리스트 초안 (`server/docs/superpowers/plans/2026-05-16-toss-login-auth-qa-checklist.md`)
- [x] 인증 코드 구현 (Tasks 1–7: 설정·영속·JWT·Toss 클라이언트·REST API·Security·unlink Basic Auth)
- [ ] Task 8 통합 검증·운영 문서 마무리(전체 회귀·커밋 등 필요 시)
- [ ] 샌드박스 실기기 검증

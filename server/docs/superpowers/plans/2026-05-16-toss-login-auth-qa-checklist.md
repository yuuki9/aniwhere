# Toss Login QA Checklist

인앱 로그인 서버 설계(`server/docs/superpowers/specs/2026-05-16-toss-login-design.md`) 및 구현 계획(`server/docs/superpowers/plans/2026-05-16-toss-login-auth-implementation.md`)을 기준으로 한 수동 검증 목록이다.

## 공식 문서 정합성 (M0)

- [ ] [이해하기](https://developers-apps-in-toss.toss.im/login/intro.html): 미니앱 로그인은 토스 로그인만 사용하는지, `appLogin` 인가코드 플로우가 기준인지 재확인
- [ ] [개발하기](https://developers-apps-in-toss.toss.im/login/develop.html): 서버 측 토큰 교환·사용자 조회 순서가 문서와 일치하는지 확인
- [ ] [콘솔 가이드](https://developers-apps-in-toss.toss.im/login/console.html): 샌드박스/실서비스 설정이 배포 환경과 맞는지 확인

## API 동작

- [ ] `appLogin`으로 `authorizationCode` 획득 후 `POST /api/v1/auth/toss/login` 성공
- [ ] 일반 사용자 `role=ROLE_USER` 발급 확인
- [ ] `admins` 매핑 사용자 `role=ROLE_ADMIN` 발급 확인
- [ ] `POST /api/v1/auth/refresh` 호출 시 기존 refresh 폐기 및 신규 발급(rotation) 확인
- [ ] `POST /api/v1/auth/logout` 후 동일 refresh 재사용 불가 확인

## 연결 끊기·업스트림

- [ ] unlink callback 수신 후 해당 사용자 refresh 전량 폐기 확인
- [ ] unlink callback `Authorization` 불일치 시 401 확인
- [ ] 사용자 상태가 `UNLINKED`로 전환되는지 확인
- [ ] 토스 API 실패 시 `502 TOSS_UPSTREAM_ERROR` 등 설계서 매핑 확인

## 보안·운영

- [ ] access TTL 15분, refresh TTL 14일 정책이 설정과 발급 결과에 반영되는지 확인
- [ ] refresh는 DB에 해시만 저장되고 평문 로그가 남지 않는지 확인

## 회귀

- [ ] 기존 공개 API(샵/커뮤니티 등)에 인증 도입 후 동작 영향 없음 확인

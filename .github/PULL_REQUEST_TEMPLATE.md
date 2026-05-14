# 요약

<!-- 한 줄로 무엇을 바꾸는지 (커밋 제목 style: feat(client): …) -->

## 변경 범위

<!-- 체크해 주세요. -->

- [ ] `client/`
- [ ] `server/`
- [ ] `docs/`
- [ ] CI·워크플로 (`.github/`)

## 맥락 / 배경 (선택)

<!-- 왜 이 변경이 필요한지. 이슈·슬랙·기획 링크가 있으면 -->

## 확인한 것

<!-- 해당되는 항목만 -->

- [ ] 로컬에서 lint / test 통과
- [ ] (client) WebView·토스 앱에서 동작/레이아웃 확인
- [ ] (server) API·DB 영향 있음 (마이그레이션·롤백 가이드 있음)

## Apps in Toss / TDS 출시 리스크

<!-- client UI, WebView, navigation, routing, external link, permission, storage/draft, modal/notice, CSS 변경이 있으면 반드시 작성합니다. 해당 없음이면 이유를 적어주세요. -->

- [ ] `guard.md` 확인
- [ ] `docs/design-tokens.md` / `docs/tds-compatible-ui-layer.md` 확인
- [ ] `docs/ux-mobile-research.md` 확인
- [ ] 공식 Apps in Toss/TDS 문서 확인이 필요한 항목을 확인하거나, 후속 audit으로 분리함
- [ ] native nav와 app-owned nav가 중복되지 않음
- [ ] `alert()` / `confirm()` / 무근거 toast-like UI를 추가하지 않음
- [ ] 외부 링크·새 창·지도 앱 이동이 launch checklist 기준에서 허용 가능한 범위임
- [ ] 375px 모바일 기준에서 가로 스크롤·텍스트 겹침 리스크를 확인함

판정:

<!-- 예: Required 통과 / Needs sandbox / Needs console value / 후속 PR로 분리 -->

후속 audit 또는 의도적으로 남긴 리스크:

<!-- 예: /intro, /home, /explore strict TDS audit은 별도 PR에서 진행 -->

## 스크린샷 / 로그 (선택)

<!-- UI나 응답 예시가 있으면 -->

## 머지 후

<!-- 배포는 `main` 머지 후에 이뤄짐. 특별한 운영 공지가 필요하면 -->

---

<!--
브랜치: feature/*, fix/*, chore/* 권장
커밋: type(scope): 설명  ( scope: client | server | docs )
-->

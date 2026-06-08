# 제품 결정사항

이 문서는 채팅, 회의 메모, 운영 논의에서 확정된 제품 결정을 짧고 명확하게 기록합니다.
다른 세션은 이 문서를 먼저 확인하고, 이미 결정된 방향을 다시 뒤집지 않도록 합니다.

## 2026-04-15 관리자 / 후기 보상 / 사장 기능

### 원문 해석

1. `관리자 페이지에서 추가 샵 등록도 해야될거 같아요`
   - 관리자 페이지에는 매장 정보를 수동으로 추가 등록하는 기능이 필요합니다.

2. `후기 + 보상 지금 관리자는 샵 추가 수동 기능`
   - 현재 시점의 관리자 기능 우선순위는 "샵 수동 등록"입니다.
   - 후기 보상 구조는 고려하되, 지금 당장 핵심 MVP는 아닙니다.

3. `후기 보상은 사용자들이 등록하는거 <<admin이 검증하고 포인트 지급`
   - 후기/제보는 사용자가 작성합니다.
   - 보상은 자동 지급하지 않습니다.
   - 관리자가 검증한 뒤 포인트를 수동 또는 검수 기반으로 지급합니다.

4. `아직 사장 기능은 없음`
   - 매장 사장/점주 전용 기능은 현재 범위에 넣지 않습니다.

5. `그냥 관리자가 권한 유저가 admin 페이지에서 등록하게끔`
   - 초반 등록 주체는 관리자 또는 권한 있는 내부 운영 유저입니다.
   - 일반 사용자나 사장 계정이 직접 매장을 생성하는 구조는 뒤로 미룹니다.

6. `일단 사장한테 제휴로 팔리려면 어쩌면 유저를 존나 모아야돼서 다시 보면 이것저것 해야할듯`
   - 사장 제휴/점주 기능은 사용자 규모가 쌓인 뒤 다시 검토합니다.
   - 현재 단계에서는 사용자 확보와 데이터 신뢰도 확보가 우선입니다.

## 현재 확정 정책

### 관리자 페이지 MVP

- 매장 수동 등록
- 매장 수정/상태 변경
- 사용자 후기/제보 검수
- 포인트 지급 승인 또는 수동 지급

### 후기 보상 정책

- 사용자가 후기/제보를 작성
- 관리자가 내용 검수
- 검수 통과 시에만 포인트 지급
- 자동 포인트 지급은 초기에 도입하지 않음

### 점주/사장 기능 정책

- 현재는 제공하지 않음
- 점주 직접 등록/수정 기능은 보류
- 제휴형 기능은 사용자 규모가 충분해진 뒤 재검토

## 구현 우선순위 반영

1. 사용자 앱 UX 정리
2. 관리자 페이지 MVP 설계
3. 후기/제보 검수 플로우
4. 포인트 원장 및 수동 지급 구조
5. 점주/사장 기능은 후순위

## 2026-06-05 사용자 UI 문구 밀도 선호

- 홈, 랭킹, 리스트형 모듈에는 보조문구/helper copy를 기본으로 붙이지 않습니다.
- 섹션 제목만으로 의미가 전달되면 `p`, `small`, 보조 `span` 설명을 추가하지 않습니다.
- 데이터 기준, 갱신 주기, 실시간성 문구는 실제 API 갱신/집계 동작이 구현되고 검증된 경우에만 표시합니다.
- 필요한 맥락은 row의 핵심 정보, 탭, 상세 화면, 빈 상태 문구로 해결하고 홈 첫 화면에는 설명을 최소화합니다.
- 검색어/작품/매장 신호 기반 랭킹은 `/home`과 `/search`의 보조 모듈로 배치합니다. `/search`에서는 최근 검색어와 가까운 매장 찾기 사이에 Top10 패널을 둡니다.
- 랭킹 API의 `eventCount`는 윈도우 내 누적 이벤트 수이지 순위 증감이 아니므로 `▲/▼` 표현에 사용하지 않습니다.
- 랭킹/자동완성처럼 이미 매칭된 항목도 Explore URL에는 `keyword`와 `scope`만 전달합니다. `workId`/`shopId`는 필터 또는 상세 시트 상태로 해석되므로 검색 진입 URL에 넣지 않습니다.

## 2026-06-07 Home Ranking Board Placement

- `/home` can show one compact Rankings API Top10 module as the discovery hub's supporting module.
- Superseded by the Home Auto Chip Rail Revision below.
- `/search` may show the same Rankings API Top10 panel between recent searches and nearby discovery. It remains a search suggestion surface, not a separate ranking-board route.
- The separate full ranking board route is no longer part of the current product scope.
- Do not show fake rank movement, update timestamps, photos, store counts, `인기`, `핫`, or `급상승` unless the API exposes and verifies those fields.
- `/home` may show a compact global recent-review module only through the Swagger-backed `GET /api/v1/reviews/recent` endpoint.

## 2026-06-07 Home Auto Chip Rail Revision

- This revision supersedes older same-day Home ranking board placement notes.
- `/home` uses one compact Rankings API Top10 auto-scrolling chip rail directly under the search entry.
- The rail uses `GET /api/v1/rankings/search/entities?window=7d&limit=10` and shows only rank, label, and a small kind chip from the API kind. It does not link to a separate ranking route.
- `/search` also uses `GET /api/v1/rankings/search/entities?window=7d&limit=10` for a compact Top10 panel between recent searches and nearby discovery.
- The separate ranking route is removed; `/home` owns the compact ranking entry and its inline expanded view.
- Do not show fake rank movement, update timestamps, photos, store counts, hot labels, or urgent labels unless the API exposes and verifies those fields.
- `/home` may show at most five global recent reviews from `GET /api/v1/reviews/recent?limit=5`; user-owned reviews remain a `/my` activity concern.

## 2026-06-08 Home Recent Reviews

- This supersedes the earlier native Storage-backed recent-viewed shop idea.
- `/home` uses `GET /api/v1/reviews/recent?limit=5` for the bottom continuation module.
- Show only Swagger-backed fields: shop name, author nickname/avatar, rating, review images, review content, and review date. Do not invent visit counts, popularity labels, or local viewing history.
- Each card opens `/explore` with the matching `shopId`, expanded detail sheet, review tab, and `reviewId` focus.
- The section uses a lightweight horizontal review-item rail that mirrors the shop-detail review item, but omits action menus, likes, reports, and text expansion controls.

## 2026-06-07 Trend Entry And Search Facet Scope

- Home ranking entries add `rankingEntry=trend` when linking into Explore.
- Explore must not record `DISCOVERY_WORK_EXPLORE_ENTERED` for `rankingEntry=trend`; otherwise ranking clicks feed back into the same ranking signal.
- Ranking and autocomplete entries navigate like search suggestions: pass `keyword` plus a scope hint only.
- Work entries pass `scope=work&keyword=:label`; they must not pass `workId` because `workId` is a shop facet filter and lights the filter badge.
- Shop entries pass `scope=shop&keyword=:label`; they must not pass `shopId` or `sheet=expanded` from the ranking chip because the Home rail is a search entry, not a detail deep link.
- `/search` may show and edit existing facet state, but a submitted keyword/autocomplete/recent search starts a fresh Explore search without carrying stale facets. Facets are carried only when the user explicitly applies them from the Search filter sheet.
- Explore's search entry also starts Search without carrying current Explore facet params. The previous Explore state stays only inside `returnTo`.
- Client popularity event recording remains disabled while deployed `POST /api/v1/popularity/events` returns `403` for the current public client path. Re-enable only after the backend access policy is confirmed.

## 2026-06-08 Ads Placement Scope

- Current enabled ad scope is footer/fixed banner only on `/home`, `/explore?view=list`, and `/explore?view=map`.
- The default `.ait` deployment build has `VITE_TOSS_AD_USE_LIVE_DEFAULTS=true` in `client/.env.production` and includes the console-issued banner ad group ID `ait.v2.live.c081b1ff483d4815`; set `VITE_TOSS_AD_USE_TEST_IDS=true` only for explicit development/test-ID builds.
- Console-issued inactive IDs are recorded for future experiments only: interstitial `ait.v2.live.f9baf4bc925644c4`, rewarded `ait.v2.live.7a44e77025474da9`.
- Do not add interstitial, rewarded, search-route, modal, intro, loading, or other ad placements until inflow, retention, and product acceptance evidence justify another experiment.
- Rewarded ads are out of current scope because the required Apps in Toss prepaid budget is not accepted by the API/backend owner.

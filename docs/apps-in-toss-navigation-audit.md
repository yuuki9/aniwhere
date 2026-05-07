# Apps in Toss Navigation 라우트 점검

작성일: 2026-05-06

## 기준

- 모든 실제 화면의 최상단에는 Apps in Toss `Navigation` 기준을 둔다.
- 화면 본문 상단은 `Top`, 주요 항목은 `ListRow`, 명확한 행동은 `Button` 또는 `BottomCTA` 흐름으로 정렬한다.
- Toss 공통 내비게이션에서 제공하는 뒤로가기, 홈, 더보기 영역과 앱 자체 상단 버튼이 중복되지 않게 한다.
- 지도 화면처럼 특수 조작이 필요한 화면도 Navigation 영역과 지도 컨트롤 영역을 분리한다.
- `aniwhere.link` public web은 local TDS-compatible layer로 동일한 구조를 표현하고, Toss/Sandbox에서는 공통 내비게이션 노출 여부를 별도로 확인한다.

참조:

- Apps in Toss 디자인 준비: `https://developers-apps-in-toss.toss.im/design/prepare/design.html`
- Apps in Toss Navigation: `https://developers-apps-in-toss.toss.im/design/components/navigation.html`
- Apps in Toss ListRow: `https://developers-apps-in-toss.toss.im/design/components/list.html`
- 비게임 출시 가이드: `https://developers-apps-in-toss.toss.im/checklist/app-nongame.html`
- 로컬 기준: `docs/tds-compatible-ui-layer.md`, `docs/product-decisions.md`

## 라우트별 상태

| Route | Page | 현재 상태 | 위험 | 다음 작업 |
| --- | --- | --- | --- | --- |
| `/` | `IntroPage` | `AitTop`, `AitListRow`, `AitButton` 기반으로 정리됨 | Toss 공통 Navigation이 실제 런타임에서 보이는지 로컬만으로 확정 불가 | local fallback Navigation 또는 Toss 런타임 제공 범위를 명확히 기록 |
| `/home` | `HomePage` | 자체 `HomeHeader`, 검색 버튼, quick menu grid 사용 | Navigation/Top/ListRow 흐름과 다르고 관리자 메뉴 노출 정책이 화면 구조에 섞일 수 있음 | 홈 헤더를 Navigation-compatible 구조로 정리하고 검색/관리자 진입을 본문 액션으로 이동 |
| `/search` | `SearchPage` | 자체 뒤로가기, 제목, 검색 입력 영역 사용 | Toss 뒤로가기와 앱 자체 뒤로가기가 중복될 수 있음 | 검색 입력은 Navigation 아래 본문으로 내리고 자체 back은 public web fallback 조건으로 제한 |
| `/explore` | `ExplorePage` | 지도, 검색, FAB, bottom sheet, `GlobalNavigationMenu`가 섞여 있음 | 지도 컨트롤과 Navigation이 시각적으로 충돌하거나 z-index가 꼬일 수 있음 | Navigation 영역과 map control layer를 분리하고 expanded sheet에서는 지도 조작 버튼을 숨김 |
| `/community` | `CommunityPage` | `GlobalNavigationMenu`, 검색 버튼, custom hero/feed 사용 | Top/ListRow 흐름보다 커뮤니티 전용 UI가 먼저 드러남 | `Top`으로 커뮤니티 맥락을 주고 글쓰기/검색/피드는 ListRow/section으로 재배치 |
| `/community/:postId` | `PostDetailPage` | `목록으로` 링크와 `GlobalNavigationMenu`가 상단에 공존 | 공통 뒤로가기와 목록 이동이 중복 의미를 가질 수 있음 | 공통 back은 이전 화면 복귀로 두고 목록 이동은 본문 보조 액션으로 이동 |
| `/admin` | `AdminPage` | 접근 게이트와 관리자 콘솔 shell 사용 | 내부 화면이어도 미니앱에서 열리면 Navigation 기준 대상임 | 권한 게이트는 유지하되 상단 shell을 Navigation-compatible 구조로 정리 |
| `/admin/shops` | `AdminShopsPage` | `AdminPage`의 shops scope 사용 | `/admin`과 동일 | shop CRUD 범위는 유지하고 Navigation 정렬은 공통 admin shell에서 처리 |
| `/admin/rewards` | `AdminRewardsPage` | `AdminPage`의 rewards scope 사용 | `/admin`과 동일 | reward scope는 유지하고 Navigation 정렬은 공통 admin shell에서 처리 |
| `/shops/:shopId` | redirect | `/explore?shopId=:shopId`로 이동 | 실제 상세 UX는 `/explore`에 종속 | redirect 자체는 유지하고 `/explore` 상세 expanded 상태에서 검증 |
| `/reports/new` | redirect | `/community`로 이동 | 등록 기능이 확정되기 전 임시 연결 | 기능 확정 전까지 등록/신고성 문구가 심사 리스크를 만들지 않게 점검 |
| `/discover`, `/shops` | redirect | `/explore`로 이동 | 구 라우트 진입 시 히스토리 동작 확인 필요 | Toss/Sandbox에서 뒤로가기와 redirect 히스토리 확인 |

## 커밋 단위 제안

1. 라우트별 Navigation 점검 문서 작성
2. local TDS-compatible `Navigation` shell 도입 또는 기존 fallback 기준 명확화
3. `/home`을 `Navigation -> Top -> ListRow/Button` 흐름으로 정리
4. `/search`, `/community`, `/community/:postId`의 자체 상단 영역 정리
5. `/explore` 지도 전용 Navigation/control/bottom sheet layer 정리
6. `/admin` 계열의 권한 게이트와 관리자 shell 정리

## Sandbox에서 확인할 것

- Toss 공통 Navigation bar에 브랜드 로고와 국문명 `애니웨어`가 표시되는지
- 공통 뒤로가기와 앱 자체 뒤로가기가 동시에 보이지 않는지
- 첫 화면에서 뒤로가기가 미니앱 종료로 동작하는지
- redirect 라우트 진입 후 뒤로가기 히스토리가 꼬이지 않는지
- 지도 화면에서 pinch zoom과 지도 조작은 유지하되 일반 화면 확대가 불필요하게 켜지지 않는지

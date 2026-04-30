# Apps in Toss 출시 재정렬 Phase

이 문서는 Aniwhere 출시 재정렬 작업의 기준점이다. 현재 UI 실험 브랜치는 참고용으로만 보존하고, 출시 기준 작업은 최신 `main`에서 작업 목적과 리뷰 경계가 분명한 PR 단위로 진행한다.

## 기준 문서

- `.codex/skills/aniwhere-launch-checklist/SKILL.md`
- `docs/tds-compatible-ui-layer.md`
- `docs/design-tokens.md`
- Apps in Toss 비게임 출시 체크리스트
- Apps in Toss 디자인 준비 가이드와 Deus/Figma TDS 초안

공식 문서와 프로젝트 문서가 충돌하면 공식 문서를 우선 확인하고, 프로젝트 문서를 먼저 갱신한 뒤 구현한다.

## 현재 브랜치 처리

- `feature/explore-list-naver-style`는 UI 실험 브랜치로 보존한다.
- 해당 브랜치의 미커밋 TDS/npm 실험 변경은 `wip: 중단된 앱인토스 출시 실험` stash로 보관했다.
- 출시 재정렬 브랜치에는 위 stash를 적용하지 않는다.
- 새 작업은 최신 `main`에서 분기한 `chore/apps-in-toss-launch-phase`부터 시작한다.

## 콘솔 기준값

| 항목 | 상태 | 값 / 확인 필요 사항 |
| --- | --- | --- |
| `appName` | Needs console value | 현재 코드 값과 콘솔 앱 ID 일치 여부 확인 필요 |
| `brand.displayName` | Needs console value | 콘솔 국문 미니앱 이름 확인 필요 |
| `brand.icon` | Needs console value | `https://static.toss.im/appsintoss/29865/c231d8e8-83f4-452b-8f97-d9795f6403e8.png` |
| `brand.primaryColor` | Needs console value | 콘솔 브랜드 색상과 코드 값 일치 여부 확인 필요 |
| `webViewProps.type` | Needs sandbox | `partner` 기준으로 정렬 후 샌드박스 확인 |
| `navigationBar` | Needs sandbox | 비게임 공통 내비게이션 바, 뒤로가기, 홈 버튼 동작 확인 |

## 출시 체크리스트 1차 판정

### Passed

- `aniwhere.link` public web을 계속 유지한다.
- public web 번들에서는 `@toss/tds-mobile` 직접 런타임 import를 피하고, local TDS-compatible layer를 유지한다.
- `client/src/shared/ui/ait`와 `--ait-*` 토큰을 기준으로 Toss 스타일 화면을 흉내낼 수 있는 구조가 있다.

### Needs console value

- 콘솔 앱 ID와 `granite.config.ts`의 `appName` 일치 여부
- 콘솔 국문 미니앱 이름과 `brand.displayName`, 문서 title, 공유 문구 일치 여부
- 브랜드 로고 URL과 600x600 정사각형 표시 여부
- 콘솔에 등록된 기능별 guide URL 목록
- 외부 링크로 허용되는 공식 페이지, 법적 고지, 파트너 정보 범위

### Needs sandbox

- Apps in Toss 공통 내비게이션 바에 로고와 국문 앱 이름이 표시되는지
- 공통 뒤로가기 버튼이 하위 화면에서는 history back, 첫 화면에서는 미니앱 종료로 동작하는지
- 홈 버튼을 켤 경우 기대한 화면으로 이동하는지
- 위치 권한 bottom sheet와 거부 시 fallback이 Toss WebView에서 자연스럽게 동작하는지
- 네이버 지도 앱 연결과 웹 빠른길찾기 fallback이 외부 링크 정책을 위반하지 않는지
- `npm run build` 후 `client/aniwhere-client.ait`가 정상 생성되는지

### Risks

- 현재 매장 상세 UI 실험물은 TDS 컴포넌트 구조보다 지도 서비스 UI 복제에 가까워 출시 기준 PR의 기반으로 쓰기 어렵다.
- 자체 상단 내비게이션, 뒤로가기, 햄버거 메뉴가 Apps in Toss 공통 내비게이션과 중복될 수 있다.
- 네이버 지도, 네이버 플레이스, 빠른길찾기 링크는 외부 이동 정책 검토가 필요하다.
- public web과 Apps in Toss 출시 빌드가 같은 UI 구현체를 공유하면 공식 TDS npm 적용과 public web 안정성이 충돌할 수 있다.
- Deus/Figma 초안 없이 코드에서 상세 화면을 계속 조정하면 TDS 기준과 제품 UX가 다시 어긋날 가능성이 높다.

## Phase

### Phase 1. 문서와 기준 정렬

- 이 문서로 출시 재정렬의 기준을 고정한다.
- `Passed / Needs console value / Needs sandbox / Risks` 판정을 PR description에 그대로 옮길 수 있게 유지한다.
- 코드 변경 없이 문서 PR로 먼저 리뷰받는다.

### Phase 2. 콘솔 설정 정렬

- `granite.config.ts`를 콘솔 기준값에 맞춘다.
- `brand.displayName`, `brand.icon`, `brand.primaryColor`, `navigationBar`, `webViewProps.type`를 명시한다.
- 자체 상단 내비게이션은 Toss 런타임에서 숨기고, public web fallback에서만 보이도록 분리한다.
- 검증은 `npm run lint`, `npm run build`, `npm run build:static`, `client/aniwhere-client.ait` 생성 확인으로 진행한다.

### Phase 3. Deus/Figma TDS 초안 검토

- Deus/Figma 직접 대량 편집은 기본 전략으로 쓰지 않는다.
- 사용자가 375px 기준 TDS 초안, 스크린샷, 공유 링크를 제공한다.
- 검토 기준은 `Navigation -> Top -> ListRow -> Button/BottomCTA` 순서다.
- 사진, 후기, 지도 보조 정보는 TDS 구조를 해치지 않는 보조 섹션으로만 확장한다.
- 확정된 초안만 코드에 반영한다.

### Phase 4. 화면 리빌드

- 매장 상세는 현재 CSS 실험물을 그대로 이어 쓰지 않는다.
- `aniwhere.link`는 local TDS-compatible UI를 유지한다.
- Apps in Toss 출시 빌드는 공식 TDS 사용 가능 구조를 별도 task로 분리한다.
- 검색, 탐색, 상세 routing은 `/explore`, `/explore?shopId=...`, `/search?keyword=...` 기준으로 다시 정리한다.

### Phase 5. 출시 전 검증 리포트

- `Passed`
- `Needs console value`
- `Needs sandbox`
- `Risks`
- `Recommended fixes before submission`
- 실행한 명령과 핵심 출력

## PR 전략

- 문서, 설정, 화면 리빌드, 빌드 분리는 각각 별도 브랜치와 PR로 진행한다.
- 한 PR은 한 리뷰 주제만 담는다.
- PR 설명은 저장소 템플릿을 사용하고, 한글로 작성한다.
- 커밋 메시지는 `type(scope): 한글 설명` 형식을 유지한다.
- 사용자가 검증하기 전에는 push하지 않는다.

## 다음 작업 후보

1. `granite.config.ts` 콘솔 기준값 정렬
2. Toss 런타임과 public web runtime 판별 지점 추가
3. 공통 내비게이션과 자체 내비게이션 중복 제거
4. Deus/Figma 375px TDS 초안 리뷰
5. 확정된 초안 기반 매장 상세 화면 재구현

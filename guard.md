# Guard

이 프로젝트의 프론트엔드는 Apps in Toss WebView 미니앱을 기준으로 작업합니다.

## 작업 시작 전

- 먼저 `GIT_CONVENTIONS.md`를 읽고 브랜치/커밋/태그 규칙을 맞춥니다.
- 이어서 `README.md`와 관련 문서를 확인하고 현재 작업 맥락을 맞춥니다.
- 제품 정책이나 운영 범위를 건드리는 작업은 `docs/product-decisions.md`를 먼저 읽고 시작합니다.
- UI/UX 리디자인이나 화면 구조 개편 전에는 `docs/ux-mobile-research.md`를 먼저 확인합니다.

## 기본 원칙

- 공식 기준 문서가 있으면 Apps in Toss 문서를 우선 참고합니다.
- 화면 구조는 Toss 스타일의 정보 탐색형 UX를 기본으로 둡니다.
- API 구조를 따르는 UI도 단순 관리 화면처럼 보이지 않게 다듬습니다.
- 지도는 메인 기능이 아니라 탐색 목적에 맞는 화면에서만 강하게 사용합니다.
- 사용자는 skill 이름을 외우지 않아도 됩니다. 자연어 요청은 `docs/agent-hooks.md`의 trigger 기준으로 Codex가 해석합니다.

## 현재 프로젝트 해석

- 프론트 위치: `client/`
- 프레임워크: `@apps-in-toss/web-framework`
- 설정 파일: `client/granite.config.ts`
- 게임형 앱이 아니라 서비스형 WebView 앱으로 간주합니다.
- 기본 준수 대상은 Apps in Toss WebView/비게임 공식 문서와 TDS Mobile 문서입니다.
- `tds-react-native`와 Unity 문서는 Aniwhere WebView 작업의 기본 준수 대상이 아닙니다. 해당 플랫폼을 직접 다루는 요청이 아니라면 참고 또는 비적용 문서로 분류합니다.

## Guard / Hook / Skill 분리

- Guard는 지켜야 할 정책과 금지선을 정의합니다.
- Hook은 자연어 요청을 어떤 문서와 skill로 라우팅할지 정의합니다.
- Skill은 특정 작업을 어떻게 실행할지 정의합니다.
- 반복되는 실수가 hook으로 승격되면 `docs/agent-hooks.md`에 기록하고, 오래된 별도 guard 문서는 남기지 않습니다.

## UX 방향

- 첫 화면은 소개보다 실제 진입과 발견에 집중합니다.
- 홈, 검색, 지도 탐색, 상세의 역할을 명확히 분리합니다.
- 카드, 상태값, CTA는 한 번에 읽히는 수준으로만 노출합니다.
- 모바일 기준의 짧은 시선 흐름과 명확한 행동 유도를 우선합니다.

## Practical UI Rule

### Route-level TDS Audit

- Route-level TDS work must follow `docs/tds-route-audit.md` before editing. Classify the route, discover the relevant official TDS docs with the Apps in Toss MCP, record the docs checked, then classify each visible delta as `TDS-required`, `Product-approved`, or `Regression`.
- Do not wait for the user to provide official TDS links. If a route uses buttons, typography, lists, top/title areas, bottom CTAs, sheets, search, toasts, or dialogs, search the matching official TDS docs first.
- UI/UX 개선 요청은 `docs/agent-hooks.md`의 UI/TDS hook을 먼저 적용합니다.

- 메인 UI에는 와이어프레임성 설명문, 기능 안내문, 내부 검토용 플레이버 텍스트를 남기지 않습니다.
- 모든 화면 카피는 실사용자 기준의 짧고 직접적인 문장으로 정리합니다.
- 홈은 진입과 발견에, 검색은 검색 결과에, 지도는 위치 비교에 집중하도록 역할을 분리합니다.

## TDS / 출시 심사 기준 적용

- TDS 또는 Apps in Toss 기준을 언급하는 UI 변경은 공식 문서와 프로젝트 문서를 함께 확인합니다.
  - 공식 문서: Apps in Toss 개발자센터, TDS 컴포넌트 문서
  - 프로젝트 문서: `docs/ux-mobile-research.md`, `docs/design-tokens.md`, `docs/tds-compatible-ui-layer.md`
- 공식 TDS 컴포넌트로 확인되지 않은 패턴은 "TDS 컴포넌트"라고 부르지 않습니다.
  - 예: 공개 문서에서 Toast 컴포넌트 근거가 확인되지 않으면 `TDS Toast`가 아니라 `TDS 톤의 app-owned status notice`로 취급합니다.
- 필드 검증 오류는 해당 필드 바로 아래에 표시할 수 있습니다.
- 저장 실패, 서버 오류, 권한 오류, 인프라 오류처럼 특정 입력 필드와 무관한 상태는 폼 본문 아래에 붙이지 않습니다.
  - 특히 textarea/마지막 필드 아래에 서버 오류가 붙어 해당 필드 오류처럼 보이게 만들지 않습니다.
  - 하단 CTA 근처의 독립 상태 표시, app-owned notice, 또는 승인된 TDS 패턴을 사용합니다.
- `alert()`/`confirm()` 같은 브라우저 기본 모달은 사용하지 않습니다.
- 신규 UI는 Apps in Toss 출시 기준을 우선하며, 공식 TDS facade 또는 출시 기준 app-owned UI로 구현합니다.
- 기존 `--ait-*` 토큰과 `client/src/shared/ui/ait` 계층은 제거 대상의 migration debt로 취급하고, 새 `Ait*` route/page import는 추가하지 않습니다.
- Page code는 `@toss/tds-mobile` 또는 `@toss/tds-mobile-ait`를 직접 import하지 않고 `@aniwhere/tds-mobile` facade를 사용합니다.
  - Apps in Toss 빌드에서는 facade가 공식 `@toss/tds-mobile` 컴포넌트로 resolve되어야 합니다.
  - Public/domain 빌드에서만 Toss runtime 누수를 막기 위해 local fallback으로 resolve합니다.
  - 이 규칙은 공식 TDS 회피가 아니라 `.ait` 출시 빌드와 `aniwhere.link` public build를 동시에 보호하기 위한 adapter 경계입니다.

## 입력 폼 상태 보존

- Apps in Toss WebView에서는 pull-to-refresh, 스와이프 뒤로가기, 네이티브 내비게이션 등으로 작성 중 화면이 쉽게 이탈될 수 있습니다.
- 긴 입력 폼은 새로고침/라우트 왕복에 대비해 작성 중 값을 보존할 수 있습니다.
  - 텍스트, 선택 주소, 좌표처럼 재입력 비용이 큰 값은 `sessionStorage` 기반 draft 보존을 허용합니다.
  - 등록 성공 시 draft는 즉시 삭제합니다.
  - 명시적 취소/홈 이탈 플로우를 만들 경우 draft 삭제 또는 확인 절차를 둡니다.
  - 파일 객체는 브라우저 보안/수명 제약이 있으므로 hard refresh 후 완전 보존 대상으로 보지 않습니다.
- draft 보존은 TDS 자체 규칙이 아니라 Apps in Toss WebView 입력 UX 방어장치로 문서화합니다.

## 구현 방향

- `shops`, `community(posts/comments)`를 중심으로 화면을 구성합니다.
- Swagger 스펙 변경은 프론트 타입과 API 호출 함수에 우선 반영합니다.
- `brand.displayName`, `appName` 등 메타 정보는 실제 서비스 명칭과 일치시켜둡니다.
- 출시 전에는 Sandbox 기반 검증과 실제 배포 설정을 다시 확인합니다.
- 관리자/보상/사장 기능 범위는 `docs/product-decisions.md`의 최신 결정을 우선합니다.

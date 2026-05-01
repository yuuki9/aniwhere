# Aniwhere Mobile UX Research Notes

앱형 UX로 다시 다듬을 때 근거로 삼는 문서입니다.  
목표는 “화면에 많은 걸 보여주기”보다 “사용자가 한 번에 이해하고 다음 행동을 고를 수 있게 만들기”입니다.

## 현재 문제 정의

- 홈에 `근처 추천`, `큐레이션`, `검색`, `필터`, `커뮤니티`, `지도`가 동시에 강하게 드러나면 시선이 분산됩니다.
- 검색을 리스트/탐색 화면 안에서 바로 해결하려 하면 입력, 추천, 결과, 지도까지 한 화면에서 경쟁하게 됩니다.
- 앱형 UX는 보통 한 화면에 **주요 목적 1개 + 보조 정보 1~2개**로 정리될 때 이해가 빨라집니다.

## 실무형 참고 사례

### 컴포즈커피 UX 개선 회고

출처: [컴포즈커피 - App UX 디자인 개선 프로젝트 & 프로젝트 회고록](https://velog.io/@rlatjdgh9612/%EC%BB%B4%ED%8F%AC%EC%A6%88%EC%BB%A4%ED%94%BC-UX-%EB%94%94%EC%9E%90%EC%9D%B8-%EA%B0%9C%EC%84%A0-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%ED%9A%8C%EA%B3%A0%EB%A1%9D)

이 글은 공식 UX 가이드 문서는 아니지만, 실제 리디자인 프로젝트에서 어떤 문제를 줄이고 무엇을 전면에 세웠는지 설명이 명확해서 참고 가치가 있습니다.

Aniwhere에 가져올 포인트:

- 화면의 목적을 먼저 좁힌 뒤 UI를 정리한다.
- 사용자가 바로 써야 하는 핵심 기능을 상단에 전면 배치한다.
- 보조 기능은 하단으로 내리고, 시선이 먼저 가는 영역에는 대표 행동만 둔다.
- “좋은 기능이 많다”보다 “무엇을 먼저 해야 하는지 알겠다”가 더 중요하다.

## 핵심 원칙

### 1. 한 화면에는 한 가지 주된 목적을 둔다

- 시작 화면: 서비스 이해 + 시작 CTA
- 검색 화면: 검색에만 집중
- 탐색 화면: 리스트/지도 비교
- 상세 화면: 방문 판단

이 원칙은 Apple의 탐색/검색 가이드와 Apps in Toss의 “빠르게 읽히는 구조” 기준과도 맞습니다.

## 공식 가이드와 연구에서 가져온 규칙

### Apps in Toss 디자인 기준

출처: [Apps in Toss 디자인 준비](https://developers-apps-in-toss.toss.im/design/prepare/design.html)

- 모든 화면 최상단에는 `Navigation` 컴포넌트를 사용합니다.
- 화면은 가로 `375px` 기준으로 작업합니다.
- 화면 상단에는 `Top`, 본문 정보는 `ListRow` 중심으로 구성하는 것이 권장됩니다.
- 컴포넌트 내부 패딩을 믿고, 과도한 gap이나 카드 중첩을 피합니다.

Aniwhere 적용:

- 랜딩도 웹 페이지처럼 길게 쌓기보다, 앱 화면 한 장처럼 설계합니다.
- “섹션을 계속 추가”하기보다 `Top + 설명 + CTA + 핵심 3개`로 끊습니다.

### 검색은 별도 영역으로 독립시킬 수 있다

출처: [Apple HIG - Search fields](https://developer.apple.com/design/human-interface-guidelines/search-fields)

Apple은 검색이 풍부한 추천, 카테고리, 최근 검색과 함께 동작할 때는 검색을 **전용 영역** 또는 **탭/별도 공간**으로 두는 것이 도움이 된다고 설명합니다.

Aniwhere 적용:

- 검색창을 홈/탐색 화면 안에 억지로 박지 않습니다.
- 검색 진입 버튼을 누르면 `Search Focus` 화면으로 이동합니다.
- 그 화면에서 최근 검색어, 추천 검색어, 인기 검색어를 보여줍니다.

### 모바일에서 사용자의 주의는 위쪽 절반에 강하게 몰린다

출처: [Towards better measurement of attention and satisfaction in mobile search](https://research.google/pubs/towards-better-measurement-of-attention-and-satisfaction-in-mobile-search/)

Google 연구는 모바일 검색에서 사용자의 시선과 viewport 기반 주의가 화면의 상단 절반에 더 강하게 집중되는 경향을 보여줍니다.

Aniwhere 적용:

- 첫 화면 상단에는 가장 중요한 하나만 둡니다.
- `근처 추천`, `큐레이션`, `핫픽`, `커뮤니티`를 상단에 다 몰아두지 않습니다.
- Above the fold에서는 `핵심 CTA + 핵심 설명 + 한 가지 추천 모듈`만 보이게 합니다.

### 모바일 검색은 “클릭 없이 만족”시키는 결과가 중요하다

출처:
- [Good Abandonment in Mobile and PC Internet Search](https://research.google/pubs/good-abandonment-in-mobile-and-pc-internet-search/)
- [Large-Scale Analysis of Viewing Behavior: Towards Measuring Satisfaction with Mobile Proactive Systems](https://research.google/pubs/large-scale-analysis-of-viewing-behavior-towards-measuring-satisfaction-with-mobile-proactive-systems/)

모바일에서는 사용자가 클릭을 많이 하지 않아도, 결과 요약만으로 만족하는 경우가 많습니다.  
즉 좋은 모바일 UX는 “더 눌러야 이해되는 화면”보다 “한눈에 판단 가능한 화면”에 가깝습니다.

Aniwhere 적용:

- 리스트 카드에는 방문 판단에 필요한 핵심 정보만 둡니다.
- 주소, 상태, 최근 업데이트, 작품 수, 링크 수를 중복해서 여러 곳에 반복하지 않습니다.
- `상세 보기`는 보조, `카드 자체는 빠른 비교` 역할로 둡니다.

### 추천어는 유용하지만 과도하면 오히려 느려질 수 있다

출처: [A Cost–Benefit Study of Text Entry Suggestion Interaction](https://research.google/pubs/a-costbenefit-study-of-text-entry-suggestion-interaction/)

Google 연구는 제안어가 입력 행동을 줄여줄 수는 있지만, 너무 적극적으로 많이 제시되면 오히려 사용자가 평가하고 선택하는 인지 비용이 늘어난다고 설명합니다.

Aniwhere 적용:

- 추천 검색어를 “모두 크게 노출”하지 않습니다.
- 추천 검색어는 8~10개 내로 제한합니다.
- 홈에서는 추천어를 보여주지 않고, 검색 포커스 화면에서만 보여줍니다.

### 위치 권한은 예측 가능하고 맥락 있게 요청해야 한다

출처: [A Large Scale Study of Users Behaviors, Expectations and Engagement with Android Permissions](https://research.google/pubs/a-large-scale-study-of-users-behaviors-expectations-and-engagement-with-android-permissions/)

이 연구는 사용자가 예상하지 못한 권한 요청을 더 자주 거부하며, 요청 이유가 설명될수록 거부율이 낮아질 수 있음을 보여줍니다.

Aniwhere 적용:

- 앱 시작 즉시 위치 권한 팝업을 띄우지 않습니다.
- 먼저 “내 주변 성지 추천” 가치 설명을 보여준 뒤 요청합니다.
- 위치를 거부해도 지역 큐레이션으로 계속 사용할 수 있게 합니다.

## Aniwhere용 화면 구성 규칙

### 1. Intro / Start

- 목적: 서비스 이해와 시작
- 상단 요소:
  - 서비스 이름
  - 한 줄 설명
  - 핵심 가치 3개
- 하단 요소:
  - `시작하기` CTA 하나
  - 보조 링크 하나 정도만 허용

금지:

- 지도
- 커뮤니티 미리보기
- 과한 필터
- 긴 큐레이션 리스트

### 2. Discover

- 목적: 오늘 어디서 시작할지 정하게 하기
- 상단 우선순위:
  - 대표 비주얼이 있는 메인 캐러셀 1개
  - 검색 또는 지도 진입 같은 핵심 액션 2개
- 보조 섹션:
  - 최대 1개

권장:

- `Near You`와 `지역 큐레이션`을 동시에 크게 두지 않기
- 위치 허용 전: 지역 큐레이션 우선
- 위치 허용 후: 근처 추천 우선, 큐레이션은 아래

Aniwhere 홈 권장 레이아웃:

1. 상단 1/3
   - 이미지가 포함된 메인 캐러셀
   - 한 줄 제목
   - 짧은 설명
   - 현재 가장 밀고 싶은 기능/큐레이션 1개만 노출

2. 그 아래
   - `지도로 보기`
   - `키워드로 검색`
   - 두 개만 나란히 배치
   - 각 버튼 아래에 짧은 설명을 둔다

3. 하단 큐레이션
   - `이번 주 인기 매장`
   - `리뷰 많은 순`
   - `요즘 많이 찾는 키워드`
   - 이 셋 중 하나만 선택해서 랭킹형 카드로 노출

4. 금지
   - 홈에서 필터 전체 노출
   - 홈에서 Near You, Hot Picks, Region Picks를 모두 강하게 노출
   - 지도, 검색, 큐레이션을 모두 같은 우선순위로 경쟁시키기

2026-05-02 Home 구현 결정:

- `/home`의 작품/매장 섹션은 Swagger/API가 제공하는 필드만 사용합니다.
- API에 없는 판단형 카피, 추천 사유, 임의 fallback 라벨은 프론트에서 만들지 않습니다.
- 필요한 정보가 API에 없으면 프론트 추정 함수로 대체하지 않고 백엔드 계약 추가 요청으로 처리합니다.
- 추정류 함수와 사용되지 않는 export는 제거합니다. 예: 임의 점수 기반 추천 정렬, fallback 작품 키워드, `지역 미확인`, `굿즈샵`, `정보 갱신` 같은 생성 문구.
- 허용되는 가공은 단순 포맷팅에 한정합니다. 예: `address + floor`, `regionName + categories[0]`, `updatedAt` 날짜 표시.

### 3. Search Focus

- 목적: 검색 자체에 몰입
- 포함 요소:
  - 검색 입력
  - 최근 검색어
  - 추천 검색어
  - 인기 검색어

이 화면에서는 지도/커뮤니티/리스트 결과를 같이 크게 보여주지 않습니다.

### 4. Explore

- 목적: 검색 결과와 지도 비교
- 포함 요소:
  - 검색 결과 요약
  - 접을 수 있는 필터
  - 리스트
  - 지도

규칙:

- 검색 입력은 직접 노출하지 말고 검색 포커스 화면 진입 버튼으로 대체 가능
- 필터는 기본 접힘 상태로 유지
- 리스트 카드와 지도 포커스 카드의 정보는 중복 최소화

### 5. Detail

- 목적: 방문 판단
- 우선 정보:
  - 이 매장이 어떤 곳인지
  - 영업 상태
  - 최근 업데이트
  - 공식 링크
  - 후기/제보

## 디자인 의사결정 체크리스트

화면을 추가하거나 수정할 때 아래 질문에 `예`가 많아야 합니다.

1. 이 화면의 주된 목적이 한 문장으로 설명되는가?
2. 첫 화면 절반 안에 가장 중요한 정보가 들어오는가?
3. 검색, 탐색, 상세 역할이 섞이지 않았는가?
4. 반복되는 정보(주소, 상태, 링크 수 등)가 여러 영역에 중복되지 않는가?
5. 버튼이 많아 보이기보다 “다음 행동”이 분명한가?
6. 위치 권한이나 로그인 요청이 맥락 있게 제시되는가?

## 다음 리디자인 원칙

- 홈은 더 짧게
- 검색은 더 독립적으로
- 탐색은 더 비교 중심으로
- 상세는 더 판단 중심으로
- 한 화면당 CTA는 1개를 기준으로, 많아도 2개 이내로 제한

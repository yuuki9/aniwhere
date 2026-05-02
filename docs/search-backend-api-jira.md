# `/search` 고도화를 위한 백엔드 API 요구사항

## 배경

현재 `/search`는 Swagger 기준 `GET /api/v1/shops`의 `keyword`, `page`, `size`, `sort`, `regionId`, `category`만 사용할 수 있습니다.
올리브영 매장 검색이나 라프텔스토어 검색처럼 추천어, 상품 탭, 필터 facet, 결과 썸네일을 안정적으로 제공하려면 프론트가 전체 매장을 다시 수집해 추정하지 않고 서버가 목적별 데이터를 제공해야 합니다.

## Jira 1. 검색 추천어 API

- 제목: `GET /api/v1/search/suggestions` 제공
- 목적: 검색 진입 화면에서 최근 검색어 외 추천 검색어, 급상승 검색어, 작품 기반 검색어를 노출
- 요청 파라미터:
  - `type`: `TRENDING | WORK | CATEGORY`
  - `limit`: 기본 10
- 응답 필드:
  - `keyword`: 검색어
  - `label`: 화면 표시명
  - `source`: 집계 기준
  - `rank`: 노출 순서
- 완료 기준:
  - 프론트가 `GET /api/v1/shops?size=200` 같은 전체 매장 조회 없이 추천어를 렌더링할 수 있다.
  - 추천어 클릭 시 기존 `/search?keyword=...` 흐름으로 연결된다.

## Jira 2. 검색 필터 facet API

- 제목: `GET /api/v1/search/facets` 제공
- 목적: 올리브영식 필터 칩을 서버 데이터 기준으로 구성
- 요청 파라미터:
  - `keyword`
  - `regionId`
  - `category`
- 응답 필드:
  - `regions`: 지역명, 지역 ID, 결과 수
  - `categories`: 카테고리명, 결과 수
  - `flags`: `openNow`, `sellsIchibanKuji` 등 지원 가능한 boolean 필터와 결과 수
- 완료 기준:
  - 필터 칩의 결과 수와 실제 검색 결과가 일치한다.
  - 지원하지 않는 필터는 응답에 포함하지 않는다.

## Jira 3. 상품 검색 API

- 제목: `GET /api/v1/products/search` 또는 `GET /api/v1/search/products` 제공
- 목적: 매장 탭과 상품 탭을 분리해 라프텔스토어식 상품 검색을 확장 가능하게 함
- 요청 파라미터:
  - `keyword`
  - `page`
  - `size`
  - `sort`
- 응답 필드:
  - `id`
  - `name`
  - `thumbnailUrl`
  - `priceText` 또는 가격 구조
  - `shopCount`
  - `relatedShopIds`
- 완료 기준:
  - 상품 탭은 상품 API가 있을 때만 노출한다.
  - 이미지와 가격은 라이선스와 출처가 확인된 데이터만 반환한다.

## Jira 4. 매장 검색 결과 썸네일

- 제목: Shop 응답에 검색 결과용 대표 이미지 추가
- 목적: 매장 목록을 카드형으로 보여줄 때 임시 이미지 없이 실제 매장 사진을 사용
- 응답 후보:
  - `thumbnailUrl`
  - `thumbnailAlt`
  - `photoSource`
- 완료 기준:
  - `GET /api/v1/shops`와 `GET /api/v1/shops/{id}` 모두 동일한 대표 이미지 필드를 제공한다.
  - 이미지가 없으면 필드를 `null`로 내려주고, 프론트는 텍스트형 카드로 안전하게 폴백한다.

## Jira 5. 최근 이용 매장

- 제목: 인증 사용자 기준 `GET /api/v1/me/recent-shops` 제공
- 목적: 올리브영식 `최근 이용 매장` 필터를 실제 사용자 이력 기반으로 제공
- 전제:
  - Toss 로그인 사용자와 Aniwhere 사용자 매핑이 완료되어야 한다.
  - 위치 권한이나 브라우저 저장소만으로 최근 이용 매장을 추정하지 않는다.
- 완료 기준:
  - 인증되지 않은 사용자는 해당 필터를 숨긴다.
  - 개인정보 보관 기간과 삭제 정책이 명시된다.

## Jira 6. 현위치 반경 매장 검색 API

- 제목: `GET /api/v1/shops/nearby` 또는 `GET /api/v1/shops?lat=&lng=&radiusKm=` 제공
- 목적: 프론트가 전체 매장을 내려받아 거리 계산을 하지 않고, 서버가 현재 위치 기준 반경 내 매장을 가까운 순으로 반환
- Naver Map API 역할:
  - 지도 렌더링, 사용자 위치 마커 표시, 지도 중심 이동, 줌 제어에 사용한다.
  - 좌표 기반 길찾기/외부 지도 연결에 사용한다.
  - Aniwhere가 보유한 매장 DB를 반경 조건으로 검색하거나 페이지네이션하는 역할은 하지 않는다.
- 백엔드 API가 필요한 이유:
  - Naver Map은 지도 SDK이고, Aniwhere 매장 데이터의 검색/정렬/권한/페이징 기준은 서비스 DB에서 결정해야 한다.
  - 프론트에서 `GET /api/v1/shops?size=200`처럼 전체 매장을 받아 거리 계산하면 데이터가 늘어날수록 성능과 정확성이 흔들린다.
  - 위치 좌표를 서버에서 검색 조건으로만 사용하고 저장하지 않는 정책을 명시해야 한다.
- 요청 파라미터:
  - `lat`: 현재 위치 위도
  - `lng`: 현재 위치 경도
  - `radiusKm`: 기본 5km, 최대 20km
  - `page`
  - `size`
  - `category`
- 검증 규칙:
  - `lat`은 `-90` 이상 `90` 이하, `lng`는 `-180` 이상 `180` 이하만 허용한다.
  - `radiusKm`는 `0`보다 크고 `20` 이하만 허용한다.
  - 범위를 벗어난 요청은 `400 Bad Request`로 거절한다.
  - 에러 응답 예시: `{ "code": "INVALID_PARAMETER", "message": "검색 반경은 20km 이하로 입력해 주세요.", "invalidParameter": "radiusKm" }`
- 응답 필드:
  - 기존 `Shop` 필드
  - `distanceKm`: 현재 위치에서 매장까지의 거리
- 완료 기준:
  - 거리 정렬은 서버 기준으로 수행한다.
  - 반경 밖 매장은 응답하지 않는다.
  - 페이지네이션은 반경 필터링 이후 `distanceKm` 오름차순 결과를 기준으로 적용한다.
  - 위치 좌표는 검색 목적 외 저장하지 않는다.

# Shops Facets API Design (`/api/v1/shops/facets`)

**상태:** 구현 동기화 완료 (Task 7, 2026-05-23)  
**범위:** `server` 기준 실제 구현 계약 정리

---

## 1. Endpoint

- `GET /api/v1/shops/facets`
- 목적: 샵 검색 필터 UI에서 사용할 facet 후보(지역/카테고리/작품/상태)와 카운트 제공

---

## 2. Query Contract (Implemented)

### 2.1 지원 파라미터

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `keyword` | `string` | 샵 이름 부분 일치 검색 키워드. trim 후 공백-only면 `null` 처리 |
| `regionIds` | `number[]` (`Short`) | 지역 멀티 선택 |
| `categoryIds` | `number[]` (`Short`) | 카테고리 멀티 선택 |
| `workIds` | `number[]` (`Int`) | 작품 멀티 선택 |
| `status` | `ACTIVE \| CLOSED \| UNVERIFIED` | 샵 상태 필터 |
| `swLat`,`swLng`,`neLat`,`neLng` | `decimal` | 지도 bounds 필터 (사각형) |
| `type` | `ANIMATION \| GAME` | 작품 타입 필터 |

### 2.2 파싱/검증 규칙

- `keyword`와 `type`은 trim 후 처리한다.
- `regionIds`, `categoryIds`, `workIds` 미전달 시 각각 빈 집합(`emptySet`)으로 처리한다.
- `status`/`type`은 대소문자 무시(enum uppercase 변환)로 파싱한다.
- `status`가 enum 외 값이면 `400 Bad Request` (`Invalid shop status: {value}`).
- `type`이 enum 외 값이면 `400 Bad Request` (`type must be one of: ANIMATION | GAME`).
- bounds는 4개 값을 모두 주거나 모두 생략해야 한다.
  - 일부만 전달: `400` (`swLat, swLng, neLat, neLng must be provided together`)
  - `swLat > neLat` 또는 `swLng > neLng`: `400` (`invalid bounds: ...`)

---

## 3. Response Contract (Implemented)

응답 DTO: `ShopFacetResponse`

```json
{
  "regions": [
    { "id": 1, "name": "홍대", "selected": false, "disabled": false, "count": 12 }
  ],
  "categories": [
    { "id": 2, "name": "굿즈", "selected": true, "disabled": false, "count": 8 }
  ],
  "works": [
    { "id": 10, "name": "원피스", "coverUrl": "https://...", "selected": false, "disabled": false, "count": 9 }
  ],
  "statuses": [
    { "value": "ACTIVE", "label": "운영중", "selected": true, "disabled": false, "count": 11 }
  ]
}
```

### 3.1 공통 필드 규칙

- `selected`: 현재 요청 필터에 해당 항목이 포함되었는지 여부
- `count`: 현재 필터 기준에서 해당 항목을 포함했을 때의 결과 수
- `disabled`: `count == 0` 인 경우 `true`

### 3.2 facet 계산 의미

- 필터 그룹 간 결합: **AND**
  - region 그룹 AND category 그룹 AND work 그룹 AND status 그룹 AND keyword AND bounds
- 동일 그룹 내 멀티 선택: **OR**
  - 예: `regionIds=[1,2]`는 1 또는 2 지역 매장
- 작품(work) facet:
  - catalog는 `type` 필터를 반영해 정렬(`name ASC`) 제공
  - 선택된 작품이 있을 때도 후보 작품별 카운트가 유지되도록 selected-base/교집합 기반 계산을 사용
- 상태(status) facet:
  - 선택 상태가 있을 경우 selected status 기준 카운트와 후보 상태 카운트를 결합해 표시

---

## 4. `/api/v1/shops` 호환성 메모

`GET /api/v1/shops`는 기존 `category`(이름 기반)와 신규 `categoryIds`(ID 기반)를 **동시에 지원**한다.

- `category`와 `categoryIds`를 함께 전달하면 둘 다 적용된다(AND).
- `categoryIds` 미전달 시 빈 집합으로 처리된다.
- 이 동작은 기존 클라이언트 호환성을 유지하기 위한 의도된 계약이다.

---

## 5. Cache Notes (Implemented)

`ShopService.getShopFacets()`는 프로세스 메모리 캐시를 사용한다.

- 저장소: `ConcurrentHashMap<ShopFacetQuery, CachedFacetResponse>`
- TTL: `30초` (`FACET_CACHE_TTL_MILLIS = 30_000`)
- 캐시 키 정규화:
  - `regionIds/categoryIds/workIds`는 Set으로 정규화
  - bounds(`swLat/swLng/neLat/neLng`)는 소수점 `scale=6`으로 정규화
- 무효화 시점:
  - `createShop`, `createShopWithImages`, `updateShop`, `updateShopWithImages`, `deleteShop`
- 주의:
  - 애플리케이션 인스턴스 로컬 캐시이며 분산 캐시는 아니다.
  - 다중 인스턴스 환경에서는 인스턴스별 캐시가 독립적으로 동작한다.

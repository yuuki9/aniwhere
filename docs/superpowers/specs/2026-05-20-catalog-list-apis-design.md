# regions · categories 목록 API 및 works 타입 필터 설계

**상태:** 구현 완료 (2026-05-20)  
**범위:** 서버만 (클라이언트 API 함수·UI 연동은 후속 PR)

---

## 1. 배경

- `regions`, `categories` 테이블·엔티티·리포지토리·도메인 모델은 존재하나 목록 API가 없다.
- Admin 매장 등록, Explore/Search 필터 UI가 서버 마스터 데이터를 참조할 수 없어 클라이언트가 매장 전체 조회로 추정하거나 칩을 만들지 않는 상태다 (`Deferred facet filters`).
- `GET /api/v1/works`는 애니·게임 카탈로그를 한 번에 반환한다. 화면별로 타입별 로드가 필요하다.
- `docs/search-backend-api-jira.md`의 facet API는 키워드·workId 등 **조건별 동적 count**를 다루며, 이번 작업과 별도다.

---

## 2. 목표

1. **`GET /api/v1/regions`** — 지역 마스터 + 매장 수(`count`)
2. **`GET /api/v1/categories`** — 카테고리 마스터 + 매장 수(`count`)
3. **`GET /api/v1/works?type=`** — optional `type` 쿼리로 애니/게임 분리 로드 (미지정 시 기존과 동일)

---

## 3. API 계약

### 3.1 `GET /api/v1/regions`

**응답:** `ApiResponse<RegionListItem[]>`

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "홍대", "city": "서울", "count": 12 }
  ]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `number` | `regions.id` |
| `name` | `string` | 지역명 |
| `city` | `string` | 도시 (기본 `"서울"`) |
| `count` | `number` | 해당 `region_id`를 가진 매장 수 (≥ 0) |

- **정렬:** `name` 오름차순
- **`count = 0`인 지역도 포함** (Admin 드롭다운·마스터 완전성)

### 3.2 `GET /api/v1/categories`

**응답:** `ApiResponse<CategoryListItem[]>`

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "피규어", "count": 8 }
  ]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `number` | `categories.id` |
| `name` | `string` | 카테고리명 (unique) |
| `count` | `number` | 해당 카테고리를 1개 이상 보유한 매장 수 |

- **정렬:** `name` 오름차순
- **다중 카테고리 매장:** 각 카테고리 `count`에 각각 1회 집계
- **`count = 0`인 카테고리도 포함**

### 3.3 `GET /api/v1/works`

**기존 엔드포인트 확장.** optional 쿼리 파라미터:

| 파라미터 | 값 | 동작 |
|----------|-----|------|
| (생략) | — | 애니 + 게임 전체 (기존과 동일) |
| `type=ANIMATION` | `ANIMATION` | 애니만. `popularity DESC NULLS LAST, name ASC` |
| `type=GAME` | `GAME` | 게임만. `name ASC` |

- **응답:** 기존 `WorkCatalogItem[]` 유지. works 항목별 `count`는 포함하지 않는다.
- **잘못된 `type`:** `400 Bad Request` — `"type must be ANIMATION or GAME"`

---

## 4. count 집계 기준 (확정)

- **포함 status:** `ACTIVE`, `UNVERIFIED`, `CLOSED` **전부**
- **제외:** `region_id`가 null인 매장, 카테고리 미지정 매장
- **1차 범위에 `?status=` 파라미터 없음** — status별 count는 후속 facet API에서 처리

> 사용자-facing 필터 칩에 count를 붙일 때 폐점(`CLOSED`) 매장도 포함된다. Admin·데이터 현황 파악 목적에 맞춘 1차 선택이며, 탐색 UI에서 ACTIVE만 필요하면 facet API 또는 후속 파라미터로 분리한다.

---

## 5. 아키텍처

기존 `WorkController` hexagonal 패턴을 따른다.

```
RegionController / CategoryController
  → ListRegionsUseCase / ListCategoriesUseCase
  → RegionCatalogPersistencePort / CategoryCatalogPersistencePort
  → RegionCatalogPersistenceAdapter / CategoryCatalogPersistenceAdapter

WorkController (기존)
  → ListWorksUseCase (type optional 인자 추가)
  → WorkCatalogPersistencePort (type별 조회 메서드 추가)
  → WorkCatalogPersistenceAdapter
```

### 5.1 도메인 모델 (신규)

- `RegionListItem(id: Short, name: String, city: String, count: Long)`
- `CategoryListItem(id: Short, name: String, count: Long)`

### 5.2 count JPQL (개념)

```sql
-- regions
SELECT r.id, r.name, r.city, COUNT(DISTINCT s)
FROM RegionEntity r
LEFT JOIN ShopEntity s ON s.region = r
GROUP BY r
ORDER BY r.name ASC

-- categories (CategoryEntity에 inverse mapping 없음 → MEMBER OF 사용)
SELECT c.id, c.name, COUNT(DISTINCT s)
FROM CategoryEntity c
LEFT JOIN ShopEntity s ON c MEMBER OF s.categories
GROUP BY c.id, c.name
ORDER BY c.name ASC
```

status 필터 없음 = 전체 status 집계.

### 5.3 SecurityConfig

public read 추가:

```kotlin
it.requestMatchers(HttpMethod.GET, "/api/v1/regions/**").permitAll()
it.requestMatchers(HttpMethod.GET, "/api/v1/categories/**").permitAll()
```

(`/api/v1/works/**`는 이미 permit)

---

## 6. 에러 처리

| 케이스 | 처리 |
|--------|------|
| DB 조회 실패 | Spring 전역 예외 → `500` |
| `GET /api/v1/works?type=INVALID` | `400 Bad Request` |
| 빈 마스터 | `200` + `data: []` |

---

## 7. 테스트

`@WebMvcTest` 슬라이스 (기존 `WorkControllerTest` 패턴):

| 테스트 | 검증 |
|--------|------|
| `RegionControllerTest` | `200`, `id`/`name`/`city`/`count` 필드 |
| `CategoryControllerTest` | `200`, `id`/`name`/`count` 필드 |
| `WorkControllerTest` (확장) | `type` 생략·`ANIMATION`·`GAME`·잘못된 type |
| persistence adapter (권장) | CLOSED/UNVERIFIED 매장이 count에 포함 |

---

## 8. 범위 밖 (이번 PR)

- 클라이언트 `getRegions` / `getCategories` / `getWorks({ type })` 및 UI 연동
- `GET /api/v1/search/facets` (조건별 동적 count)
- regions / categories CRUD
- works 항목별 shop count
- count용 `?status=` 파라미터

---

## 9. 구현 시 터치 예상 파일

**신규**

- `domain/region/model/RegionListItem.kt`
- `domain/region/port/in/ListRegionsUseCase.kt`
- `domain/region/port/out/RegionCatalogPersistencePort.kt`
- `domain/region/service/RegionCatalogService.kt`
- `domain/category/model/CategoryListItem.kt`
- `domain/category/port/in/ListCategoriesUseCase.kt`
- `domain/category/port/out/CategoryCatalogPersistencePort.kt`
- `domain/category/service/CategoryCatalogService.kt`
- `adapter/in/web/RegionController.kt`
- `adapter/in/web/CategoryController.kt`
- `adapter/out/persistence/RegionCatalogPersistenceAdapter.kt`
- `adapter/out/persistence/CategoryCatalogPersistenceAdapter.kt`
- `RegionControllerTest.kt`, `CategoryCatalogPersistenceAdapterTest.kt` (또는 동등)

**수정**

- `WorkController.kt` — `type` 파라미터
- `ListWorksUseCase.kt`, `WorkCatalogService.kt`, `WorkCatalogPersistencePort.kt`, `WorkCatalogPersistenceAdapter.kt`
- `SecurityConfig.kt`
- `WorkControllerTest.kt`

---

## 10. 승인 이력

| 항목 | 결정 |
|------|------|
| works 타입 필터 | optional `type` 쿼리 파라미터 (기존 API 확장) |
| regions/categories count | 포함 (`{ id, name, count }` + region은 `city`) |
| count status 기준 | 전체 status (ACTIVE + UNVERIFIED + CLOSED) |
| PR 범위 | 서버만 |

# Shop 등록·수정 API — categoryIds / workIds 설계

**상태:** 브레인스토밍 승인 (2026-05-22)  
**범위:** 서버만 (`server/`). 클라이언트 Admin UI·타입·FormData는 후속 PR.

---

## 1. 배경

- `shop_categories`, `shop_works` M2M 조인 테이블과 JPA 매핑(`ShopEntity.categories`, `ShopEntity.works`)은 존재한다.
- 샵 **조회** 응답에는 `categories: string[]`, `works: WorkSummary[]`가 포함된다.
- 샵 **등록·수정** API(`ShopRequest`, multipart DTO)와 `ShopPersistenceAdapter.save()` / `update()`는 연관 테이블을 갱신하지 않는다.
- Admin에서 카테고리·작품을 셀렉트(멀티 선택)로 고르고, 조인 테이블에 shop PK ↔ category/work PK 매핑을 자유롭게 추가·제거하려면 **쓰기 API**가 필요하다.

---

## 2. 목표

1. 샵 등록·수정(JSON / multipart) 요청에 `categoryIds`, `workIds`를 추가한다.
2. 요청 배열을 **최종 상태**로 보고 `shop_categories` / `shop_works`를 **전체 교체**한다.
3. 카테고리·작품 **0개 허용**. 존재하지 않는 id는 **400 전체 거절**, DB 변경 없음.
4. 기존 응답 형식(`categories`, `works`)은 유지한다.

---

## 3. 비목표

- 클라이언트 Admin 멀티 셀렉트 UI
- 연관 전용 REST (`PUT /shops/{id}/categories` 등)
- PATCH-style 부분 갱신(필드 생략 시 기존 유지)
- 카테고리·작품 **개수 상한** (후속 필요 시 추가)

---

## 4. 설계 결정

### 4.1 API 계약

**대상 엔드포인트 (4곳, 동일 필드):**

| 메서드 | Content-Type | 설명 |
|--------|--------------|------|
| `POST /api/v1/shops` | `application/json` | 등록 |
| `POST /api/v1/shops` | `multipart/form-data` | 등록 + 이미지 |
| `PUT /api/v1/shops/{id}` | `application/json` | 수정 |
| `PUT /api/v1/shops/{id}` | `multipart/form-data` | 수정 + 이미지 |

**요청 필드 추가 (`ShopRequest`, `ShopCreateMultipartRequest`, `ShopUpdateMultipartRequest`):**

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `categoryIds` | `Short[]` / JSON `number[]` | `[]` | `categories.id`. **최종 목록** |
| `workIds` | `Int[]` / JSON `number[]` | `[]` | `works.id`. **최종 목록** |

**JSON 예시:**

```json
{
  "name": "샵 이름",
  "address": "서울시 …",
  "px": 127.0276368,
  "py": 37.4979462,
  "floor": "2F",
  "regionId": 1,
  "status": "UNVERIFIED",
  "visitTip": null,
  "categoryIds": [1, 2],
  "workIds": [10, 20]
}
```

**의미:**

- **등록·수정 공통:** 보낸 배열 = 조인 테이블의 최종 상태.
- **생략:** `[]`와 동일 (연관 없음).
- **`[]`:** 해당 연관 전부 해제.
- **수정:** 기존 조인을 merge하지 않고 **전체 교체** (셀렉트 UI의 현재 선택 상태를 PUT).

**응답:** 변경 없음. `Shop.categories`, `Shop.works`는 `ShopMapper`가 entity에서 기존처럼 매핑.

**multipart:**

- `categoryIds`, `workIds`는 **같은 필드명 반복**으로 전송 (`categoryIds=1&categoryIds=2`).
- Spring `@ModelAttribute`의 `List<Short>?`, `List<Int>?` 바인딩 (`galleryImages` 반복 필드와 동일 패턴).
- 생략 시 `null` → 도메인 변환 시 `emptyList()`.

**권한:** 기존과 동일 — `POST`/`PUT`/`DELETE` `/api/v1/shops/**` → `ROLE_ADMIN`.

---

### 4.2 검증 규칙

| 규칙 | 동작 |
|------|------|
| 중복 id | `400 Bad Request` — `"Duplicate categoryIds: {id}"` 또는 `"Duplicate workIds: {id}"` |
| 존재하지 않는 category id | `400` — `"Unknown category id: {id}"` |
| 존재하지 않는 work id | `400` — `"Unknown work id: {id}"` |
| category·work 모두 invalid | category 검증을 먼저 수행 (work 검증 전에 실패 가능) |
| 0개 | 허용 |
| 개수 상한 | 1차 스펙 없음 |

검증 실패 시 shop row 및 조인 테이블 **모두 미반영** (트랜잭션 롤백).

---

### 4.3 도메인 모델

`Shop` data class에 요청 전달용 필드 추가:

```kotlin
val categoryIds: List<Short> = emptyList(),
val workIds: List<Int> = emptyList(),
```

- `ShopRequest.toDomain()` / multipart `toShop()`에서 위 필드 매핑.
- 응답용 `categories: List<String>`, `works: List<WorkSummary>`는 persistence → mapper 경로 유지 (id 목록과 별개).

---

### 4.4 Persistence

**접근:** `ShopRequest` 확장 + `ShopPersistenceAdapter`에서 M2M 교체 (별도 REST·UseCase 분리 없음).

`save()` / `update()` 공통 흐름:

1. 요청 `categoryIds`에서 중복 검사.
2. `CategoryRepository.findAllById(ids)` — 결과 크기 ≠ 요청 크기면 unknown id → `BadRequestException`.
3. 요청 `workIds`에서 중복 검사.
4. Work 조회 — `JpaRepository<WorkEntity, Int>` (또는 기존 repository를 id-only bulk lookup에 사용). 결과 크기 ≠ 요청 크기면 unknown id → `BadRequestException`.
5. shop 메타 필드 설정 (기존 로직).
6. `entity.categories.clear()` 후 resolved categories `addAll`.
7. `entity.works.clear()` 후 resolved works `addAll`.
8. `shopRepo.save(entity)`.

**트랜잭션:** shop 메타 + M2M 교체는 **단일 `@Transactional`** 내에서 수행.

**`updateShopWithImages`:** 내부에서 `port.update(id, shop)`를 호출하므로 category/work 교체는 **추가 작업 없이** 포함된다.

---

### 4.5 Repository

- `CategoryRepository`: 기존 `JpaRepository<CategoryEntity, Short>` — `findAllById` 사용.
- Work bulk lookup: `WorkEntity` 기준 `JpaRepository<WorkEntity, Int>` interface 추가 (또는 `ShopRepository.kt`에 co-locate). ANIMATION/GAME 구분 없이 `works.id`만 검증하면 된다.

---

### 4.6 에러·경계

- invalid id 메시지는 Admin·API 클라이언트 디버깅용으로 **id 값을 포함**.
- `regionId`와 독립: region은 nullable FK 1개, category/work는 M2M 전체 교체.
- 조회·검색(`GET /shops?category=`, `workId=`) 동작은 변경 없음 — 조인 데이터만 API로 쓸 수 있게 됨.

---

### 4.7 테스트

| 대상 | 검증 내용 |
|------|-----------|
| `ShopPersistenceAdapter` (또는 slice/integration) | create 시 조인 insert; update 시 add/remove; `[]`로 전부 해제; unknown/duplicate id → 예외, DB unchanged |
| `ShopControllerTest` | JSON POST/PUT에 ids 전달 → 응답 `categories`/`works` 반영 |
| `ShopServiceTest` | `updateShopWithImages` 메타-only 경로에서도 ids 반영 (regression) |

---

## 5. 구현 시 터치 예상 파일

- `server/.../adapter/in/web/ShopController.kt` — DTO 필드, `toDomain()`
- `server/.../domain/shop/model/Shop.kt` — `categoryIds`, `workIds`
- `server/.../adapter/out/persistence/ShopPersistenceAdapter.kt` — M2M 교체 + 검증
- `server/.../adapter/out/persistence/repository/ShopRepository.kt` (또는 신규) — `WorkEntity` bulk lookup repository
- `server/.../test/.../ShopControllerTest.kt`
- `server/.../test/.../ShopServiceTest.kt`
- (선택) `ShopPersistenceAdapter` 전용 테스트

---

## 6. 후속 (별도 PR)

- 클라이언트: `ShopRequest` 타입, Admin 폼 멀티 셀렉트, `GET /categories`·`GET /works` 연동, FormData 반복 필드
- 필요 시 category/work 개수 상한

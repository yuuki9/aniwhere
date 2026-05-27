# Shop Reviews & Rating Aggregation Design

**상태:** 구현 동기화 완료 (2026-05-28)  
**범위:** `server` — 샵별 리뷰 도메인 신규, shops 응답 집계 필드 추가  
**DDL 단일 기준:** `D:\codebase\aniwhere-sql-ddl\` (`SERVER_SCHEMA_SYNC.md` 동기화 규칙 따름)  
**비범위 (다음 PR):** 기존 커뮤니티 `posts` / `/api/v1/posts/**` 제거, 클라이언트 UI

---

## 1. 배경·목표

Aniwhere는 샵 탐색 시 **평균 별점·리뷰 수**로 방문 결정을 돕는다. 기존 `posts`(커뮤니티) API는 샵과 연결되지 않았고, 서비스에서 더 이상 사용하지 않기로 결정했다. 이번 PR에서는 **`shop_reviews` 신규 도메인**을 도입하고, 기존 shops API 응답에 집계 필드를 추가한다.

### 확정된 제품 규칙

| 항목 | 결정 |
|---|---|
| 집계 반영 | 리뷰 작성 즉시 `averageRating` / `reviewCount` 반영 |
| 관리자 조치 | `HIDDEN` / `DELETED` 리뷰는 집계에서 **제외** |
| 리뷰 형태 | 1~5 별점 + 긴 텍스트 + 사진(리뷰당 최대 5장) |
| 작성 제한 | 샵당 **무제한** (1인 1샵 1리뷰 제한 없음) |
| shop ↔ review | **1:N**, 별도 릴레이션(중간) 테이블 **불필요** (`shop_reviews.shop_id` FK) |
| Post/커뮤니티 | 다음 PR에서 제거; 이번 PR에서는 **유지** |

---

## 2. 아키텍처

### 2.1 패키지 구조 (신규)

```
domain/shopreview/
  model/ShopReview.kt, ShopReviewImage.kt, ShopReviewStatus.kt
  port/in/ShopReviewUseCase.kt
  port/out/ShopReviewPersistencePort.kt, ShopReviewImageStoragePort.kt
  service/ShopReviewService.kt

adapter/in/web/
  ShopReviewController.kt
  AdminShopReviewController.kt (status 변경)

adapter/out/persistence/
  ShopReviewPersistenceAdapter.kt
  entity/ShopReviewEntity.kt, ShopReviewImageEntity.kt
  repository/ShopReviewRepository.kt
  mapper/ShopReviewMapper.kt
```

기존 `domain/review`(Post/Comment)는 이번 PR에서 수정하지 않는다.

### 2.2 shops 도메인 확장

- `Shop` 모델·`ShopEntity`·`ShopMapper`에 `averageRating`, `reviewCount` 추가
- `ShopReviewService`(또는 전용 `ShopRatingAggregator`)가 리뷰 write 시 `shops` 집계 컬럼 동기 갱신

### 2.3 관계 다이어그램

```
shops (1) ──< shop_reviews (N) ──< shop_review_images (N)
         shop_id FK              review_id FK
```

---

## 3. 스키마

### 3.0 DDL 저장소 (`aniwhere-sql-ddl`)

운영·부트스트랩 DDL은 **`D:\codebase\aniwhere-sql-ddl`** 에 작성한다. 서버 `src/main/resources/schema-*.sql` 은 테스트/로컬 참조용으로 **동일 내용**을 유지하거나 ddl-ddl 저장소를 import하는 방향으로 맞춘다.

| 파일 | 작업 |
|---|---|
| `user/03_shop_reviews.sql` | **갱신** — legacy 스키마를 본 설계에 맞게 재작성 (`user_id` → `author_user_id`, `status`, `updated_at` 등) |
| `shop/07_shop_review_images.sql` | **신규** |
| `shop/01_shops.sql` | **갱신** — `average_rating`, `review_count` 컬럼 추가 (신규 DB 부트스트랩) |
| `migration/2026-05-28_shop_reviews_and_rating.sql` | **신규** — 기존 운영 DB용 ALTER + CREATE |
| `apply_order.txt` | **갱신** — `user/03_shop_reviews.sql`, `shop/07_shop_review_images.sql` 추가 (`user/05` 다음, `community/*` 이전) |
| `SERVER_SCHEMA_SYNC.md` | **갱신** — `shop_reviews`를 legacy에서 active 동기화 대상으로 이동 |

**Legacy 참고:** `user/03_shop_reviews.sql` 은 예전에 `apply_order.txt` 에서 제외된 상태였다. 이번 작업에서 설계에 맞게 **재활성화**한다.

### 3.1 `shop_reviews`

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | BIGINT PK AI | |
| `shop_id` | BIGINT NOT NULL | FK → `shops(id)` |
| `author_user_id` | BIGINT NOT NULL | FK → `users(id)` |
| `rating` | TINYINT NOT NULL | 1~5 |
| `content` | TEXT NOT NULL | |
| `status` | VARCHAR(20) NOT NULL DEFAULT `'VISIBLE'` | `VISIBLE`, `HIDDEN`, `DELETED` |
| `created_at` | DATETIME NOT NULL | |
| `updated_at` | DATETIME NOT NULL | |

인덱스:
- `idx_shop_reviews_shop_status_created (shop_id, status, created_at DESC)`
- `idx_shop_reviews_author_user (author_user_id)`

### 3.2 `shop_review_images`

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | BIGINT PK AI | |
| `review_id` | BIGINT NOT NULL | FK → `shop_reviews(id)` ON DELETE CASCADE |
| `s3_key` | VARCHAR(500) NOT NULL | |
| `sort_order` | INT NOT NULL | 0-based |

### 3.3 `shops` ALTER

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `average_rating` | DECIMAL(3,2) NULL | `VISIBLE` 리뷰 0개면 NULL |
| `review_count` | INT NOT NULL DEFAULT 0 | `VISIBLE` 리뷰 수 |

테스트 스키마(`server/src/test/resources/test-shop-facets-schema.sql` 등)에도 **ddl-ddl과 동일**하게 반영.

### 3.4 기존 DB 마이그레이션 (`migration/2026-05-28_shop_reviews_and_rating.sql`)

```sql
-- shops 집계 컬럼
ALTER TABLE shops
    ADD COLUMN average_rating DECIMAL(3,2) NULL AFTER updated_at,
    ADD COLUMN review_count INT NOT NULL DEFAULT 0 AFTER average_rating;

-- shop_reviews (기존 legacy 테이블 있으면 DROP 후 재생성 또는 ALTER — 운영 데이터 없음 가정)
-- shop_review_images CREATE
```

운영 DB에 legacy `shop_reviews`( `user_id` 컬럼) 데이터가 있으면 마이그레이션 전 백업·확인. 없으면 `DROP TABLE IF EXISTS shop_reviews` 후 신규 CREATE.

---

## 4. API 계약

### 4.1 Shops 응답 확장

**대상:** `GET /api/v1/shops`, `GET /api/v1/shops/{id}`

`Shop` JSON에 필드 추가:

```json
{
  "averageRating": 4.25,
  "reviewCount": 12
}
```

- 리뷰 없음: `"averageRating": null`, `"reviewCount": 0`
- 소수: `DECIMAL(3,2)` → JSON number (예: 4.25)

### 4.2 Shop Reviews

Base path: `/api/v1/shops/{shopId}/reviews`

| Method | Path | Auth | 설명 |
|---|---|---|---|
| GET | `/api/v1/shops/{shopId}/reviews` | 공개 | `VISIBLE`만, 페이징, `created_at DESC` |
| POST | `/api/v1/shops/{shopId}/reviews` | Bearer | multipart: rating, content, images(0~5) |
| PATCH | `/api/v1/shops/{shopId}/reviews/{reviewId}` | Bearer (작성자) | rating/content/이미지 수정 |
| DELETE | `/api/v1/shops/{shopId}/reviews/{reviewId}` | Bearer (작성자) | soft delete → `DELETED` |
| PATCH | `/api/v1/admin/shops/{shopId}/reviews/{reviewId}/status` | Bearer (admin) | body: `{ "status": "HIDDEN" \| "VISIBLE" \| "DELETED" }` |

#### GET 목록 쿼리

- Spring `Pageable` (기존 shops/search와 동일 패턴, default `size=20`)
- 존재하지 않는 `shopId` → 404

#### POST/PATCH multipart 필드

| 필드 | 필수 | 설명 |
|---|---|---|
| `rating` | POST 필수 | 1~5 정수 |
| `content` | POST 필수 | trim 후 비어 있으면 400 |
| `images` | 선택 | 0~5장, `image/*` only |

PATCH 시 omitted 필드는 기존 값 유지. 이미지 교체 정책: **전체 교체** (새 `images` 파트가 있으면 기존 S3 객체 삭제 후 재등록).

#### ShopReview 응답 DTO

```json
{
  "id": 10,
  "shopId": 1,
  "authorUserId": 5,
  "authorNickname": "닉네임",
  "rating": 4,
  "content": "방문 후기 본문",
  "status": "VISIBLE",
  "images": [
    {
      "id": 1,
      "url": "/api/v1/shop-images/1/reviews/10/abc.jpg",
      "sortOrder": 0
    }
  ],
  "createdAt": "2026-05-28T12:00:00",
  "updatedAt": "2026-05-28T12:00:00"
}
```

공개 GET 목록/단건에서는 `status` 필드 생략 가능 (항상 `VISIBLE`만 노출).

### 4.3 Security

| 경로 | 정책 |
|---|---|
| `GET /api/v1/shops/**/reviews` | `permitAll` |
| `POST/PATCH/DELETE .../reviews` | 인증 필수 |
| `PATCH /api/v1/admin/**` | admin role |

---

## 5. 집계 로직

### 5.1 포함 조건

`status = 'VISIBLE'` 인 리뷰만:

```sql
SELECT AVG(rating), COUNT(*)
FROM shop_reviews
WHERE shop_id = ? AND status = 'VISIBLE'
```

### 5.2 갱신 트리거

| 이벤트 | 동작 |
|---|---|
| POST (신규, VISIBLE) | 집계 재계산 |
| PATCH rating 변경 | 집계 재계산 |
| DELETE (작성자 → DELETED) | 집계 재계산 |
| admin status → HIDDEN / DELETED | 집계 재계산 |
| admin status → VISIBLE | 집계 재계산 |

리뷰 write와 `shops` 집계 UPDATE는 **단일 트랜잭션**에서 수행.

### 5.3 결과

- `review_count = 0` → `average_rating = NULL`
- 그 외 → `average_rating = ROUND(AVG(rating), 2)` (DECIMAL(3,2))

---

## 6. 이미지 저장

- 기존 `ShopImagesS3Properties` 버킷 재사용
- S3 key: `{shopId}/reviews/{reviewId}/{uuid}.{ext}`
- 업로드/삭제: 기존 `S3ShopImageStorageAdapter` 패턴 재사용 (포트 분리 또는 공유 storage port)
- 조회 URL: `/api/v1/shop-images/{shopId}/reviews/{reviewId}/{filename}`  
  → `ShopImageController` 경로 패턴 확장 또는 전용 `ShopReviewImageController`

검증:
- 최대 5장
- content-type `image/*`
- 파일명 `..`, `/` 포함 시 400

---

## 7. 에러·검증

| 조건 | HTTP |
|---|---|
| rating ∉ [1,5] | 400 |
| content blank | 400 |
| images > 5 | 400 |
| non-image upload | 400 |
| shop 없음 | 404 |
| review 없음 / shopId 불일치 | 404 |
| 타인 리뷰 수정·삭제 | 403 |
| 비-admin status 변경 | 403 |
| 미인증 write | 401 |

---

## 8. 테스트

| 대상 | 내용 |
|---|---|
| `ShopReviewServiceTest` | 집계 재계산: 생성, HIDDEN, DELETED, rating 수정, VISIBLE 복구 |
| `ShopReviewControllerTest` | GET 페이징, POST validation, auth 401/403 |
| `ShopControllerTest` / mapper | shops 응답에 `averageRating`, `reviewCount` |
| persistence integration | FK, cascade delete on review images |

기존 Post/Comment 테스트는 이번 PR에서 **삭제하지 않음**.

---

## 9. 후속 작업 (다음 PR)

1. `posts`, `comments`, `post_likes` 테이블 및 `/api/v1/posts/**` API 제거
2. `domain/review` 패키지 삭제
3. `docs/product-decisions.md` — 커뮤니티 미사용·샵 리뷰 정책 반영
4. 클라이언트: `/community` 제거, 지도/샵 상세 → `shop_reviews` API 연동

---

## 10. 구현 순서 (권장)

1. **`aniwhere-sql-ddl`**: `user/03`, `shop/07`, `shop/01`, `migration/2026-05-28_*`, `apply_order.txt`, `SERVER_SCHEMA_SYNC.md`
2. **server 테스트 DDL** 동기화 + JPA Entity + Repository
3. ShopReviewService + 집계 갱신
4. ShopReviewController (GET → POST → PATCH/DELETE → admin)
5. Shop 모델/Mapper/Controller 집계 필드 노출
6. 이미지 업로드·URL 서빙
7. 테스트

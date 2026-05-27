# Shop Reviews & Rating Aggregation Implementation Plan

**구현 완료** (2026-05-28) — Tasks 1–9 server 측 구현·테스트·문서 동기화 완료.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 샵별 리뷰(`shop_reviews`) 도메인을 추가하고, `GET /api/v1/shops`·`GET /api/v1/shops/{id}` 응답에 `averageRating`/`reviewCount`를 노출하며, `/api/v1/shops/{shopId}/reviews` CRUD·관리자 status API를 제공한다.

**Architecture:** DDL은 `D:\codebase\aniwhere-sql-ddl` 단일 기준. 서버는 hexagonal 패턴(`domain/shopreview` + persistence adapter)으로 구현하고, `VISIBLE` 리뷰만 집계에 포함한다. 리뷰 write와 `shops.average_rating`/`review_count` 갱신은 단일 트랜잭션. S3 이미지는 기존 shop-images 버킷·어댑터 패턴 재사용. 기존 `posts` API는 이번 PR에서 **유지**.

**Tech Stack:** MySQL DDL, Kotlin, Spring Boot Web, Spring Data JPA, MockK, Spring MockMvc, AWS S3 SDK

**Spec:** `server/docs/superpowers/specs/2026-05-28-shop-reviews-design.md`

---

## Scope Check

한 기능(샵 리뷰 + shops 집계)이지만 **저장소가 2개**다. 커밋은 분리한다.

1. `aniwhere-sql-ddl` — DDL·migration·apply_order
2. `aniwhere/server` — JPA·API·테스트

Post/커뮤니티 제거·클라이언트 UI는 **범위 밖**.

## File Structure (변경 책임 맵)

### aniwhere-sql-ddl

| 파일 | 책임 |
|---|---|
| `user/03_shop_reviews.sql` | `shop_reviews` 부트스트랩 CREATE |
| `shop/07_shop_review_images.sql` | `shop_review_images` CREATE |
| `shop/01_shops.sql` | `average_rating`, `review_count` 컬럼 |
| `migration/2026-05-28_shop_reviews_and_rating.sql` | 기존 DB ALTER/CREATE |
| `apply_order.txt` | `user/03`, `shop/07` 추가 |
| `SERVER_SCHEMA_SYNC.md` | legacy → active 매핑 |

### aniwhere/server

| 파일 | 책임 |
|---|---|
| `domain/shopreview/model/*.kt` | 도메인 모델·enum |
| `domain/shopreview/port/in/ShopReviewUseCase.kt` | 유스케이스 |
| `domain/shopreview/port/out/ShopReviewPersistencePort.kt` | persistence 포트 |
| `domain/shopreview/service/ShopReviewService.kt` | 비즈니스·집계 |
| `adapter/out/persistence/entity/ShopReviewEntity.kt` | JPA 엔티티 |
| `adapter/out/persistence/repository/ShopReviewRepository.kt` | Spring Data |
| `adapter/out/persistence/mapper/ShopReviewMapper.kt` | entity ↔ domain |
| `adapter/out/persistence/ShopReviewPersistenceAdapter.kt` | 포트 구현·집계 SQL |
| `adapter/in/web/ShopReviewController.kt` | 공개/작성 API |
| `adapter/in/web/AdminShopReviewController.kt` | admin status |
| `adapter/in/web/ShopImageController.kt` | review 이미지 GET 경로 확장 |
| `domain/shop/model/Shop.kt` | `averageRating`, `reviewCount` |
| `adapter/out/persistence/entity/ShopEntity.kt` | 집계 컬럼 |
| `adapter/out/persistence/mapper/ShopMapper.kt` | 집계 매핑 |
| `config/security/SecurityConfig.kt` | reviews GET permitAll, write auth, admin |
| `src/test/resources/test-shop-facets-schema.sql` | 테스트 DDL 동기화 |
| `src/test/resources/test-shop-reviews-schema.sql` | (신규) reviews 전용 테스트 DDL |
| `src/test/kotlin/.../ShopReviewServiceTest.kt` | 집계·CRUD 단위 테스트 |
| `src/test/kotlin/.../ShopReviewControllerTest.kt` | 웹 계약 테스트 |
| `src/test/kotlin/.../ShopControllerTest.kt` | shops 집계 필드 JSON |

---

### Task 1: DDL — `aniwhere-sql-ddl` 스키마 추가

**Files:**
- Modify: `D:\codebase\aniwhere-sql-ddl\user\03_shop_reviews.sql`
- Create: `D:\codebase\aniwhere-sql-ddl\shop\07_shop_review_images.sql`
- Modify: `D:\codebase\aniwhere-sql-ddl\shop\01_shops.sql`
- Create: `D:\codebase\aniwhere-sql-ddl\migration\2026-05-28_shop_reviews_and_rating.sql`
- Modify: `D:\codebase\aniwhere-sql-ddl\apply_order.txt`
- Modify: `D:\codebase\aniwhere-sql-ddl\SERVER_SCHEMA_SYNC.md`

- [ ] **Step 1: `user/03_shop_reviews.sql` 재작성**

```sql
-- Domain: user — 테이블: shop_reviews
-- After: user/01_users.sql, shop/01_shops.sql
USE aniwhere;

CREATE TABLE shop_reviews (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    shop_id          BIGINT       NOT NULL,
    author_user_id   BIGINT       NOT NULL,
    rating           TINYINT      NOT NULL,
    content          TEXT         NOT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'VISIBLE',
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_shop_reviews_shop_status_created (shop_id, status, created_at DESC),
    KEY idx_shop_reviews_author_user (author_user_id),
    CONSTRAINT fk_shop_reviews_shop FOREIGN KEY (shop_id) REFERENCES shops (id) ON DELETE CASCADE,
    CONSTRAINT fk_shop_reviews_author_user FOREIGN KEY (author_user_id) REFERENCES users (id),
    CONSTRAINT chk_shop_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_shop_reviews_status CHECK (status IN ('VISIBLE', 'HIDDEN', 'DELETED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 2: `shop/07_shop_review_images.sql` 생성**

```sql
-- Domain: shop — 테이블: shop_review_images
-- After: user/03_shop_reviews.sql
USE aniwhere;

CREATE TABLE shop_review_images (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    review_id   BIGINT       NOT NULL,
    s3_key      VARCHAR(500) NOT NULL,
    sort_order  INT          NOT NULL,
    PRIMARY KEY (id),
    KEY idx_shop_review_images_review (review_id),
    CONSTRAINT fk_shop_review_images_review FOREIGN KEY (review_id) REFERENCES shop_reviews (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 3: `shop/01_shops.sql`에 집계 컬럼 추가**

`updated_at` 다음에 추가:

```sql
    average_rating DECIMAL(3,2) DEFAULT NULL,
    review_count   INT          NOT NULL DEFAULT 0,
```

- [ ] **Step 4: migration 파일 생성**

```sql
USE aniwhere;

ALTER TABLE shops
    ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) NULL AFTER updated_at,
    ADD COLUMN IF NOT EXISTS review_count INT NOT NULL DEFAULT 0 AFTER average_rating;

DROP TABLE IF EXISTS shop_review_images;
DROP TABLE IF EXISTS shop_reviews;

-- 이후 user/03, shop/07 CREATE 문 그대로 붙여넣기
```

- [ ] **Step 5: `apply_order.txt` 갱신**

`user/05_user_favorite_shops.sql` 다음, `community/01_posts.sql` 이전에 추가:

```text
user/03_shop_reviews.sql
shop/07_shop_review_images.sql
```

- [ ] **Step 6: `SERVER_SCHEMA_SYNC.md` 갱신**

§4 표에 추가하고 legacy §에서 `user/03_shop_reviews.sql` 제거:

```markdown
| `user/03_shop_reviews.sql` | `ShopReviewEntity` → `shop_reviews` |
| `shop/07_shop_review_images.sql` | `ShopReviewImageEntity` → `shop_review_images` |
```

- [ ] **Step 7: Commit (ddl repo)**

```bash
cd D:/codebase/aniwhere-sql-ddl
git add user/03_shop_reviews.sql shop/07_shop_review_images.sql shop/01_shops.sql migration/2026-05-28_shop_reviews_and_rating.sql apply_order.txt SERVER_SCHEMA_SYNC.md
git commit -m "feat(ddl): shop_reviews·집계 컬럼 및 migration 추가"
```

---

### Task 2: 서버 테스트 DDL + JPA 엔티티

**Files:**
- Modify: `server/src/test/resources/test-shop-facets-schema.sql`
- Create: `server/src/test/resources/test-shop-reviews-schema.sql`
- Create: `server/src/main/kotlin/com/aniwhere/server/domain/shopreview/model/ShopReviewModels.kt`
- Create: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/ShopReviewEntity.kt`
- Create: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/ShopReviewRepository.kt`

- [ ] **Step 1: `test-shop-facets-schema.sql` shops 테이블에 컬럼 추가**

```sql
    average_rating DECIMAL(3, 2),
    review_count INT NOT NULL DEFAULT 0,
```

- [ ] **Step 2: `test-shop-reviews-schema.sql` 생성 (H2/integration용)**

Task 1 DDL과 동일 구조. `users` FK 필요 시 `test-auth-schema.sql` 선행 로드 확인.

- [ ] **Step 3: 도메인 모델 작성**

```kotlin
// domain/shopreview/model/ShopReviewModels.kt
package com.aniwhere.server.domain.shopreview.model

import java.math.BigDecimal
import java.time.LocalDateTime

enum class ShopReviewStatus { VISIBLE, HIDDEN, DELETED }

data class ShopReviewImage(
    val id: Long? = null,
    val url: String,
    val sortOrder: Int,
)

data class ShopReview(
    val id: Long? = null,
    val shopId: Long,
    val authorUserId: Long,
    val authorNickname: String,
    val rating: Int,
    val content: String,
    val status: ShopReviewStatus = ShopReviewStatus.VISIBLE,
    val images: List<ShopReviewImage> = emptyList(),
    val createdAt: LocalDateTime? = null,
    val updatedAt: LocalDateTime? = null,
)

data class ShopRatingAggregate(
    val averageRating: BigDecimal?,
    val reviewCount: Int,
)
```

- [ ] **Step 4: JPA 엔티티 작성**

```kotlin
// entity/ShopReviewEntity.kt
@Entity
@Table(name = "shop_reviews")
class ShopReviewEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    @Column(name = "shop_id", nullable = false) val shopId: Long,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_user_id", nullable = false)
    val author: UserEntity,
    @Column(nullable = false) var rating: Int,
    @Column(nullable = false, columnDefinition = "TEXT") var content: String,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20) var status: ShopReviewStatusEnum = ShopReviewStatusEnum.VISIBLE,
    @OneToMany(mappedBy = "review", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    var images: MutableList<ShopReviewImageEntity> = mutableListOf(),
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)

enum class ShopReviewStatusEnum { VISIBLE, HIDDEN, DELETED }

@Entity
@Table(name = "shop_review_images")
class ShopReviewImageEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    val review: ShopReviewEntity,
    @Column(name = "s3_key", nullable = false, length = 500) val s3Key: String,
    @Column(name = "sort_order", nullable = false) val sortOrder: Int,
)
```

- [ ] **Step 5: `ShopEntity`에 집계 필드 추가**

```kotlin
@Column(name = "average_rating", precision = 3, scale = 2)
var averageRating: BigDecimal? = null,
@Column(name = "review_count", nullable = false)
var reviewCount: Int = 0,
```

- [ ] **Step 6: Repository 작성**

```kotlin
interface ShopReviewRepository : JpaRepository<ShopReviewEntity, Long> {
    fun findByShopIdAndStatusOrderByCreatedAtDesc(
        shopId: Long,
        status: ShopReviewStatusEnum,
        pageable: Pageable,
    ): Page<ShopReviewEntity>

    fun findByIdAndShopId(id: Long, shopId: Long): ShopReviewEntity?
}
```

- [ ] **Step 7: Commit**

```bash
cd D:/codebase/aniwhere
git add server/src/test/resources/test-shop-facets-schema.sql server/src/test/resources/test-shop-reviews-schema.sql server/src/main/kotlin/com/aniwhere/server/domain/shopreview/ server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/ShopReviewEntity.kt server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/ShopReviewRepository.kt server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/ShopEntity.kt
git commit -m "feat(server): shop_reviews JPA 엔티티 및 테스트 DDL 추가"
```

---

### Task 3: Shops 응답 집계 필드 (`averageRating`, `reviewCount`)

**Files:**
- Modify: `server/src/main/kotlin/com/aniwhere/server/domain/shop/model/Shop.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/mapper/ShopMapper.kt`
- Modify: `server/src/test/kotlin/com/aniwhere/server/adapter/in/web/ShopControllerTest.kt`

- [ ] **Step 1: 실패하는 컨트롤러 테스트 추가**

```kotlin
@Test
fun `GET shops_{id} - averageRating과 reviewCount를 반환한다`() {
    every { useCase.getShop(1L) } returns sampleShop.copy(
        averageRating = BigDecimal("4.25"),
        reviewCount = 12,
    )
    mvc.perform(get("/api/v1/shops/1"))
        .andExpect(status().isOk)
        .andExpect(jsonPath("$.data.averageRating").value(4.25))
        .andExpect(jsonPath("$.data.reviewCount").value(12))
}
```

- [ ] **Step 2: 테스트 실행 후 실패 확인**

Run: `cd server; .\gradlew.bat test --tests "com.aniwhere.server.adapter.in.web.ShopControllerTest.GET shops_*averageRating*"`

Expected: FAIL (`averageRating` unresolved 또는 JSON path missing)

- [ ] **Step 3: `Shop` 도메인·Mapper 수정**

```kotlin
// Shop.kt
val averageRating: BigDecimal? = null,
val reviewCount: Int = 0,

// ShopMapper.toDomain
averageRating = e.averageRating,
reviewCount = e.reviewCount,
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd server; .\gradlew.bat test --tests "com.aniwhere.server.adapter.in.web.ShopControllerTest"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(server): Shop 응답에 averageRating·reviewCount 추가"
```

---

### Task 4: 집계 재계산 persistence + Service

**Files:**
- Create: `server/src/main/kotlin/com/aniwhere/server/domain/shopreview/port/out/ShopReviewPersistencePort.kt`
- Create: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/ShopReviewPersistenceAdapter.kt`
- Create: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/mapper/ShopReviewMapper.kt`
- Create: `server/src/main/kotlin/com/aniwhere/server/domain/shopreview/service/ShopReviewService.kt`
- Create: `server/src/test/kotlin/com/aniwhere/server/domain/shopreview/service/ShopReviewServiceTest.kt`

- [ ] **Step 1: persistence port 정의**

```kotlin
interface ShopReviewPersistencePort {
    fun existsShop(shopId: Long): Boolean
    fun save(review: ShopReview): ShopReview
    fun findVisibleByShopId(shopId: Long, pageable: Pageable): Page<ShopReview>
    fun findByIdAndShopId(reviewId: Long, shopId: Long): ShopReview?
    fun update(reviewId: Long, review: ShopReview): ShopReview
    fun updateStatus(reviewId: Long, shopId: Long, status: ShopReviewStatus): ShopReview
    fun recomputeShopRating(shopId: Long): ShopRatingAggregate
}
```

- [ ] **Step 2: 집계 실패 테스트 작성**

```kotlin
@Test
fun `createReview - VISIBLE 리뷰 저장 후 shops 집계를 갱신한다`() {
    every { port.existsShop(1L) } returns true
    every { port.save(any()) } answers { firstArg() }
    every { port.recomputeShopRating(1L) } returns ShopRatingAggregate(BigDecimal("4.50"), 2)

    val saved = service.createReview(
        authorUserId = 10L,
        shopId = 1L,
        rating = 5,
        content = "좋아요",
        images = emptyList(),
    )

    assertEquals(5, saved.rating)
    verify { port.recomputeShopRating(1L) }
}
```

- [ ] **Step 3: `recomputeShopRating` 구현 (Adapter)**

```kotlin
override fun recomputeShopRating(shopId: Long): ShopRatingAggregate {
    val shop = shopRepo.findByIdOrNull(shopId) ?: throw EntityNotFoundException("Shop not found: $shopId")
    val visible = ShopReviewStatusEnum.VISIBLE
    val avg = reviewRepo.calculateAverageRating(shopId, visible)
    val count = reviewRepo.countByShopIdAndStatus(shopId, visible).toInt()
    shop.averageRating = avg
    shop.reviewCount = count
    return ShopRatingAggregate(averageRating = avg, reviewCount = count)
}
```

Repository에 추가:

```kotlin
@Query("SELECT AVG(r.rating) FROM ShopReviewEntity r WHERE r.shopId = :shopId AND r.status = :status")
fun calculateAverageRating(shopId: Long, status: ShopReviewStatusEnum): BigDecimal?

fun countByShopIdAndStatus(shopId: Long, status: ShopReviewStatusEnum): Long
```

- [ ] **Step 4: Service — create/update/delete/status 후 항상 `recomputeShopRating` 호출**

```kotlin
@Transactional
fun createReview(...): ShopReview {
    if (!port.existsShop(shopId)) throw EntityNotFoundException("Shop not found: $shopId")
    validateRating(rating)
    validateContent(content)
    val saved = port.save(...)
    port.recomputeShopRating(shopId)
    return saved
}
```

- [ ] **Step 5: HIDDEN/DELETED 시 집계 제외 테스트 추가**

```kotlin
@Test
fun `updateReviewStatus - HIDDEN으로 바꾸면 recomputeShopRating 호출`() {
    every { port.updateStatus(5L, 1L, ShopReviewStatus.HIDDEN) } returns sampleReview
    every { port.recomputeShopRating(1L) } returns ShopRatingAggregate(null, 0)

    service.updateReviewStatus(adminUserId = 1L, shopId = 1L, reviewId = 5L, ShopReviewStatus.HIDDEN)

    verify { port.recomputeShopRating(1L) }
}
```

- [ ] **Step 6: 테스트 실행**

Run: `cd server; .\gradlew.bat test --tests "com.aniwhere.server.domain.shopreview.service.ShopReviewServiceTest"`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git commit -am "feat(server): shop review 집계 재계산 서비스 추가"
```

---

### Task 5: GET `/api/v1/shops/{shopId}/reviews`

**Files:**
- Create: `server/src/main/kotlin/com/aniwhere/server/domain/shopreview/port/in/ShopReviewUseCase.kt`
- Create: `server/src/main/kotlin/com/aniwhere/server/adapter/in/web/ShopReviewController.kt`
- Create: `server/src/test/kotlin/com/aniwhere/server/adapter/in/web/ShopReviewControllerTest.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/config/security/SecurityConfig.kt`

- [ ] **Step 1: 실패하는 GET 테스트**

```kotlin
@WebMvcTest(ShopReviewController::class)
@AutoConfigureMockMvc(addFilters = false)
class ShopReviewControllerTest {
    @MockkBean lateinit var useCase: ShopReviewUseCase

    @Test
    fun `GET shop reviews - VISIBLE 리뷰 페이지를 반환`() {
        every { useCase.listReviews(1L, any()) } returns PageImpl(
            listOf(sampleReview),
            PageRequest.of(0, 20),
            1,
        )
        mvc.perform(get("/api/v1/shops/1/reviews"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.content[0].rating").value(4))
            .andExpect(jsonPath("$.data.content[0].authorNickname").value("테스트"))
    }
}
```

- [ ] **Step 2: Controller 최소 구현**

```kotlin
@RestController
@RequestMapping("/api/v1/shops/{shopId}/reviews")
class ShopReviewController(private val useCase: ShopReviewUseCase) {
    @GetMapping
    fun listReviews(
        @PathVariable shopId: Long,
        @PageableDefault(size = 20) pageable: Pageable,
    ) = ApiResponse.ok(useCase.listReviews(shopId, pageable))
}
```

- [ ] **Step 3: Security — GET reviews는 이미 `GET /api/v1/shops/**` permitAll에 포함됨. POST/PATCH/DELETE는 authenticated.**

```kotlin
it.requestMatchers(HttpMethod.POST, "/api/v1/shops/*/reviews").authenticated()
it.requestMatchers(HttpMethod.PATCH, "/api/v1/shops/*/reviews/**").authenticated()
it.requestMatchers(HttpMethod.DELETE, "/api/v1/shops/*/reviews/**").authenticated()
it.requestMatchers(HttpMethod.PATCH, "/api/v1/admin/shops/*/reviews/**").hasAuthority("ROLE_ADMIN")
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd server; .\gradlew.bat test --tests "com.aniwhere.server.adapter.in.web.ShopReviewControllerTest"`

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(server): GET /shops/{shopId}/reviews API 추가"
```

---

### Task 6: POST 리뷰 작성 (multipart + S3)

**Files:**
- Modify: `ShopReviewController.kt`
- Modify: `ShopReviewService.kt`
- Reuse: `S3ShopImageStorageAdapter.kt`, `ShopImagesS3Properties.kt`
- Modify: `ShopReviewControllerTest.kt`

- [ ] **Step 1: POST validation 실패 테스트**

```kotlin
@Test
fun `POST shop review - rating 없으면 400`() {
    mvc.perform(
        multipart("/api/v1/shops/1/reviews")
            .param("content", "본문")
            .with(authUser(10L)),
    ).andExpect(status().isBadRequest)
}
```

- [ ] **Step 2: POST 성공 테스트 (useCase mock)**

```kotlin
@Test
fun `POST shop review - rating content images를 useCase로 전달`() {
    every { useCase.createReview(any(), any(), any(), any(), any()) } returns sampleReview
    val image = MockMultipartFile("images", "a.jpg", "image/jpeg", byteArrayOf(1, 2, 3))
    mvc.perform(
        multipart("/api/v1/shops/1/reviews")
            .file(image)
            .param("rating", "5")
            .param("content", "  좋았어요  ")
            .with(authUser(10L)),
    ).andExpect(status().isCreated)
}
```

- [ ] **Step 3: Service 이미지 업로드 구현**

S3 key: `"$shopId/reviews/$reviewId/${UUID.randomUUID()}.$ext"`

```kotlin
private fun uploadReviewImages(shopId: Long, reviewId: Long, parts: List<ImageUploadPart>): List<ShopReviewImage> {
    if (parts.size > MAX_REVIEW_IMAGES) throw BadRequestException("리뷰 이미지는 최대 ${MAX_REVIEW_IMAGES}장")
    parts.forEach { validateImageUploadPart(it) }
    // putObject + persistence rows
}
```

- [ ] **Step 4: Controller POST**

```kotlin
@PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
@ResponseStatus(HttpStatus.CREATED)
fun createReview(
    @PathVariable shopId: Long,
    @RequestParam rating: Int,
    @RequestParam content: String,
    @RequestPart(required = false) images: List<MultipartFile>?,
) = ApiResponse.ok(useCase.createReview(currentUserId(), shopId, rating, content.trim(), images.orEmpty()))
```

- [ ] **Step 5: 테스트·Commit**

Run tests → commit: `feat(server): POST /shops/{shopId}/reviews multipart 작성 API`

---

### Task 7: PATCH/DELETE (작성자) + Admin status

**Files:**
- Modify: `ShopReviewController.kt`
- Create: `AdminShopReviewController.kt`
- Modify: `ShopReviewService.kt`, `ShopReviewServiceTest.kt`, `ShopReviewControllerTest.kt`

- [ ] **Step 1: 작성자 DELETE soft-delete 테스트**

```kotlin
@Test
fun `DELETE shop review - 작성자가 아니면 403`() {
    every { useCase.deleteReview(11L, 1L, 5L) } throws ForbiddenException("...")
    mvc.perform(delete("/api/v1/shops/1/reviews/5").with(authUser(11L)))
        .andExpect(status().isForbidden)
}
```

- [ ] **Step 2: Service ownership 검증**

```kotlin
private fun requireAuthor(actorUserId: Long, authorUserId: Long) {
    if (actorUserId != authorUserId) throw ForbiddenException("Not review author")
}
```

DELETE는 `status = DELETED` + S3 이미지는 유지(감사) 또는 삭제 — **spec: soft delete, 집계 제외**. 이미지 S3는 orphan 정리하지 않음(YAGNI).

- [ ] **Step 3: Admin controller**

```kotlin
@RestController
@RequestMapping("/api/v1/admin/shops/{shopId}/reviews")
class AdminShopReviewController(private val useCase: ShopReviewUseCase) {
    @PatchMapping("/{reviewId}/status")
    fun updateStatus(
        @PathVariable shopId: Long,
        @PathVariable reviewId: Long,
        @Valid @RequestBody req: ShopReviewStatusRequest,
    ) = ApiResponse.ok(useCase.updateReviewStatus(currentUserId(), shopId, reviewId, req.status))
}

data class ShopReviewStatusRequest(val status: ShopReviewStatus)
```

- [ ] **Step 4: PATCH multipart (rating/content/images 전체 교체) 구현**

- [ ] **Step 5: 테스트·Commit**

`feat(server): shop review 수정·삭제·admin status API`

---

### Task 8: Review 이미지 GET 경로

**Files:**
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/in/web/ShopImageController.kt`
- Create or modify test in `ShopImageControllerTest.kt`

- [ ] **Step 1: 실패 테스트**

```kotlin
@Test
fun `getShopReviewImage - reviews 경로로 S3 객체를 스트리밍한다`() {
    every { imageStorage.getObject("1/reviews/10/abc.jpg") } returns storedImage
    mvc.perform(get("/api/v1/shop-images/1/reviews/10/abc.jpg"))
        .andExpect(status().isOk)
}
```

- [ ] **Step 2: Controller 경로 추가**

```kotlin
@GetMapping("/{shopId}/reviews/{reviewId}/{filename:.+}")
fun getShopReviewImage(
    @PathVariable shopId: Long,
    @PathVariable reviewId: Long,
    @PathVariable filename: String,
): ResponseEntity<ByteArray> {
    validateImagePath(shopId, filename)
    if (reviewId <= 0) throw BadRequestException("...")
    return streamImage("$shopId/reviews/$reviewId/$filename")
}
```

- [ ] **Step 3: `ShopReviewMapper` URL 생성**

```kotlin
url = shopImagesS3.resolvePublicUrl(image.s3Key)
// s3Key already full path 1/reviews/10/abc.jpg → public URL /api/v1/shop-images/...
```

- [ ] **Step 4: Commit**

`feat(server): shop review 이미지 GET 경로 추가`

---

### Task 9: 전체 테스트·Swagger·문서 마무리

**Files:**
- Modify: `server/src/main/kotlin/com/aniwhere/server/common/config/SwaggerConfig.kt` (tag 추가)
- Modify: `server/docs/superpowers/specs/2026-05-28-shop-reviews-design.md` (상태 → 구현 완료 시)

- [x] **Step 1: 전체 server 테스트**

Run: `cd server; .\gradlew.bat test`

Expected: ALL PASS (기존 Post 테스트 포함, 변경 없음)

- [x] **Step 2: Swagger `@Tag(name = "Shop Review")` 추가** — `ShopReviewController`, `AdminShopReviewController`에 `@Tag` 적용됨; SwaggerConfig 변경 불필요

- [x] **Step 3: spec 상태 갱신**

```markdown
**상태:** 구현 동기화 완료 (2026-05-28)
```

- [x] **Step 4: Commit**

```bash
git add server/docs/superpowers/specs/2026-05-28-shop-reviews-design.md
git commit -m "docs(server): shop reviews spec 구현 완료 상태 반영"
```

---

## Spec Coverage Checklist

| Spec § | Task |
|---|---|
| §3 DDL aniwhere-sql-ddl | Task 1 |
| §3.1 shop_reviews | Task 1, 2 |
| §3.2 shop_review_images | Task 1, 2, 6, 8 |
| §3.3 shops ALTER | Task 1, 2, 3 |
| §4.1 shops 응답 집계 | Task 3 |
| §4.2 GET/POST/PATCH/DELETE reviews | Task 5, 6, 7 |
| §4.2 admin status | Task 7 |
| §4.3 Security | Task 5, 7 |
| §5 집계 로직 | Task 4 |
| §6 이미지 S3 | Task 6, 8 |
| §7 에러·검증 | Task 4, 6, 7 |
| §8 테스트 | Task 3–9 |
| §9 Post 제거 (다음 PR) | — |
| Post 유지 이번 PR | no task |

## Commit 분리 (GIT_CONVENTIONS)

1. `aniwhere-sql-ddl`: DDL 단독 커밋
2. `aniwhere/server`: entity → shops 필드 → service → GET → POST → PATCH/DELETE/admin → images → docs

---

## Execution Handoff

Plan complete and saved to `server/docs/superpowers/plans/2026-05-28-shop-reviews-implementation.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — task마다 fresh subagent, task 간 리뷰
2. **Inline Execution** — 이 세션에서 task 순서대로 실행, checkpoint마다 확인

어떤 방식으로 진행할까요?

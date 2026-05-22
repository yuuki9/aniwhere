# Shops Facets API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/api/v1/shops/facets`를 추가해 `/search`, `/explore`, 지도 viewport에서 공통으로 쓰는 동적 facet count/selected/disabled를 제공하고, 사용자 관심작품 저장 테이블을 서버 스키마에 반영한다.

**Architecture:** Controller는 query parsing/validation만 담당하고, facet 계산은 `ShopService -> ShopPersistencePort -> ShopPersistenceAdapter`로 위임한다. Persistence는 기존 `ShopRepository`에 facet 전용 집계 메서드를 추가해 그룹 간 AND / 그룹 내 OR 규칙을 보장한다. 관심작품 저장은 auth schema에 테이블과 JPA entity/repository를 추가해 추후 추천/온보딩 기능이 바로 붙을 수 있게 한다.

**Tech Stack:** Kotlin, Spring Boot Web, Spring Data JPA (Hibernate), MockK, Spring MockMvc, MySQL schema SQL

---

## Scope Check

스펙은 (1) facet API와 (2) 관심작품 저장 구조로 구성되며, 둘 다 `shops 탐색/추천 준비`라는 같은 서버 서브시스템에 속한다. 한 계획에서 처리 가능하지만, 배포 리스크를 줄이기 위해 커밋은 API/스키마를 분리한다.

## File Structure (변경 책임 맵)

- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/in/web/ShopController.kt`
  - `GET /api/v1/shops/facets` endpoint, query parse/validation
- Modify: `server/src/main/kotlin/com/aniwhere/server/domain/shop/port/in/ShopUseCase.kt`
  - facets 조회 유스케이스 시그니처 추가
- Modify: `server/src/main/kotlin/com/aniwhere/server/domain/shop/port/out/ShopPersistencePort.kt`
  - facets 조회 포트 시그니처 추가
- Modify: `server/src/main/kotlin/com/aniwhere/server/domain/shop/service/ShopService.kt`
  - 컨트롤러 요청을 persistence로 전달
- Create: `server/src/main/kotlin/com/aniwhere/server/domain/shop/model/ShopFacetModels.kt`
  - query 모델 + response 모델(regions/categories/works/statuses)
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/ShopRepository.kt`
  - facet 전용 집계 query 메서드 추가
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/ShopPersistenceAdapter.kt`
  - OR/AND 규칙 기반 facet 조합 로직
- Modify: `server/src/test/kotlin/com/aniwhere/server/adapter/in/web/ShopControllerTest.kt`
  - `/shops/facets` 웹 계약 테스트
- Modify: `server/src/test/kotlin/com/aniwhere/server/domain/shop/service/ShopServiceTest.kt`
  - facet 유스케이스 전달 테스트
- Modify: `server/src/test/kotlin/com/aniwhere/server/adapter/out/persistence/ShopPersistenceAdapterTest.kt`
  - facet 조합/disabled 계산 테스트
- Modify: `server/src/main/resources/schema-auth.sql`
  - `user_favorite_works` 테이블 추가
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/AuthEntities.kt`
  - `UserFavoriteWorkEntity` 추가
- Create: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/UserFavoriteWorkRepository.kt`
  - 사용자별 관심작품 CRUD용 repository
- Create: `server/src/test/kotlin/com/aniwhere/server/adapter/out/persistence/repository/UserFavoriteWorkRepositoryTest.kt`
  - unique/user_id 조회 동작 검증

### Task 1: 웹 계약 추가 (`/shops/facets`)

**Files:**
- Modify: `server/src/test/kotlin/com/aniwhere/server/adapter/in/web/ShopControllerTest.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/in/web/ShopController.kt`
- Create: `server/src/main/kotlin/com/aniwhere/server/domain/shop/model/ShopFacetModels.kt`

- [ ] **Step 1: 실패하는 컨트롤러 테스트 작성**

```kotlin
@Test
fun `GET shops_facets - 다중 필터와 bounds를 useCase로 전달`() {
    every { useCase.getShopFacets(any()) } returns ShopFacetResponse.empty()

    mvc.perform(
        get("/api/v1/shops/facets")
            .param("keyword", " 원피스 ")
            .param("regionIds", "1", "2")
            .param("categoryIds", "10")
            .param("workIds", "100", "101")
            .param("status", "ACTIVE")
            .param("swLat", "37.40")
            .param("swLng", "127.00")
            .param("neLat", "37.60")
            .param("neLng", "127.20")
            .param("type", "ANIMATION")
    )
        .andExpect(status().isOk)
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.regions").isArray)
        .andExpect(jsonPath("$.data.categories").isArray)
        .andExpect(jsonPath("$.data.works").isArray)
        .andExpect(jsonPath("$.data.statuses").isArray)

    verify {
        useCase.getShopFacets(
            match {
                it.keyword == "원피스" &&
                    it.regionIds == setOf<Short>(1, 2) &&
                    it.categoryIds == setOf<Short>(10) &&
                    it.workIds == setOf(100, 101)
            },
        )
    }
}
```

- [ ] **Step 2: 테스트 실행 후 실패 확인**

Run: `cd server && .\gradlew.bat test --tests "com.aniwhere.server.adapter.in.web.ShopControllerTest.GET shops_facets - 다중 필터와 bounds를 useCase로 전달"`  
Expected: FAIL with `Unresolved reference: getShopFacets` or `No handler found`.

- [ ] **Step 3: 최소 구현 추가**

```kotlin
// ShopFacetModels.kt
data class ShopFacetQuery(
    val keyword: String? = null,
    val regionIds: Set<Short> = emptySet(),
    val categoryIds: Set<Short> = emptySet(),
    val workIds: Set<Int> = emptySet(),
    val status: ShopStatus? = null,
    val swLat: BigDecimal? = null,
    val swLng: BigDecimal? = null,
    val neLat: BigDecimal? = null,
    val neLng: BigDecimal? = null,
    val workType: WorkType? = null,
)

data class ShopFacetResponse(
    val regions: List<FacetRegionItem>,
    val categories: List<FacetCategoryItem>,
    val works: List<FacetWorkItem>,
    val statuses: List<FacetStatusItem>,
) {
    companion object { fun empty() = ShopFacetResponse(emptyList(), emptyList(), emptyList(), emptyList()) }
}
```

```kotlin
// ShopController.kt
@GetMapping("/facets")
fun getShopFacets(
    @RequestParam(required = false) keyword: String?,
    @RequestParam(required = false) regionIds: List<Short>?,
    @RequestParam(required = false) categoryIds: List<Short>?,
    @RequestParam(required = false) workIds: List<Int>?,
    @RequestParam(required = false) status: String?,
    @RequestParam(required = false) swLat: BigDecimal?,
    @RequestParam(required = false) swLng: BigDecimal?,
    @RequestParam(required = false) neLat: BigDecimal?,
    @RequestParam(required = false) neLng: BigDecimal?,
    @RequestParam(required = false) type: String?,
) = ApiResponse.ok(
    useCase.getShopFacets(
        ShopFacetQuery(
            keyword = keyword?.trim()?.takeIf { it.isNotEmpty() },
            regionIds = regionIds.orEmpty().toSet(),
            categoryIds = categoryIds.orEmpty().toSet(),
            workIds = workIds.orEmpty().toSet(),
            status = status.toShopStatusOrNull(),
            swLat = swLat, swLng = swLng, neLat = neLat, neLng = neLng,
            workType = type.toWorkTypeOrNull(),
        ),
    ),
)
```

- [ ] **Step 4: 테스트 재실행 후 통과 확인**

Run: `cd server && .\gradlew.bat test --tests "com.aniwhere.server.adapter.in.web.ShopControllerTest"`  
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add server/src/main/kotlin/com/aniwhere/server/adapter/in/web/ShopController.kt \
  server/src/main/kotlin/com/aniwhere/server/domain/shop/model/ShopFacetModels.kt \
  server/src/test/kotlin/com/aniwhere/server/adapter/in/web/ShopControllerTest.kt
git commit -m "feat(server): 샵 facet 조회 웹 계약 추가"
```

### Task 2: UseCase/Service/Port 연결

**Files:**
- Modify: `server/src/main/kotlin/com/aniwhere/server/domain/shop/port/in/ShopUseCase.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/domain/shop/port/out/ShopPersistencePort.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/domain/shop/service/ShopService.kt`
- Modify: `server/src/test/kotlin/com/aniwhere/server/domain/shop/service/ShopServiceTest.kt`

- [ ] **Step 1: 실패하는 서비스 테스트 작성**

```kotlin
@Test
fun `getShopFacets - query를 persistence port로 전달`() {
    val query = ShopFacetQuery(keyword = "원피스", workIds = setOf(1, 2))
    val expected = ShopFacetResponse.empty()
    every { port.findFacets(query) } returns expected

    val result = service.getShopFacets(query)

    assertEquals(expected, result)
    verify { port.findFacets(query) }
}
```

- [ ] **Step 2: 테스트 실행 후 실패 확인**

Run: `cd server && .\gradlew.bat test --tests "com.aniwhere.server.domain.shop.service.ShopServiceTest.getShopFacets - query를 persistence port로 전달"`  
Expected: FAIL with unresolved `findFacets` / `getShopFacets`.

- [ ] **Step 3: 최소 구현 추가**

```kotlin
// ShopUseCase.kt
fun getShopFacets(query: ShopFacetQuery): ShopFacetResponse

// ShopPersistencePort.kt
fun findFacets(query: ShopFacetQuery): ShopFacetResponse

// ShopService.kt
override fun getShopFacets(query: ShopFacetQuery): ShopFacetResponse =
    port.findFacets(query)
```

- [ ] **Step 4: 테스트 재실행 후 통과 확인**

Run: `cd server && .\gradlew.bat test --tests "com.aniwhere.server.domain.shop.service.ShopServiceTest"`  
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add server/src/main/kotlin/com/aniwhere/server/domain/shop/port/in/ShopUseCase.kt \
  server/src/main/kotlin/com/aniwhere/server/domain/shop/port/out/ShopPersistencePort.kt \
  server/src/main/kotlin/com/aniwhere/server/domain/shop/service/ShopService.kt \
  server/src/test/kotlin/com/aniwhere/server/domain/shop/service/ShopServiceTest.kt
git commit -m "feat(server): 샵 facet 유스케이스 포트 연결"
```

### Task 3: Persistence 집계 로직 구현 (AND/OR + disabled)

**Files:**
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/ShopRepository.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/ShopPersistenceAdapter.kt`
- Modify: `server/src/test/kotlin/com/aniwhere/server/adapter/out/persistence/ShopPersistenceAdapterTest.kt`

- [ ] **Step 1: 실패하는 어댑터 테스트 작성**

```kotlin
@Test
fun `findFacets - count 0 항목은 disabled true`() {
    val query = ShopFacetQuery(workIds = setOf(100))
    every { shopRepo.findRegionFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any()) } returns
        listOf(RegionFacetRow(1, "강남", 3), RegionFacetRow(2, "강북", 0))
    every { shopRepo.findCategoryFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any()) } returns emptyList()
    every { shopRepo.findWorkFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()) } returns emptyList()
    every { shopRepo.findStatusFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any()) } returns emptyList()

    val response = adapter.findFacets(query)

    assertEquals(false, response.regions.first { it.id == 1.toShort() }.disabled)
    assertEquals(true, response.regions.first { it.id == 2.toShort() }.disabled)
}
```

- [ ] **Step 2: 테스트 실행 후 실패 확인**

Run: `cd server && .\gradlew.bat test --tests "com.aniwhere.server.adapter.out.persistence.ShopPersistenceAdapterTest.findFacets - count 0 항목은 disabled true"`  
Expected: FAIL with unresolved `findFacets` or facet row types.

- [ ] **Step 3: 최소 구현 추가**

```kotlin
// ShopRepository.kt (projection + query)
data class RegionFacetRow(val id: Short, val name: String, val count: Long)

@Query(
    """
    SELECT new com.aniwhere.server.adapter.out.persistence.repository.RegionFacetRow(
        r.id, r.name, COUNT(DISTINCT s.id)
    )
    FROM RegionEntity r
    LEFT JOIN ShopEntity s ON s.region = r
    LEFT JOIN s.categories c
    LEFT JOIN s.works w
    WHERE (:keyword IS NULL OR s.name LIKE CONCAT('%', :keyword, '%'))
      AND (:status IS NULL OR s.status = :status)
      AND (:swLat IS NULL OR s.py >= :swLat)
      AND (:swLng IS NULL OR s.px >= :swLng)
      AND (:neLat IS NULL OR s.py <= :neLat)
      AND (:neLng IS NULL OR s.px <= :neLng)
      AND (:categoryIdsEmpty = true OR c.id IN :categoryIds)
      AND (:workIdsEmpty = true OR w.id IN :workIds)
    GROUP BY r.id, r.name
    ORDER BY r.name ASC
    """,
)
fun findRegionFacetCounts(
    keyword: String?,
    status: ShopStatusEnum?,
    swLat: BigDecimal?,
    swLng: BigDecimal?,
    neLat: BigDecimal?,
    neLng: BigDecimal?,
    categoryIdsEmpty: Boolean,
    categoryIds: Set<Short>,
    workIdsEmpty: Boolean,
    workIds: Set<Int>,
): List<RegionFacetRow>

fun findCategoryFacetCounts(
    keyword: String?,
    status: ShopStatusEnum?,
    swLat: BigDecimal?,
    swLng: BigDecimal?,
    neLat: BigDecimal?,
    neLng: BigDecimal?,
    regionIdsEmpty: Boolean,
    regionIds: Set<Short>,
    workIdsEmpty: Boolean,
    workIds: Set<Int>,
): List<CategoryFacetRow>

fun findWorkFacetCounts(
    keyword: String?,
    status: ShopStatusEnum?,
    swLat: BigDecimal?,
    swLng: BigDecimal?,
    neLat: BigDecimal?,
    neLng: BigDecimal?,
    regionIdsEmpty: Boolean,
    regionIds: Set<Short>,
    categoryIdsEmpty: Boolean,
    categoryIds: Set<Short>,
    type: String?,
): List<WorkFacetRow>

fun findStatusFacetCounts(
    keyword: String?,
    swLat: BigDecimal?,
    swLng: BigDecimal?,
    neLat: BigDecimal?,
    neLng: BigDecimal?,
    regionIdsEmpty: Boolean,
    regionIds: Set<Short>,
    categoryIdsEmpty: Boolean,
    categoryIds: Set<Short>,
    workIdsEmpty: Boolean,
    workIds: Set<Int>,
): List<StatusFacetRow>
```

```kotlin
// ShopPersistenceAdapter.kt
override fun findFacets(query: ShopFacetQuery): ShopFacetResponse {
    val regionRows = shopRepo.findRegionFacetCounts(
        keyword = query.keyword,
        status = query.status?.let { ShopStatusEnum.valueOf(it.name.lowercase()) },
        swLat = query.swLat,
        swLng = query.swLng,
        neLat = query.neLat,
        neLng = query.neLng,
        categoryIdsEmpty = query.categoryIds.isEmpty(),
        categoryIds = query.categoryIds,
        workIdsEmpty = query.workIds.isEmpty(),
        workIds = query.workIds,
    )
    val regions = regionRows.map { row ->
        FacetRegionItem(
            id = row.id,
            name = row.name,
            count = row.count,
            selected = row.id in query.regionIds,
            disabled = row.count == 0L,
        )
    }
    val categories = shopRepo.findCategoryFacetCounts(
        keyword = query.keyword,
        status = query.status?.let { ShopStatusEnum.valueOf(it.name.lowercase()) },
        swLat = query.swLat,
        swLng = query.swLng,
        neLat = query.neLat,
        neLng = query.neLng,
        regionIdsEmpty = query.regionIds.isEmpty(),
        regionIds = query.regionIds,
        workIdsEmpty = query.workIds.isEmpty(),
        workIds = query.workIds,
    ).map { row ->
        FacetCategoryItem(
            id = row.id,
            name = row.name,
            count = row.count,
            selected = row.id in query.categoryIds,
            disabled = row.count == 0L,
        )
    }
    val works = shopRepo.findWorkFacetCounts(
        keyword = query.keyword,
        status = query.status?.let { ShopStatusEnum.valueOf(it.name.lowercase()) },
        swLat = query.swLat,
        swLng = query.swLng,
        neLat = query.neLat,
        neLng = query.neLng,
        regionIdsEmpty = query.regionIds.isEmpty(),
        regionIds = query.regionIds,
        categoryIdsEmpty = query.categoryIds.isEmpty(),
        categoryIds = query.categoryIds,
        type = query.workType?.name,
    ).map { row ->
        FacetWorkItem(
            id = row.id,
            name = row.name,
            coverUrl = row.coverUrl,
            count = row.count,
            selected = row.id in query.workIds,
            disabled = row.count == 0L,
        )
    }
    val statuses = shopRepo.findStatusFacetCounts(
        keyword = query.keyword,
        swLat = query.swLat,
        swLng = query.swLng,
        neLat = query.neLat,
        neLng = query.neLng,
        regionIdsEmpty = query.regionIds.isEmpty(),
        regionIds = query.regionIds,
        categoryIdsEmpty = query.categoryIds.isEmpty(),
        categoryIds = query.categoryIds,
        workIdsEmpty = query.workIds.isEmpty(),
        workIds = query.workIds,
    ).map { row ->
        FacetStatusItem(
            value = row.value,
            label = row.label,
            count = row.count,
            selected = query.status?.name == row.value,
            disabled = row.count == 0L,
        )
    }
    return ShopFacetResponse(regions = regions, categories = categories, works = works, statuses = statuses)
}
```

- [ ] **Step 4: 테스트 재실행 후 통과 확인**

Run: `cd server && .\gradlew.bat test --tests "com.aniwhere.server.adapter.out.persistence.ShopPersistenceAdapterTest"`  
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/ShopRepository.kt \
  server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/ShopPersistenceAdapter.kt \
  server/src/test/kotlin/com/aniwhere/server/adapter/out/persistence/ShopPersistenceAdapterTest.kt
git commit -m "feat(server): 샵 facet 집계 persistence 구현"
```

### Task 4: Facet TTL 캐시(15~30초) 적용

**Files:**
- Modify: `server/src/main/kotlin/com/aniwhere/server/domain/shop/service/ShopService.kt`
- Modify: `server/src/test/kotlin/com/aniwhere/server/domain/shop/service/ShopServiceTest.kt`

- [ ] **Step 1: 실패하는 캐시 테스트 작성**

```kotlin
@Test
fun `getShopFacets - 같은 query는 TTL 내에서 persistence를 재호출하지 않는다`() {
    val query = ShopFacetQuery(keyword = "원피스", workIds = setOf(100))
    every { port.findFacets(query) } returns ShopFacetResponse.empty()

    service.getShopFacets(query)
    service.getShopFacets(query)

    verify(exactly = 1) { port.findFacets(query) }
}
```

- [ ] **Step 2: 테스트 실행 후 실패 확인**

Run: `cd server && .\gradlew.bat test --tests "com.aniwhere.server.domain.shop.service.ShopServiceTest.getShopFacets - 같은 query는 TTL 내에서 persistence를 재호출하지 않는다"`  
Expected: FAIL with `port.findFacets` called 2 times.

- [ ] **Step 3: 최소 구현 추가**

```kotlin
// ShopService.kt
private data class FacetCacheEntry(
    val response: ShopFacetResponse,
    val cachedAtMillis: Long,
)

private val facetCache = ConcurrentHashMap<ShopFacetQuery, FacetCacheEntry>()
private val facetCacheTtlMillis = 30_000L

override fun getShopFacets(query: ShopFacetQuery): ShopFacetResponse {
    val now = System.currentTimeMillis()
    val cached = facetCache[query]
    if (cached != null && now - cached.cachedAtMillis <= facetCacheTtlMillis) {
        return cached.response
    }
    val computed = port.findFacets(query)
    facetCache[query] = FacetCacheEntry(computed, now)
    return computed
}
```

- [ ] **Step 4: 테스트 재실행 후 통과 확인**

Run: `cd server && .\gradlew.bat test --tests "com.aniwhere.server.domain.shop.service.ShopServiceTest"`  
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add server/src/main/kotlin/com/aniwhere/server/domain/shop/service/ShopService.kt \
  server/src/test/kotlin/com/aniwhere/server/domain/shop/service/ShopServiceTest.kt
git commit -m "perf(server): 샵 facet 조회 TTL 캐시 적용"
```

### Task 5: `category` name + `categoryIds` 병행 지원 (`/shops` 호환 단계)

**Files:**
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/in/web/ShopController.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/domain/shop/port/in/ShopUseCase.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/domain/shop/port/out/ShopPersistencePort.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/domain/shop/service/ShopService.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/ShopRepository.kt`
- Modify: `server/src/test/kotlin/com/aniwhere/server/adapter/in/web/ShopControllerTest.kt`

- [ ] **Step 1: 실패하는 호환 테스트 작성**

```kotlin
@Test
fun `GET shops - categoryIds 전달 시 기존 category 없이도 검색된다`() {
    every { useCase.searchShops(any(), any(), any(), any(), any(), any(), any(), any()) } returns PageImpl(listOf(sampleShop))

    mvc.perform(get("/api/v1/shops").param("categoryIds", "1", "2"))
        .andExpect(status().isOk)

    verify {
        useCase.searchShops(
            regionId = null,
            categoryName = null,
            categoryIds = setOf<Short>(1, 2),
            keyword = null,
            workKeyword = null,
            workId = null,
            status = null,
            pageable = any(),
        )
    }
}
```

- [ ] **Step 2: 테스트 실행 후 실패 확인**

Run: `cd server && .\gradlew.bat test --tests "com.aniwhere.server.adapter.in.web.ShopControllerTest.GET shops - categoryIds 전달 시 기존 category 없이도 검색된다"`  
Expected: FAIL with signature mismatch.

- [ ] **Step 3: 최소 구현 추가**

```kotlin
// ShopUseCase.searchShops
fun searchShops(
    regionId: Short?,
    categoryName: String?,
    categoryIds: Set<Short>,
    keyword: String?,
    workKeyword: String?,
    workId: Int?,
    status: ShopStatus?,
    pageable: Pageable,
): Page<Shop>
```

```kotlin
// ShopController.kt
fun searchShops(
    @RequestParam(required = false) regionId: Short?,
    @RequestParam(required = false) category: String?,
    @RequestParam(required = false) categoryIds: List<Short>?,
    @RequestParam(required = false) keyword: String?,
    @RequestParam(required = false) workKeyword: String?,
    @RequestParam(required = false) workId: Int?,
    @RequestParam(required = false) status: String?,
    @ParameterObject @PageableDefault(size = 20) pageable: Pageable,
): ApiResponse<Page<Shop>> {
    val page = useCase.searchShops(
        regionId = regionId,
        categoryName = category,
        categoryIds = categoryIds.orEmpty().toSet(),
        keyword = keyword?.trim()?.takeIf { it.isNotEmpty() },
        workKeyword = workKeyword?.trim()?.takeIf { it.isNotEmpty() },
        workId = workId,
        status = status.toShopStatusOrNull(),
        pageable = pageable,
    )
    return ApiResponse.ok(page)
}
```

- [ ] **Step 4: 테스트 재실행 후 통과 확인**

Run: `cd server && .\gradlew.bat test --tests "com.aniwhere.server.adapter.in.web.ShopControllerTest"`  
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add server/src/main/kotlin/com/aniwhere/server/adapter/in/web/ShopController.kt \
  server/src/main/kotlin/com/aniwhere/server/domain/shop/port/in/ShopUseCase.kt \
  server/src/main/kotlin/com/aniwhere/server/domain/shop/port/out/ShopPersistencePort.kt \
  server/src/main/kotlin/com/aniwhere/server/domain/shop/service/ShopService.kt \
  server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/ShopRepository.kt \
  server/src/test/kotlin/com/aniwhere/server/adapter/in/web/ShopControllerTest.kt
git commit -m "feat(server): 샵 검색 categoryIds 호환 파라미터 추가"
```

### Task 6: 관심작품 저장 스키마 + JPA 리포지토리 추가

**Files:**
- Modify: `server/src/main/resources/schema-auth.sql`
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/AuthEntities.kt`
- Create: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/UserFavoriteWorkRepository.kt`
- Create: `server/src/test/kotlin/com/aniwhere/server/adapter/out/persistence/repository/UserFavoriteWorkRepositoryTest.kt`

- [ ] **Step 1: 실패하는 repository 테스트 작성**

```kotlin
@DataJpaTest
class UserFavoriteWorkRepositoryTest(
    @Autowired private val userRepo: UserRepository,
    @Autowired private val favoriteRepo: UserFavoriteWorkRepository,
) {
    @Test
    fun `save - 같은 user와 work 조합은 중복 저장되지 않는다`() {
        val user = userRepo.save(UserEntity(userKey = 1234L))
        favoriteRepo.save(UserFavoriteWorkEntity(user = user, workId = 100, source = FavoriteWorkSource.ONBOARDING))

        assertThrows<DataIntegrityViolationException> {
            favoriteRepo.saveAndFlush(UserFavoriteWorkEntity(user = user, workId = 100, source = FavoriteWorkSource.MANUAL))
        }
    }
}
```

- [ ] **Step 2: 테스트 실행 후 실패 확인**

Run: `cd server && .\gradlew.bat test --tests "com.aniwhere.server.adapter.out.persistence.repository.UserFavoriteWorkRepositoryTest"`  
Expected: FAIL with missing table/entity/repository.

- [ ] **Step 3: 최소 구현 추가**

```sql
-- schema-auth.sql
CREATE TABLE IF NOT EXISTS user_favorite_works (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    work_id INT NOT NULL,
    source VARCHAR(20) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_favorite_work (user_id, work_id),
    KEY idx_user_favorite_user_id (user_id),
    KEY idx_user_favorite_work_id (work_id),
    CONSTRAINT fk_user_favorite_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

```kotlin
// AuthEntities.kt
enum class FavoriteWorkSource { ONBOARDING, MANUAL }

@Entity
@Table(
    name = "user_favorite_works",
    uniqueConstraints = [UniqueConstraint(name = "uk_user_favorite_work", columnNames = ["user_id", "work_id"])],
)
class UserFavoriteWorkEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false)
    val user: UserEntity,
    @Column(name = "work_id", nullable = false)
    val workId: Int,
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    val source: FavoriteWorkSource,
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)
```

```kotlin
interface UserFavoriteWorkRepository : JpaRepository<UserFavoriteWorkEntity, Long> {
    fun findAllByUserIdOrderByCreatedAtDesc(userId: Long): List<UserFavoriteWorkEntity>
}
```

- [ ] **Step 4: 테스트 재실행 후 통과 확인**

Run: `cd server && .\gradlew.bat test --tests "com.aniwhere.server.adapter.out.persistence.repository.UserFavoriteWorkRepositoryTest"`  
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add server/src/main/resources/schema-auth.sql \
  server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/AuthEntities.kt \
  server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/UserFavoriteWorkRepository.kt \
  server/src/test/kotlin/com/aniwhere/server/adapter/out/persistence/repository/UserFavoriteWorkRepositoryTest.kt
git commit -m "feat(server): 사용자 관심작품 저장 스키마 추가"
```

### Task 7: 최종 검증 + 문서 동기화

**Files:**
- Modify: `server/docs/superpowers/specs/2026-05-22-shops-facets-design.md`
- Modify: `docs/backend-api-contract.md`

- [ ] **Step 1: 계약 문서 반영 테스트(실패 기준 먼저 확인)**

```markdown
- [ ] GET /api/v1/shops/facets query/response가 server 구현과 1:1 대응
- [ ] /api/v1/shops의 category + categoryIds 병행 지원이 문서화
- [ ] user_favorite_works DDL 반영 여부 문서화
```

- [ ] **Step 2: 전체 테스트 실행**

Run: `cd server && .\gradlew.bat test`  
Expected: PASS with all unit/web tests green.

- [ ] **Step 3: 최소 문서 구현 반영**

```markdown
## Current Catalog Contract Notes
- GET /api/v1/shops/facets returns regions/categories/works/statuses with count/selected/disabled.
- GET /api/v1/shops supports temporary compatibility for category(name) and categoryIds.
```

- [ ] **Step 4: 최종 검증 실행**

Run: `cd server && .\gradlew.bat test --tests "com.aniwhere.server.adapter.in.web.ShopControllerTest" --tests "com.aniwhere.server.domain.shop.service.ShopServiceTest" --tests "com.aniwhere.server.adapter.out.persistence.ShopPersistenceAdapterTest"`  
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add server/docs/superpowers/specs/2026-05-22-shops-facets-design.md docs/backend-api-contract.md
git commit -m "docs(server): 샵 facet 계약과 호환 정책 동기화"
```

## Self-Review Checklist (작성 완료 후 직접 확인)

- 스펙 커버리지:
  - facets endpoint 계약: Task 1, 2, 3
  - OR/AND 집계 규칙 + disabled: Task 3
  - facet 성능 기본선(TTL 캐시): Task 4
  - `/shops` categoryIds 호환: Task 5
  - 관심작품 저장 구조: Task 6
  - 문서/검증: Task 7
- Placeholder 스캔: `TBD`, `TODO`, `implement later`, `similar to` 문자열 없음
- 타입 일관성:
  - `ShopFacetQuery`, `ShopFacetResponse`, `getShopFacets`, `findFacets` 명칭을 모든 Task에서 동일하게 사용


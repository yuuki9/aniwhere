# regions · categories 목록 API 및 works 타입 필터 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `GET /api/v1/regions`, `GET /api/v1/categories`(매장 count 포함), `GET /api/v1/works?type=` optional 필터를 서버에 추가한다.

**Architecture:** 기존 `WorkController` hexagonal 패턴을 regions/categories에도 동일 적용. count는 JPQL `COUNT(DISTINCT shop)`로 region/category 마스터와 LEFT JOIN 집계(status 필터 없음 = 전체 status). works는 기존 `WorkCatalogPersistenceAdapter`에 `WorkType?` 분기 추가.

**Tech Stack:** Spring Boot 3.3, Kotlin 1.9, JPA/Hibernate 6, JUnit 5, MockMvc, MockK.

**Spec:** [2026-05-20-catalog-list-apis-design.md](../specs/2026-05-20-catalog-list-apis-design.md)

---

## 파일 맵

| 파일 | 역할 |
|------|------|
| `domain/region/model/RegionListItem.kt` | regions API 응답 DTO |
| `domain/category/model/CategoryListItem.kt` | categories API 응답 DTO |
| `domain/region/port/in/ListRegionsUseCase.kt` | inbound port |
| `domain/region/port/out/RegionCatalogPersistencePort.kt` | outbound port |
| `domain/region/service/RegionCatalogService.kt` | use case 구현 |
| `domain/category/port/in/ListCategoriesUseCase.kt` | inbound port |
| `domain/category/port/out/CategoryCatalogPersistencePort.kt` | outbound port |
| `domain/category/service/CategoryCatalogService.kt` | use case 구현 |
| `adapter/in/web/RegionController.kt` | REST |
| `adapter/in/web/CategoryController.kt` | REST |
| `adapter/out/persistence/RegionCatalogPersistenceAdapter.kt` | JPQL 결과 위임 |
| `adapter/out/persistence/CategoryCatalogPersistenceAdapter.kt` | JPQL 결과 위임 |
| `adapter/out/persistence/repository/ShopRepository.kt` | `RegionRepository`·`CategoryRepository`에 count JPQL 추가 |
| `WorkController.kt` | `type` 파라미터 |
| `ListWorksUseCase.kt` / `WorkCatalogService.kt` / `WorkCatalogPersistencePort.kt` / `WorkCatalogPersistenceAdapter.kt` | works 타입 필터 |
| `SecurityConfig.kt` | public GET permit |
| `RegionControllerTest.kt` / `CategoryControllerTest.kt` / `WorkControllerTest.kt` | 슬라이스 테스트 |

---

### Task 1: 도메인 모델 — `RegionListItem` · `CategoryListItem`

**Files:**

- Create: `server/src/main/kotlin/com/aniwhere/server/domain/region/model/RegionListItem.kt`
- Create: `server/src/main/kotlin/com/aniwhere/server/domain/category/model/CategoryListItem.kt`

- [ ] **Step 1: `RegionListItem.kt` 추가**

```kotlin
package com.aniwhere.server.domain.region.model

data class RegionListItem(
    val id: Short,
    val name: String,
    val city: String,
    val count: Long,
)
```

- [ ] **Step 2: `CategoryListItem.kt` 추가**

```kotlin
package com.aniwhere.server.domain.category.model

data class CategoryListItem(
    val id: Short,
    val name: String,
    val count: Long,
)
```

- [ ] **Step 3: 컴파일 확인**

```powershell
cd D:\codebase\aniwhere\server
.\gradlew.bat compileKotlin
```

**기대:** BUILD SUCCESSFUL

---

### Task 2: regions 카탈로그 — repository JPQL · port · service · adapter

**Files:**

- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/ShopRepository.kt`
- Create: `server/src/main/kotlin/com/aniwhere/server/domain/region/port/out/RegionCatalogPersistencePort.kt`
- Create: `server/src/main/kotlin/com/aniwhere/server/domain/region/port/in/ListRegionsUseCase.kt`
- Create: `server/src/main/kotlin/com/aniwhere/server/domain/region/service/RegionCatalogService.kt`
- Create: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/RegionCatalogPersistenceAdapter.kt`

- [ ] **Step 1: `RegionRepository`에 count JPQL 추가** (`ShopRepository.kt` 내 기존 `RegionRepository` 확장)

```kotlin
import com.aniwhere.server.domain.region.model.RegionListItem

interface RegionRepository : JpaRepository<RegionEntity, Short> {
    @Query(
        """
        SELECT new com.aniwhere.server.domain.region.model.RegionListItem(
            r.id, r.name, r.city, COUNT(DISTINCT s)
        )
        FROM RegionEntity r
        LEFT JOIN ShopEntity s ON s.region = r
        GROUP BY r.id, r.name, r.city
        ORDER BY r.name ASC
        """,
    )
    fun findAllWithShopCount(): List<RegionListItem>
}
```

- [ ] **Step 2: outbound / inbound port · service · adapter 추가**

`RegionCatalogPersistencePort.kt`:

```kotlin
package com.aniwhere.server.domain.region.port.out

import com.aniwhere.server.domain.region.model.RegionListItem

fun interface RegionCatalogPersistencePort {
    fun findAllWithShopCount(): List<RegionListItem>
}
```

`ListRegionsUseCase.kt`:

```kotlin
package com.aniwhere.server.domain.region.port.`in`

import com.aniwhere.server.domain.region.model.RegionListItem

fun interface ListRegionsUseCase {
    fun listRegions(): List<RegionListItem>
}
```

`RegionCatalogService.kt`:

```kotlin
package com.aniwhere.server.domain.region.service

import com.aniwhere.server.domain.region.port.`in`.ListRegionsUseCase
import com.aniwhere.server.domain.region.port.out.RegionCatalogPersistencePort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class RegionCatalogService(
    private val port: RegionCatalogPersistencePort,
) : ListRegionsUseCase {

    override fun listRegions() = port.findAllWithShopCount()
}
```

`RegionCatalogPersistenceAdapter.kt`:

```kotlin
package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.repository.RegionRepository
import com.aniwhere.server.domain.region.model.RegionListItem
import com.aniwhere.server.domain.region.port.out.RegionCatalogPersistencePort
import org.springframework.stereotype.Component

@Component
class RegionCatalogPersistenceAdapter(
    private val regionRepo: RegionRepository,
) : RegionCatalogPersistencePort {

    override fun findAllWithShopCount(): List<RegionListItem> =
        regionRepo.findAllWithShopCount()
}
```

- [ ] **Step 3: 컴파일 확인**

```powershell
cd D:\codebase\aniwhere\server
.\gradlew.bat compileKotlin
```

**기대:** BUILD SUCCESSFUL

---

### Task 3: `RegionController` + 슬라이스 테스트 (TDD)

**Files:**

- Create: `server/src/main/kotlin/com/aniwhere/server/adapter/in/web/RegionController.kt`
- Create: `server/src/test/kotlin/com/aniwhere/server/adapter/in/web/RegionControllerTest.kt`

- [ ] **Step 1: 실패하는 테스트 작성**

`RegionControllerTest.kt`:

```kotlin
package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.domain.region.model.RegionListItem
import com.aniwhere.server.domain.region.port.`in`.ListRegionsUseCase
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(RegionController::class)
@AutoConfigureMockMvc(addFilters = false)
class RegionControllerTest {

    @Autowired
    private lateinit var mvc: MockMvc

    @MockkBean
    private lateinit var useCase: ListRegionsUseCase

    @Test
    fun `GET regions - 지역 목록과 count`() {
        every { useCase.listRegions() } returns listOf(
            RegionListItem(id = 1, name = "홍대", city = "서울", count = 12),
            RegionListItem(id = 2, name = "신촌", city = "서울", count = 0),
        )

        mvc.perform(get("/api/v1/regions"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(2))
            .andExpect(jsonPath("$.data[0].id").value(1))
            .andExpect(jsonPath("$.data[0].name").value("홍대"))
            .andExpect(jsonPath("$.data[0].city").value("서울"))
            .andExpect(jsonPath("$.data[0].count").value(12))
            .andExpect(jsonPath("$.data[1].count").value(0))
    }
}
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```powershell
cd D:\codebase\aniwhere\server
.\gradlew.bat test --tests com.aniwhere.server.adapter.in.web.RegionControllerTest
```

**기대:** FAIL (RegionController 빈 없음 또는 컨텍스트 로드 실패)

- [ ] **Step 3: `RegionController` 구현**

```kotlin
package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.domain.region.port.`in`.ListRegionsUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Region", description = "지역 마스터 API")
@RestController
@RequestMapping("/api/v1/regions")
class RegionController(
    private val useCase: ListRegionsUseCase,
) {

    @Operation(summary = "등록된 지역 목록 (name 오름차순). count는 region_id 연결 매장 수(전체 status)")
    @GetMapping
    fun listRegions() = ApiResponse.ok(useCase.listRegions())
}
```

- [ ] **Step 4: 테스트 통과 확인**

```powershell
cd D:\codebase\aniwhere\server
.\gradlew.bat test --tests com.aniwhere.server.adapter.in.web.RegionControllerTest
```

**기대:** BUILD SUCCESSFUL, 1 test passed

- [ ] **Step 5: 커밋**

```powershell
cd D:\codebase\aniwhere
git add server/src/main/kotlin/com/aniwhere/server/domain/region/ server/src/main/kotlin/com/aniwhere/server/domain/category/model/CategoryListItem.kt server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/RegionCatalogPersistenceAdapter.kt server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/ShopRepository.kt server/src/main/kotlin/com/aniwhere/server/adapter/in/web/RegionController.kt server/src/test/kotlin/com/aniwhere/server/adapter/in/web/RegionControllerTest.kt
git commit -m "$(cat <<'EOF'
feat(server): regions 목록 API 추가

지역 마스터와 매장 count를 GET /api/v1/regions로 제공한다.
EOF
)"
```

---

### Task 4: categories 카탈로그 — repository JPQL · port · service · adapter · controller · test

**Files:**

- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/ShopRepository.kt`
- Create: `server/src/main/kotlin/com/aniwhere/server/domain/category/port/out/CategoryCatalogPersistencePort.kt`
- Create: `server/src/main/kotlin/com/aniwhere/server/domain/category/port/in/ListCategoriesUseCase.kt`
- Create: `server/src/main/kotlin/com/aniwhere/server/domain/category/service/CategoryCatalogService.kt`
- Create: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/CategoryCatalogPersistenceAdapter.kt`
- Create: `server/src/main/kotlin/com/aniwhere/server/adapter/in/web/CategoryController.kt`
- Create: `server/src/test/kotlin/com/aniwhere/server/adapter/in/web/CategoryControllerTest.kt`

- [ ] **Step 1: 실패하는 테스트 작성**

`CategoryControllerTest.kt`:

```kotlin
package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.domain.category.model.CategoryListItem
import com.aniwhere.server.domain.category.port.`in`.ListCategoriesUseCase
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(CategoryController::class)
@AutoConfigureMockMvc(addFilters = false)
class CategoryControllerTest {

    @Autowired
    private lateinit var mvc: MockMvc

    @MockkBean
    private lateinit var useCase: ListCategoriesUseCase

    @Test
    fun `GET categories - 카테고리 목록과 count`() {
        every { useCase.listCategories() } returns listOf(
            CategoryListItem(id = 1, name = "피규어", count = 8),
            CategoryListItem(id = 2, name = "굿즈", count = 0),
        )

        mvc.perform(get("/api/v1/categories"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(2))
            .andExpect(jsonPath("$.data[0].id").value(1))
            .andExpect(jsonPath("$.data[0].name").value("피규어"))
            .andExpect(jsonPath("$.data[0].count").value(8))
            .andExpect(jsonPath("$.data[1].count").value(0))
    }
}
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```powershell
cd D:\codebase\aniwhere\server
.\gradlew.bat test --tests com.aniwhere.server.adapter.in.web.CategoryControllerTest
```

**기대:** FAIL

- [ ] **Step 3: `CategoryRepository` JPQL + port · service · adapter · controller 구현**

`ShopRepository.kt` 내 `CategoryRepository` 확장:

```kotlin
import com.aniwhere.server.domain.category.model.CategoryListItem

interface CategoryRepository : JpaRepository<CategoryEntity, Short> {
    @Query(
        """
        SELECT new com.aniwhere.server.domain.category.model.CategoryListItem(
            c.id,
            c.name,
            COALESCE((
                SELECT COUNT(DISTINCT s.id)
                FROM ShopEntity s JOIN s.categories cat
                WHERE cat.id = c.id
            ), 0)
        )
        FROM CategoryEntity c
        ORDER BY c.name ASC
        """,
    )
    fun findAllWithShopCount(): List<CategoryListItem>
}
```

`CategoryCatalogPersistencePort.kt`:

```kotlin
package com.aniwhere.server.domain.category.port.out

import com.aniwhere.server.domain.category.model.CategoryListItem

fun interface CategoryCatalogPersistencePort {
    fun findAllWithShopCount(): List<CategoryListItem>
}
```

`ListCategoriesUseCase.kt`:

```kotlin
package com.aniwhere.server.domain.category.port.`in`

import com.aniwhere.server.domain.category.model.CategoryListItem

fun interface ListCategoriesUseCase {
    fun listCategories(): List<CategoryListItem>
}
```

`CategoryCatalogService.kt`:

```kotlin
package com.aniwhere.server.domain.category.service

import com.aniwhere.server.domain.category.port.`in`.ListCategoriesUseCase
import com.aniwhere.server.domain.category.port.out.CategoryCatalogPersistencePort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class CategoryCatalogService(
    private val port: CategoryCatalogPersistencePort,
) : ListCategoriesUseCase {

    override fun listCategories() = port.findAllWithShopCount()
}
```

`CategoryCatalogPersistenceAdapter.kt`:

```kotlin
package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.repository.CategoryRepository
import com.aniwhere.server.domain.category.model.CategoryListItem
import com.aniwhere.server.domain.category.port.out.CategoryCatalogPersistencePort
import org.springframework.stereotype.Component

@Component
class CategoryCatalogPersistenceAdapter(
    private val categoryRepo: CategoryRepository,
) : CategoryCatalogPersistencePort {

    override fun findAllWithShopCount(): List<CategoryListItem> =
        categoryRepo.findAllWithShopCount()
}
```

`CategoryController.kt`:

```kotlin
package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.domain.category.port.`in`.ListCategoriesUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Category", description = "카테고리 마스터 API")
@RestController
@RequestMapping("/api/v1/categories")
class CategoryController(
    private val useCase: ListCategoriesUseCase,
) {

    @Operation(summary = "등록된 카테고리 목록 (name 오름차순). count는 해당 카테고리 보유 매장 수(전체 status)")
    @GetMapping
    fun listCategories() = ApiResponse.ok(useCase.listCategories())
}
```

- [ ] **Step 4: 테스트 통과 확인**

```powershell
cd D:\codebase\aniwhere\server
.\gradlew.bat test --tests com.aniwhere.server.adapter.in.web.CategoryControllerTest
```

**기대:** BUILD SUCCESSFUL, 1 test passed

- [ ] **Step 5: 커밋**

```powershell
cd D:\codebase\aniwhere
git add server/src/main/kotlin/com/aniwhere/server/domain/category/ server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/CategoryCatalogPersistenceAdapter.kt server/src/main/kotlin/com/aniwhere/server/adapter/in/web/CategoryController.kt server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/ShopRepository.kt server/src/test/kotlin/com/aniwhere/server/adapter/in/web/CategoryControllerTest.kt
git commit -m "$(cat <<'EOF'
feat(server): categories 목록 API 추가

카테고리 마스터와 매장 count를 GET /api/v1/categories로 제공한다.
EOF
)"
```

---

### Task 5: works `type` 필터 확장

**Files:**

- Modify: `server/src/main/kotlin/com/aniwhere/server/domain/work/port/in/ListWorksUseCase.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/domain/work/port/out/WorkCatalogPersistencePort.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/domain/work/service/WorkCatalogService.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/WorkCatalogPersistenceAdapter.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/in/web/WorkController.kt`
- Modify: `server/src/test/kotlin/com/aniwhere/server/adapter/in/web/WorkControllerTest.kt`

- [ ] **Step 1: 실패하는 테스트 추가** (`WorkControllerTest.kt`에 추가)

```kotlin
import io.mockk.verify
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath

@Test
fun `GET works type=ANIMATION - 애니만 반환`() {
    every { useCase.listWorks(WorkType.ANIMATION) } returns listOf(
        WorkCatalogItem(id = 1, name = "원피스", type = WorkType.ANIMATION),
    )

    mvc.perform(get("/api/v1/works").param("type", "ANIMATION"))
        .andExpect(status().isOk)
        .andExpect(jsonPath("$.data.length()").value(1))
        .andExpect(jsonPath("$.data[0].type").value("ANIMATION"))

    verify { useCase.listWorks(WorkType.ANIMATION) }
}

@Test
fun `GET works type=GAME - 게임만 반환`() {
    every { useCase.listWorks(WorkType.GAME) } returns listOf(
        WorkCatalogItem(id = 2, name = "젤다", type = WorkType.GAME),
    )

    mvc.perform(get("/api/v1/works").param("type", "GAME"))
        .andExpect(status().isOk)
        .andExpect(jsonPath("$.data[0].type").value("GAME"))

    verify { useCase.listWorks(WorkType.GAME) }
}

@Test
fun `GET works type=INVALID - 400`() {
    mvc.perform(get("/api/v1/works").param("type", "INVALID"))
        .andExpect(status().isBadRequest)
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.message").value("type must be ANIMATION or GAME"))
}
```

기존 `GET works - 카탈로그 목록` 테스트의 mock도 시그니처에 맞게 수정:

```kotlin
every { useCase.listWorks(null) } returns listOf(/* 기존 fixture */)
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```powershell
cd D:\codebase\aniwhere\server
.\gradlew.bat test --tests com.aniwhere.server.adapter.in.web.WorkControllerTest
```

**기대:** FAIL (컴파일 또는 mock 시그니처 불일치)

- [ ] **Step 3: use case · port · adapter · controller 구현**

`ListWorksUseCase.kt`:

```kotlin
import com.aniwhere.server.domain.work.model.WorkType

fun interface ListWorksUseCase {
    fun listWorks(type: WorkType? = null): List<WorkCatalogItem>
}
```

`WorkCatalogPersistencePort.kt`:

```kotlin
import com.aniwhere.server.domain.work.model.WorkType

fun interface WorkCatalogPersistencePort {
    fun findAllOrderedByPopularityDesc(type: WorkType? = null): List<WorkCatalogItem>
}
```

`WorkCatalogService.kt`:

```kotlin
override fun listWorks(type: WorkType?) =
    port.findAllOrderedByPopularityDesc(type)
```

`WorkCatalogPersistenceAdapter.kt` — 기존 `findAllOrderedByPopularityDesc()` 본문을 private 헬퍼로 두고 분기 추가:

```kotlin
override fun findAllOrderedByPopularityDesc(type: WorkType?): List<WorkCatalogItem> =
    when (type) {
        WorkType.ANIMATION ->
            animationRepo.findAllOrderByPopularityDesc().map { toCatalogItem(it) }
        WorkType.GAME ->
            gameRepo.findAllOrderByNameAsc().map { toCatalogItem(it) }
        null -> findAllCombined()
    }

private fun findAllCombined(): List<WorkCatalogItem> {
    val animations = animationRepo.findAllOrderByPopularityDesc().map { toCatalogItem(it) }
    val games = gameRepo.findAllOrderByNameAsc().map { toCatalogItem(it) }
    return animations + games
}
```

`WorkController.kt`:

```kotlin
import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.domain.work.model.WorkType
import org.springframework.web.bind.annotation.RequestParam

@GetMapping
fun listWorks(@RequestParam(required = false) type: String?) =
    ApiResponse.ok(useCase.listWorks(parseWorkTypeOrNull(type)))

private fun parseWorkTypeOrNull(raw: String?): WorkType? {
    val normalized = raw?.trim()?.takeIf { it.isNotEmpty() } ?: return null
    return runCatching { WorkType.valueOf(normalized.uppercase()) }
        .getOrElse { throw BadRequestException("type must be ANIMATION or GAME") }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```powershell
cd D:\codebase\aniwhere\server
.\gradlew.bat test --tests com.aniwhere.server.adapter.in.web.WorkControllerTest
```

**기대:** BUILD SUCCESSFUL, 모든 WorkControllerTest 통과

- [ ] **Step 5: 커밋**

```powershell
cd D:\codebase\aniwhere
git add server/src/main/kotlin/com/aniwhere/server/domain/work/ server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/WorkCatalogPersistenceAdapter.kt server/src/main/kotlin/com/aniwhere/server/adapter/in/web/WorkController.kt server/src/test/kotlin/com/aniwhere/server/adapter/in/web/WorkControllerTest.kt
git commit -m "$(cat <<'EOF'
feat(server): works 목록 API에 type 쿼리 파라미터 추가

ANIMATION·GAME 타입별 카탈로그 로드를 지원하고 잘못된 type은 400으로 거절한다.
EOF
)"
```

---

### Task 6: SecurityConfig public read + 전체 테스트

**Files:**

- Modify: `server/src/main/kotlin/com/aniwhere/server/config/security/SecurityConfig.kt`
- Modify: `server/src/test/kotlin/com/aniwhere/server/config/security/SecurityConfigAuthTest.kt` (있다면 GET permit 검증 추가)

- [ ] **Step 1: `SecurityConfig`에 permit 추가**

```kotlin
it.requestMatchers(HttpMethod.GET, "/api/v1/regions/**").permitAll()
it.requestMatchers(HttpMethod.GET, "/api/v1/categories/**").permitAll()
```

(`/api/v1/works/**` 바로 위 또는 아래에 배치)

- [ ] **Step 2: 전체 server 테스트 실행**

```powershell
cd D:\codebase\aniwhere\server
.\gradlew.bat test
```

**기대:** BUILD SUCCESSFUL, 기존 테스트 회귀 없음

- [ ] **Step 3: 커밋**

```powershell
cd D:\codebase\aniwhere
git add server/src/main/kotlin/com/aniwhere/server/config/security/SecurityConfig.kt server/src/test/kotlin/com/aniwhere/server/config/security/
git commit -m "$(cat <<'EOF'
chore(server): regions·categories GET 공개 접근 허용

SecurityConfig에 목록 API permitAll을 추가한다.
EOF
)"
```

---

### Task 7: 설계 문서 상태 갱신 (선택)

**Files:**

- Modify: `docs/superpowers/specs/2026-05-20-catalog-list-apis-design.md`

- [ ] **Step 1: spec 상단 상태를 `구현 계획 작성 완료`로 갱신**

- [ ] **Step 2: docs 커밋** (spec/plan만 변경 시)

```powershell
cd D:\codebase\aniwhere
git add docs/superpowers/specs/2026-05-20-catalog-list-apis-design.md docs/superpowers/plans/2026-05-20-catalog-list-apis.md
git commit -m "$(cat <<'EOF'
docs: catalog list API 설계·구현 계획 추가

regions·categories 목록 API와 works type 필터 스펙 및 구현 계획을 기록한다.
EOF
)"
```

---

## Spec coverage self-review

| Spec 요구 | Task |
|-----------|------|
| `GET /api/v1/regions` + count + city + name ASC | Task 2–3 |
| `GET /api/v1/categories` + count + name ASC | Task 4 |
| count = 전체 status (필터 없음) | Task 2 JPQL (status 조건 없음) |
| `count=0` 포함 | Task 3·4 테스트 fixture |
| `GET /api/v1/works?type=` | Task 5 |
| 잘못된 type → 400 | Task 5 테스트 |
| SecurityConfig permit | Task 6 |
| 서버만 (클라이언트 제외) | 범위 준수 |
| persistence adapter count 테스트 (권장) | JPQL이 status 무필터임을 코드로 보장; `@WebMvcTest`로 API 계약 검증 |

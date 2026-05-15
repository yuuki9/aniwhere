# works DDL 동기화·샵 works 요약·카탈로그 API 확장 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `work/works.sql`에 맞게 `WorkEntity`와 도메인/JSON 응답을 동기화하고, 샵 API의 `works`를 `WorkSummary` 객체 배열로, `GET /api/v1/works`는 전 카탈로그 필드를 반환한다.

**Architecture:** 기존 헥사고날 경로 유지 — `WorkCatalogPersistenceAdapter`가 엔티티→`WorkCatalogItem` 매핑, `ShopMapper`가 `WorkEntity`→`WorkSummary`. REST는 도메인 모델 직렬화(`ApiResponse` 래핑) 패턴 유지.

**Tech stack:** Spring Boot 3.3.5, Kotlin 1.9.25, Hibernate 6 (JPA), MySQL 8 `JSON`, JUnit 5, MockMvc, MockK.

**Spec:** [2026-05-15-works-dto-and-catalog-api-design.md](../specs/2026-05-15-works-dto-and-catalog-api-design.md)

---

## 파일 맵

| 파일 | 역할 |
|------|------|
| [CategoryEntity.kt](../../../server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/CategoryEntity.kt) | `WorkEntity` 컬럼 확장 |
| [domain/work/model/](../../../server/src/main/kotlin/com/aniwhere/server/domain/work/model/) | `WorkSummary` 신설, `WorkCatalogItem` 확장 |
| [Shop.kt](../../../server/src/main/kotlin/com/aniwhere/server/domain/shop/model/Shop.kt) | `works` 타입 변경 |
| [ShopMapper.kt](../../../server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/mapper/ShopMapper.kt) | `WorkSummary` 매핑 |
| [WorkCatalogPersistenceAdapter.kt](../../../server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/WorkCatalogPersistenceAdapter.kt) | 카탈로그 전 필드 매핑 |
| [WorkControllerTest.kt](../../../server/src/test/kotlin/com/aniwhere/server/adapter/in/web/WorkControllerTest.kt) | JSON 경로 검증 |
| [ShopControllerTest.kt](../../../server/src/test/kotlin/com/aniwhere/server/adapter/in/web/ShopControllerTest.kt) | `works` 배열 형태 검증 |
| 기타 `WorkCatalogItem`을 생성·검증하는 테스트 | 컴파일·어설션 정합성 |

---

### Task 1: 도메인 타입 — `WorkSummary`·`WorkCatalogItem`·`Shop`

**Files:**

- Create: `server/src/main/kotlin/com/aniwhere/server/domain/work/model/WorkSummary.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/domain/work/model/WorkCatalogItem.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/domain/shop/model/Shop.kt`

- [ ] **Step 1: `WorkSummary.kt` 추가**

```kotlin
package com.aniwhere.server.domain.work.model

data class WorkSummary(
    val id: Int,
    val name: String,
    val coverUrl: String? = null,
)
```

- [ ] **Step 2: `WorkCatalogItem`을 DDL 공개 컬럼에 맞게 확장** (기존 `id`, `name` 유지·이름 정렬/필터 계약 유지)

```kotlin
package com.aniwhere.server.domain.work.model

import java.time.LocalDateTime

data class WorkCatalogItem(
    val id: Int,
    val name: String,
    val anilistId: Long? = null,
    val titleRomaji: String? = null,
    val titleEnglish: String? = null,
    val titleNative: String? = null,
    val koreanTitle: String? = null,
    val genres: List<String>? = null,
    val coverUrl: String? = null,
    val tmdbLogoUrl: String? = null,
    val popularity: Int? = null,
    val anilistSyncedAt: LocalDateTime? = null,
)
```

- [ ] **Step 3: `Shop.kt`에서 `works` 타입 변경**

`import com.aniwhere.server.domain.work.model.WorkSummary` 추가 후:

```kotlin
    val works: List<WorkSummary> = emptyList(),
```

(나머지 필드 그대로.)

- [ ] **Step 4: 컴파일 확인**

프로젝트 루트에서:

```powershell
cd D:\codebase\aniwhere\server
.\gradlew.bat compileKotlin compileTestKotlin
```

**기대:** 다수 타입 오류(다음 태스크에서 해소) — `WorkCatalogItem` 시그니처 변경으로 인한 컴파일 에러 위치를 기록.

---

### Task 2: `WorkEntity` ↔ MySQL DDL

**Files:**

- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/CategoryEntity.kt`

- [ ] **Step 1: import 및 `WorkEntity` 본문 교체**

다음 import 추가:

```kotlin
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.LocalDateTime
```

`WorkEntity` 클래스를 DDL과 일치하게 수정 (`id`, `name` 보존):

```kotlin
@Entity
@Table(name = "works")
class WorkEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int? = null,

    @Column(nullable = false, length = 100, unique = true)
    val name: String,

    @Column(name = "anilist_id", nullable = true, columnDefinition = "INT UNSIGNED")
    val anilistId: Long? = null,

    @Column(name = "title_romaji", length = 512, nullable = true)
    val titleRomaji: String? = null,

    @Column(name = "title_english", length = 512, nullable = true)
    val titleEnglish: String? = null,

    @Column(name = "title_native", length = 512, nullable = true)
    val titleNative: String? = null,

    @Column(name = "korean_title", length = 512, nullable = true)
    val koreanTitle: String? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json", nullable = true)
    val genres: List<String>? = null,

    @Column(name = "cover_url", length = 1024, nullable = true)
    val coverUrl: String? = null,

    @Column(name = "tmdb_logo_url", length = 1024, nullable = true)
    val tmdbLogoUrl: String? = null,

    @Column(nullable = true)
    val popularity: Int? = null,

    @Column(name = "anilist_synced_at", nullable = true)
    val anilistSyncedAt: LocalDateTime? = null,
)
```

- [ ] **Step 2: 컴파일**

```powershell
.\gradlew.bat compileKotlin
```

**기대:** 성공. (`genres` 매핑이 방언/버전에 따라 경고 시 `columnDefinition`을 `JSON` 등으로 조정.)

---

### Task 3: `ShopMapper` — `WorkSummary`

**Files:**

- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/mapper/ShopMapper.kt`

- [ ] **Step 1: `toDomain`의 `works` 줄 교체**

```kotlin
import com.aniwhere.server.domain.work.model.WorkSummary
```

```kotlin
        works = e.works.map {
            WorkSummary(
                id = checkNotNull(it.id) { "work id absent" },
                name = it.name,
                coverUrl = it.coverUrl,
            )
        },
```

- [ ] **Step 2: `compileTestKotlin`로 의존 테스트 컴파일**

```powershell
.\gradlew.bat compileTestKotlin
```

---

### Task 4: `WorkCatalogPersistenceAdapter` — 전 필드 매핑

**Files:**

- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/WorkCatalogPersistenceAdapter.kt`

- [ ] **Step 1: `findAllOrderedByName` 매핑 블록 교체**

```kotlin
    override fun findAllOrderedByName(): List<WorkCatalogItem> =
        workRepo.findAll(Sort.by(Sort.Direction.ASC, "name")).map { e ->
            WorkCatalogItem(
                id = checkNotNull(e.id) { "work id absent" },
                name = e.name,
                anilistId = e.anilistId,
                titleRomaji = e.titleRomaji,
                titleEnglish = e.titleEnglish,
                titleNative = e.titleNative,
                koreanTitle = e.koreanTitle,
                genres = e.genres,
                coverUrl = e.coverUrl,
                tmdbLogoUrl = e.tmdbLogoUrl,
                popularity = e.popularity,
                anilistSyncedAt = e.anilistSyncedAt,
            )
        }
```

- [ ] **Step 2: 컴파일**

```powershell
.\gradlew.bat compileKotlin compileTestKotlin
```

---

### Task 5: 테스트 수정 — `WorkControllerTest`

**Files:**

- Modify: `server/src/test/kotlin/com/aniwhere/server/adapter/in/web/WorkControllerTest.kt`

- [ ] **Step 1: 픽스처를 확장된 `WorkCatalogItem`으로 변경하고 JSON 일부 검증**

예시(필드 값은 테스트 데이터로 자유):

```kotlin
import java.time.LocalDateTime

// inside test:
        val synced = LocalDateTime.of(2026, 5, 1, 12, 0, 0, 0)
        every { useCase.listWorks() } returns listOf(
            WorkCatalogItem(
                id = 1,
                name = "원피스",
                anilistId = 21L,
                titleRomaji = "ONE PIECE",
                titleEnglish = "One Piece",
                titleNative = "ワンピース",
                koreanTitle = "원피스",
                genres = listOf("Action", "Adventure"),
                coverUrl = "https://example.com/cover.jpg",
                tmdbLogoUrl = "https://example.com/logo.png",
                popularity = 100,
                anilistSyncedAt = synced,
            ),
            WorkCatalogItem(id = 2, name = "주술회전"),
        )
```

```kotlin
            .andExpect(jsonPath("$.data[0].anilistId").value(21))
            .andExpect(jsonPath("$.data[0].titleRomaji").value("ONE PIECE"))
            .andExpect(jsonPath("$.data[0].genres[0]").value("Action"))
            .andExpect(jsonPath("$.data[0].anilistSyncedAt").exists())
```

두 번째 항목은 기본값 필드 누락 검증을 `doesNotExist` 또는 존재 여부로 선택.

- [ ] **Step 2: 실행**

```powershell
.\gradlew.bat test --tests "com.aniwhere.server.adapter.in.web.WorkControllerTest"
```

**기대:** 모두 PASS. (Jackson이 `LocalDateTime`을 ISO-8601 문자열로 직렬화 — `jsonPath` 비교 시 형식 주의.)

---

### Task 6: 테스트 수정 — `ShopControllerTest` 및 기타 `Shop`/`WorkCatalogItem` 참조

**Files:**

- Modify: `server/src/test/kotlin/com/aniwhere/server/adapter/in/web/ShopControllerTest.kt`
- Modify: `server/src/test/kotlin/com/aniwhere/server/domain/shop/service/ShopServiceTest.kt` 및 grep으로 발견되는 `WorkCatalogItem`·`Shop(` 디폴트 `works` 깨짐

- [ ] **Step 1: `ShopControllerTest` — `sampleShop`에 `works`를 `WorkSummary`로 추가**

```kotlin
import com.aniwhere.server.domain.work.model.WorkSummary
```

```kotlin
    private val sampleShop = Shop(
        id = 1L, name = "테스트샵", address = "서울시 강남구",
        px = BigDecimal("127.0276368"), py = BigDecimal("37.4979462"),
        status = ShopStatus.ACTIVE,
        works = listOf(WorkSummary(id = 1, name = "원피스", coverUrl = "https://example.com/c.jpg")),
    )
```

- [ ] **Step 2: 단건/목록 응답에 `works` 객체 배열 검증 추가**

```kotlin
            .andExpect(jsonPath("$.data.works[0].id").value(1))
            .andExpect(jsonPath("$.data.works[0].name").value("원피스"))
            .andExpect(jsonPath("$.data.works[0].coverUrl").value("https://example.com/c.jpg"))
```

검색 결과(`content[0]`)에도 동일 패턴이 필요하면 추가.

- [ ] **Step 3: `ShopServiceTest` 및 기타 테스트** — `Shop(` 빌더에 `works = emptyList()` 명시 또는 `WorkSummary` 목록 추가해 컴파일 통과.

- [ ] **Step 4: 전체 테스트**

```powershell
.\gradlew.bat test
```

**기대:** 전부 PASS.

---

### Task 7: `genres` 비정상 JSON 방어 (조건부)

**전제:** Task 6까지 통합 환경에서 `works.genres` 읽기 시 예외가 난다면 적용. 정상 데이터만 있다면 스킵 가능.

**Files:**

- Create (필요 시): `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/GenresJsonConverter.kt` — `AttributeConverter<List<String>?, String?>`에서 역직렬화 실패 시 `null` 또는 빈 리스트 반환 및 로깅.

- Modify: `WorkEntity.genres`에 `@Convert(converter = GenresJsonConverter::class)` 지정하고 `@JdbcTypeCode` 제거 여부는 컨버터 구현 방식에 맞춤.

구체 구현은 팀 로깅 정책에 맞게 선택; 스펙 요지는 **행 단위 조회 실패 방지**.

---

### Task 8: 문서·스키마 출처 확인

- [ ] `D:\codebase\aniwhere-sql-ddl\SERVER_SCHEMA_SYNC.md` 매핑 표가 여전히 `CategoryEntity.kt` ↔ `works`인지 확인. 이번 변경은 서버가 DDL을 따라잡는 것이므로 DDL 수정 불필요 시 문서 변경 없음.

---

## Spec 대응 표 (self-review)

| Spec 섹션 | 태스크 |
|-----------|--------|
| 4.1 영속 | Task 2 |
| 4.2 도메인 | Task 1 |
| 4.3 매핑·조회 | Task 3, 4 |
| 4.4 API | 직렬화 자동; Task 5–6으로 계약 검증 |
| 4.5 genres | Task 7 (필요 시) |
| 4.6 테스트 | Task 5–6 |

**Placeholder 스캔:** 본 계획에 TBD/TODO 없음.

**타입 일관성:** `WorkCatalogItem` 필드명이 어댑터·테스트·JSON snake/camel 모두 Jackson 기본(camelCase)으로 통일.

---

## 실행 위임

Plan complete and saved to `docs/superpowers/plans/2026-05-15-works-dto-and-catalog-api.md`. Two execution options:

1. **Subagent-Driven (recommended)** — 태스크마다 신규 서브에이전트 디스패치, 태스크 사이 리뷰  
2. **Inline Execution** — 이 세션에서 `executing-plans` 체크포인트로 순차 실행  

원하는 방식을 알려 주세요.

커밋은 `GIT_CONVENTIONS.md`에 맞춰 **도메인 경계별로 분리**하는 것을 권장합니다(예: 도메인 모델 한 커밋, 영속/매퍼 한 커밋, 테스트 한 커밋). 사용자가 커밋을 요청할 때만 수행하면 됩니다.

# DDL ↔ server/client 스키마 동기화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `aniwhere-sql-ddl` JOINED `works`·ichiban 제거 DDL에 맞게 server JPA/API와 client 타입·UI를 동기화한다.

**Architecture:** JPA `JOINED` 상속(`WorkEntity` → `AnimationWorkEntity` / `GameWorkEntity`)으로 EC2 DB(이미 JOINED, ANIMATION+GAME 혼재)와 정합. 카탈로그는 2-query merge(애니 popularity → 게임 name). `sells_ichiban_kuji`는 server·client 전역 제거. 단일 PR.

**Tech Stack:** Kotlin 1.9, Spring Boot 3.3, JPA/Hibernate, MockMvc/MockK, TypeScript React (Apps in Toss WebView client)

**Spec:** `docs/superpowers/specs/2026-05-20-ddl-server-client-schema-sync-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `server/.../entity/WorkEntities.kt` | JOINED `WorkEntity` hierarchy (신규) |
| `server/.../entity/CategoryEntity.kt` | flat `WorkEntity` 제거, `CategoryEntity`만 유지 |
| `server/.../entity/ShopEntity.kt` | `works: Set<WorkEntity>`, ichiban 제거 |
| `server/.../repository/ShopRepository.kt` | `WorkRepository` + shop search JPQL JOINED 대응 |
| `server/.../WorkCatalogPersistenceAdapter.kt` | polymorphic → `WorkCatalogItem` |
| `server/.../domain/work/model/WorkCatalogItem.kt` | `type: WorkType` 추가 |
| `server/.../domain/work/model/WorkType.kt` | `ANIMATION`, `GAME` enum (신규) |
| `server/.../domain/shop/model/Shop.kt` | ichiban 제거 |
| `server/.../mapper/ShopMapper.kt`, `ShopPersistenceAdapter.kt`, `ShopController.kt` | ichiban 제거 |
| `client/src/shared/api/types.ts` | `WorkType`, `WorkCatalogItem.type`, ichiban·`works: WorkSummary[]` |
| client UI/LLM/admin files | ichiban UI·분기 제거 |
| `aniwhere-sql-ddl/SERVER_SCHEMA_SYNC.md` | ichiban·JOINED 매핑 갱신 |

---

### Task 1: 도메인 — `WorkType`·`WorkCatalogItem`

**Files:**
- Create: `server/src/main/kotlin/com/aniwhere/server/domain/work/model/WorkType.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/domain/work/model/WorkCatalogItem.kt`
- Test: `server/src/test/kotlin/com/aniwhere/server/adapter/in/web/WorkControllerTest.kt`

- [ ] **Step 1: `WorkType.kt` 추가**

```kotlin
package com.aniwhere.server.domain.work.model

enum class WorkType {
    ANIMATION,
    GAME,
}
```

- [ ] **Step 2: `WorkCatalogItem`에 `type` 필드 추가 (기본값 ANIMATION — 기존 테스트 호환)**

```kotlin
package com.aniwhere.server.domain.work.model

import java.time.LocalDateTime

data class WorkCatalogItem(
    val id: Int,
    val name: String,
    val type: WorkType = WorkType.ANIMATION,
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

- [ ] **Step 3: `WorkControllerTest`에 `type` jsonPath 추가 (RED)**

`WorkControllerTest.kt` 픽스처 첫 항목에 `type = WorkType.ANIMATION` 추가, 두 번째에 `type = WorkType.GAME`:

```kotlin
import com.aniwhere.server.domain.work.model.WorkType

WorkCatalogItem(
    id = 1,
    name = "원피스",
    type = WorkType.ANIMATION,
    // ... 기존 필드
),
WorkCatalogItem(id = 2, name = "젤다", type = WorkType.GAME),
```

assert 추가:

```kotlin
.andExpect(jsonPath("$.data[0].type").value("ANIMATION"))
.andExpect(jsonPath("$.data[1].type").value("GAME"))
```

- [ ] **Step 4: 테스트 실행 (MockMvc — useCase mock이므로 PASS 예상)**

Run: `cd server && ./gradlew test --tests "com.aniwhere.server.adapter.in.web.WorkControllerTest" --no-daemon`

Expected: PASS (도메인만 변경, mock 반환)

- [ ] **Step 5: Commit**

```bash
git add server/src/main/kotlin/com/aniwhere/server/domain/work/model/WorkType.kt \
  server/src/main/kotlin/com/aniwhere/server/domain/work/model/WorkCatalogItem.kt \
  server/src/test/kotlin/com/aniwhere/server/adapter/in/web/WorkControllerTest.kt
git commit -m "feat(server): WorkCatalogItem에 작품 타입(ANIMATION/GAME) 추가"
```

---

### Task 2: JPA JOINED 엔티티

**Files:**
- Create: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/WorkEntities.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/CategoryEntity.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/ShopEntity.kt`

- [ ] **Step 1: `WorkEntities.kt` 생성**

```kotlin
package com.aniwhere.server.adapter.out.persistence.entity

import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.LocalDateTime

@Entity
@Table(name = "works")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "dtype")
abstract class WorkEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    open val id: Int? = null,
    @Column(nullable = false, length = 100, unique = true)
    open var name: String,
    @Column(name = "cover_url", length = 1024, nullable = true)
    open var coverUrl: String? = null,
    @Column(name = "created_at", nullable = false, updatable = false)
    open val createdAt: LocalDateTime = LocalDateTime.now(),
    @Column(name = "updated_at", nullable = false)
    open var updatedAt: LocalDateTime = LocalDateTime.now(),
)

@Entity
@DiscriminatorValue("ANIMATION")
@PrimaryKeyJoinColumn(name = "work_id")
class AnimationWorkEntity(
    name: String,
    coverUrl: String? = null,
    createdAt: LocalDateTime = LocalDateTime.now(),
    updatedAt: LocalDateTime = LocalDateTime.now(),
    @Column(name = "anilist_id", nullable = true, columnDefinition = "INT UNSIGNED")
    var anilistId: Long? = null,
    @Column(name = "title_romaji", length = 512, nullable = true)
    var titleRomaji: String? = null,
    @Column(name = "title_english", length = 512, nullable = true)
    var titleEnglish: String? = null,
    @Column(name = "title_native", length = 512, nullable = true)
    var titleNative: String? = null,
    @Column(name = "korean_title", length = 512, nullable = true)
    var koreanTitle: String? = null,
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json", nullable = true)
    var genres: List<String>? = null,
    @Column(name = "tmdb_logo_url", length = 1024, nullable = true)
    var tmdbLogoUrl: String? = null,
    @Column(nullable = true)
    var popularity: Int? = null,
    @Column(name = "anilist_synced_at", nullable = true)
    var anilistSyncedAt: LocalDateTime? = null,
) : WorkEntity(name, coverUrl, createdAt, updatedAt)

@Entity
@DiscriminatorValue("GAME")
@PrimaryKeyJoinColumn(name = "work_id")
class GameWorkEntity(
    name: String,
    coverUrl: String? = null,
    createdAt: LocalDateTime = LocalDateTime.now(),
    updatedAt: LocalDateTime = LocalDateTime.now(),
) : WorkEntity(name, coverUrl, createdAt, updatedAt)
```

- [ ] **Step 2: `CategoryEntity.kt`에서 flat `WorkEntity` 클래스 전체 삭제** (`CategoryEntity`만 남김)

- [ ] **Step 3: `ShopEntity.kt` import 유지** — `works: MutableSet<WorkEntity>` 타입은 추상 부모 그대로 (변경 없음)

- [ ] **Step 4: 컴파일 확인**

Run: `cd server && ./gradlew compileKotlin --no-daemon`

Expected: FAIL at `ShopRepository`/`WorkCatalogPersistenceAdapter` (flat 필드 참조) — 다음 Task에서 수정

- [ ] **Step 5: Commit**

```bash
git add server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/WorkEntities.kt \
  server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/CategoryEntity.kt
git commit -m "feat(server): works JOINED JPA 엔티티(Animation/Game) 도입"
```

---

### Task 3: Repository·Adapter — 카탈로그 조회

**Files:**
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/ShopRepository.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/WorkCatalogPersistenceAdapter.kt`
- Create: `server/src/test/kotlin/com/aniwhere/server/adapter/out/persistence/WorkCatalogPersistenceAdapterTest.kt`

- [ ] **Step 1: `ShopRepository.kt` — WorkRepository를 2-repo로 분리**

`WorkRepository` 인터페이스를 아래로 교체:

```kotlin
interface AnimationWorkRepository : JpaRepository<AnimationWorkEntity, Int> {
    @Query(
        """
        SELECT a FROM AnimationWorkEntity a
        ORDER BY a.popularity DESC NULLS LAST, a.name ASC
        """,
    )
    fun findAllOrderByPopularityDesc(): List<AnimationWorkEntity>
}

interface GameWorkRepository : JpaRepository<GameWorkEntity, Int> {
    @Query("SELECT g FROM GameWorkEntity g ORDER BY g.name ASC")
    fun findAllOrderByNameAsc(): List<GameWorkEntity>
}
```

import 추가: `AnimationWorkEntity`, `GameWorkEntity`

- [ ] **Step 2: `WorkCatalogPersistenceAdapterTest` 작성 (RED)**

```kotlin
package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.AnimationWorkEntity
import com.aniwhere.server.adapter.out.persistence.entity.GameWorkEntity
import com.aniwhere.server.adapter.out.persistence.repository.AnimationWorkRepository
import com.aniwhere.server.adapter.out.persistence.repository.GameWorkRepository
import com.aniwhere.server.domain.work.model.WorkType
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class WorkCatalogPersistenceAdapterTest {

    private val animationRepo = mockk<AnimationWorkRepository>()
    private val gameRepo = mockk<GameWorkRepository>()
    private val adapter = WorkCatalogPersistenceAdapter(animationRepo, gameRepo)

    @Test
    fun `애니 popularity 순 후 게임 name 순으로 카탈로그를 반환한다`() {
        every { animationRepo.findAllOrderByPopularityDesc() } returns listOf(
            AnimationWorkEntity(name = "원피스", popularity = 100, anilistId = 21L).apply { id = 1 },
        )
        every { gameRepo.findAllOrderByNameAsc() } returns listOf(
            GameWorkEntity(name = "젤다").apply { id = 2 },
        )

        val items = adapter.findAllOrderedByPopularityDesc()

        assertThat(items).hasSize(2)
        assertThat(items[0].type).isEqualTo(WorkType.ANIMATION)
        assertThat(items[0].popularity).isEqualTo(100)
        assertThat(items[1].type).isEqualTo(WorkType.GAME)
        assertThat(items[1].anilistId).isNull()
    }
}
```

Kotlin entity `id` is `val` — 테스트에서는 mock entity factory 또는 reflection 대신 **테스트용 생성자 패턴** 사용. `AnimationWorkEntity`의 `id`가 `val`이므로 mockk `spyk` 또는 `@TestConfiguration` integration test로 대체:

**실행 가능한 수정:** integration test 없이 mapper 함수 단위 테스트:

```kotlin
@Test
fun `AnimationWorkEntity 는 ANIMATION 타입으로 매핑한다`() {
    val entity = AnimationWorkEntity(name = "원피스", popularity = 10, anilistId = 1L)
    val item = adapter.toCatalogItem(entity)
    assertThat(item.type).isEqualTo(WorkType.ANIMATION)
    assertThat(item.popularity).isEqualTo(10)
}
```

→ Adapter에 `internal fun toCatalogItem(work: WorkEntity): WorkCatalogItem` 추출 후 테스트.

- [ ] **Step 3: `WorkCatalogPersistenceAdapter` 구현**

```kotlin
@Component
class WorkCatalogPersistenceAdapter(
    private val animationRepo: AnimationWorkRepository,
    private val gameRepo: GameWorkRepository,
) : WorkCatalogPersistencePort {

    override fun findAllOrderedByPopularityDesc(): List<WorkCatalogItem> {
        val animations = animationRepo.findAllOrderByPopularityDesc().map { toCatalogItem(it) }
        val games = gameRepo.findAllOrderByNameAsc().map { toCatalogItem(it) }
        return animations + games
    }

    internal fun toCatalogItem(work: WorkEntity): WorkCatalogItem {
        val id = checkNotNull(work.id) { "work id absent" }
        return when (work) {
            is AnimationWorkEntity -> WorkCatalogItem(
                id = id,
                name = work.name,
                type = WorkType.ANIMATION,
                anilistId = work.anilistId,
                titleRomaji = work.titleRomaji,
                titleEnglish = work.titleEnglish,
                titleNative = work.titleNative,
                koreanTitle = work.koreanTitle,
                genres = work.genres,
                coverUrl = work.coverUrl,
                tmdbLogoUrl = work.tmdbLogoUrl,
                popularity = work.popularity,
                anilistSyncedAt = work.anilistSyncedAt,
            )
            is GameWorkEntity -> WorkCatalogItem(
                id = id,
                name = work.name,
                type = WorkType.GAME,
                coverUrl = work.coverUrl,
            )
            else -> error("Unknown work subtype: ${work::class.simpleName}")
        }
    }
}
```

- [ ] **Step 4: 테스트 실행**

Run: `cd server && ./gradlew test --tests "com.aniwhere.server.adapter.out.persistence.WorkCatalogPersistenceAdapterTest" --no-daemon`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/ShopRepository.kt \
  server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/WorkCatalogPersistenceAdapter.kt \
  server/src/test/kotlin/com/aniwhere/server/adapter/out/persistence/WorkCatalogPersistenceAdapterTest.kt
git commit -m "feat(server): JOINED works 카탈로그 조회 및 타입별 매핑"
```

---

### Task 4: Shop 검색 JPQL — JOINED `koreanTitle`

**Files:**
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/ShopRepository.kt`

- [ ] **Step 1: `workKeyword` EXISTS 절을 TREAT로 수정**

`ShopRepository.search`의 workKeyword 조건 (본문·countQuery **둘 다**) 교체:

```jpql
AND (:workKeyword IS NULL OR EXISTS (
    SELECT 1 FROM ShopEntity s2 JOIN s2.works w
    WHERE s2.id = s.id AND (
         w.name LIKE CONCAT('%', :workKeyword, '%')
      OR (TYPE(w) = AnimationWorkEntity AND TREAT(w AS AnimationWorkEntity).koreanTitle LIKE CONCAT('%', :workKeyword, '%'))
    )))
```

import: `AnimationWorkEntity`

- [ ] **Step 2: 전체 server 테스트**

Run: `cd server && ./gradlew test --no-daemon`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/ShopRepository.kt
git commit -m "fix(server): JOINED works 기준 shop workKeyword 검색 JPQL 수정"
```

---

### Task 5: server — `sellsIchibanKuji` 제거

**Files:**
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/ShopEntity.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/domain/shop/model/Shop.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/mapper/ShopMapper.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/ShopPersistenceAdapter.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/in/web/ShopController.kt`
- Test: `server/src/test/kotlin/com/aniwhere/server/adapter/in/web/ShopControllerTest.kt`

- [ ] **Step 1: grep으로 ichiban 참조 제거**

Run: `rg "sellsIchiban|sells_ichiban" server/src --files-with-matches`

각 파일에서 필드·매핑·DTO·form 파라미터 삭제.

`ShopEntity.kt` — `@Column(name = "sells_ichiban_kuji")` 및 `sellsIchibanKuji` 프로퍼티 삭제.

`Shop.kt`:

```kotlin
data class Shop(
    // ...
    val status: ShopStatus = ShopStatus.UNVERIFIED,
    val visitTip: String? = null,  // sellsIchibanKuji 줄 삭제
```

`ShopController.kt` — `ShopCreateRequest`, `ShopUpdateRequest`, `ShopResponse` 등 DTO에서 `sellsIchibanKuji` 삭제.

- [ ] **Step 2: `ShopControllerTest` — ichiban 관련 fixture/assert 없으면 compile만 확인**

Run: `cd server && ./gradlew test --tests "com.aniwhere.server.adapter.in.web.ShopControllerTest" --no-daemon`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/ShopEntity.kt \
  server/src/main/kotlin/com/aniwhere/server/domain/shop/model/Shop.kt \
  server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/mapper/ShopMapper.kt \
  server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/ShopPersistenceAdapter.kt \
  server/src/main/kotlin/com/aniwhere/server/adapter/in/web/ShopController.kt
git commit -m "refactor(server): shops sellsIchibanKuji 필드 제거"
```

---

### Task 6: client — 타입·API

**Files:**
- Modify: `client/src/shared/api/types.ts`
- Modify: `client/src/shared/api/shops.ts`
- Modify: `client/src/shared/api/llm.ts`

- [ ] **Step 1: `types.ts` 갱신**

```typescript
export type WorkType = 'ANIMATION' | 'GAME'

export type WorkCatalogItem = WorkSummary & {
  type: WorkType
  anilistId: number | null
  // ... 기존 필드
}

export type Shop = {
  // ...
  status: ShopStatus
  visitTip: string | null
  categories: string[]
  works: WorkSummary[]
  // sellsIchibanKuji 삭제
}

export type ShopRequest = {
  // ...
  status: ShopStatus
  visitTip?: string | null
  // sellsIchibanKuji 삭제
}
```

- [ ] **Step 2: `shops.ts` — formData ichiban 분기 삭제**

`payload.sellsIchibanKuji` 관련 `formData.set` 블록 전체 제거.

- [ ] **Step 3: `llm.ts` — ichiban 힌트·필드 삭제**

- `if (shop.sellsIchibanKuji && /일번|쿠지/.test(question))` 블록 삭제
- context payload의 `sellsIchibanKuji` 삭제
- `shop.works`가 `WorkSummary[]`이므로 LLM 문자열 조합을 `work.name` 기준으로 수정:

```typescript
const workNames = shop.works.map((work) => work.name)
const matchedWork = workNames.find((name) => lowerQuestion.includes(name.toLowerCase()))
```

- [ ] **Step 4: client typecheck**

Run: `cd client && npm run build` (또는 `npx tsc --noEmit`)

Expected: FAIL at UI files — Task 7에서 수정

- [ ] **Step 5: Commit**

```bash
git add client/src/shared/api/types.ts client/src/shared/api/shops.ts client/src/shared/api/llm.ts
git commit -m "refactor(client): ichiban 필드 제거 및 WorkCatalogItem type 추가"
```

---

### Task 7: client — UI ichiban·works 표시

**Files:**
- Modify: `client/src/pages/explore/MapDetailInfoCard.tsx`
- Modify: `client/src/pages/ShopPage.tsx`
- Modify: `client/src/pages/SearchPage.tsx`
- Modify: `client/src/pages/admin/AdminShopsPage.tsx`
- Modify: `client/src/pages/admin/AdminShopDraftStore.ts`
- Modify: `client/src/pages/explore/MapDetailSupplementSections.tsx`

- [ ] **Step 1: ichiban UI 제거**

각 파일에서 `sellsIchibanKuji` 체크박스·문구(`이치방쿠지`, `일번쿠지`) 삭제.

- [ ] **Step 2: `works` 표시를 `WorkSummary.name`으로**

`ShopPage.tsx`, `MapDetailSupplementSections.tsx`:

```tsx
{shop.works.map((work) => (
  <span className="mini-tag" key={work.id}>
    {work.name}
  </span>
))}
```

- [ ] **Step 3: `SearchPage.tsx` — chip 소스에서 ichiban 제거**

```typescript
[shop.regionName, ...shop.categories.slice(0, 2)].filter(Boolean)
```

- [ ] **Step 4: `AdminShopsPage.tsx` / `AdminShopDraftStore.ts` — form state·payload에서 ichiban 제거**

- [ ] **Step 5: client build**

Run: `cd client && npm run build`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/
git commit -m "refactor(client): ichiban UI 제거 및 shop works WorkSummary 표시"
```

---

### Task 8: 문서·DDL sync 메모

**Files:**
- Modify: `D:\codebase\aniwhere-sql-ddl\SERVER_SCHEMA_SYNC.md`
- Modify: `docs/search-backend-api-jira.md`

- [ ] **Step 1: `SERVER_SCHEMA_SYNC.md` 갱신**

- `ShopEntity.kt` 매핑 표에 `works_animation`, `works_game` 추가
- ichiban 불리언 체크리스트(§5) **삭제**
- `WorkEntity` → JOINED (`WorkEntities.kt`) 로 경로 수정

- [ ] **Step 2: `search-backend-api-jira.md` — `sellsIchibanKuji` 필터 항목 삭제**

- [ ] **Step 3: Commit**

```bash
git add docs/search-backend-api-jira.md
# aniwhere-sql-ddl 은 별도 repo — 동일 워크스페이스면:
git add ../aniwhere-sql-ddl/SERVER_SCHEMA_SYNC.md
git commit -m "docs: DDL-server sync 문서에서 ichiban 제거 및 works JOINED 반영"
```

---

### Task 9: 최종 검증

- [ ] **Step 1: server 전체 테스트**

Run: `cd server && ./gradlew test --no-daemon`

Expected: BUILD SUCCESSFUL

- [ ] **Step 2: client build**

Run: `cd client && npm run build`

Expected: PASS

- [ ] **Step 3: ichiban 잔존 grep**

Run: `rg "sellsIchiban|sells_ichiban" D:\codebase\aniwhere --glob "!**/node_modules/**"`

Expected: no matches (또는 docs/history만)

- [ ] **Step 4: PR 체크리스트 (수동)**

- [ ] GitHub Secrets/EC2: `ALTER TABLE shops DROP COLUMN sells_ichiban_kuji;` (컬럼 존재 시)
- [ ] EC2 `works` JOINED — `ddl-auto: update` 기동 후 불필요 ALTER 없음 확인

---

## Spec self-review (plan ↔ spec)

| Spec requirement | Task |
|------------------|------|
| JOINED JPA entities | Task 2 |
| ANIMATION+GAME catalog + type field | Task 1, 3 |
| popularity sort | Task 3 |
| shop_works unchanged | Task 2 (WorkEntity id) |
| workKeyword korean_title | Task 4 |
| ichiban server removal | Task 5 |
| ichiban client removal | Task 6, 7 |
| SERVER_SCHEMA_SYNC update | Task 8 |
| EC2 no works migration | (out of scope — note in Task 9) |
| single PR server+client | Tasks 1–9 one branch |

**Placeholder scan:** none.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-20-ddl-server-client-schema-sync.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?

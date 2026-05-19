# aniwhere-sql-ddl ↔ server/client 스키마 동기화 설계

**상태:** 브레인스토밍 승인 완료 (2026-05-20)  
**DDL 단일 기준:** `D:\codebase\aniwhere-sql-ddl\`  
**동기화 참고:** `aniwhere-sql-ddl/SERVER_SCHEMA_SYNC.md`  
**선행 설계:** `docs/superpowers/specs/2026-05-15-works-dto-and-catalog-api-design.md` (flat `works` 전제 — **본 설계가 JOINED로 대체**)

---

## 1. 배경

`aniwhere-sql-ddl`이 `works` JOINED 상속(`works` + `works_animation` + `works_game`)과 `shops.sells_ichiban_kuji` 제거로 갱신되었으나, `aniwhere/server`·`client`는 구 스키마(flat `WorkEntity`, ichiban 필드)를 유지하고 있다.

운영(EC2) DB는 **이미 JOINED 구조**이며 `works`에 **ANIMATION·GAME 행이 모두 존재**한다. 따라서 DB 마이그레이션(`alter_works_joined_from_flat.sql`)은 범위 밖이고, **애플리케이션 코드를 DDL·DB에 맞추는 작업**이 목표다.

---

## 2. 목표

1. JPA 영속 모델을 DDL JOINED 구조와 논리적으로 동일하게 맞춘다.
2. `sells_ichiban_kuji`를 DB·server·client에서 의도적으로 제거한다.
3. 기존 API 경로는 유지하되, 카탈로그 응답에 작품 **타입**을 추가해 ANIMATION/GAME을 구분 가능하게 한다.
4. **단일 PR**로 server + client 변경을 함께 머지한다.

---

## 3. 범위

### In scope

| 영역 | 변경 |
|------|------|
| **works JOINED** | 엔티티 상속, Repository, 카탈로그 adapter, 테스트 |
| **shops ichiban 제거** | server 엔티티·도메인·API DTO, client 타입·UI·LLM 분기 |
| **문서** | `aniwhere-sql-ddl/SERVER_SCHEMA_SYNC.md` ichiban 항목 제거, 본 spec |
| **운영 SQL** | EC2 `shops`에 ichiban 컬럼 잔존 시 `DROP COLUMN` (수동, 배포 노트) |

### Out of scope

- `user_bookmarks`, `shop_reviews` 엔티티/API 구현
- `posts`/`comments` DDL을 `aniwhere-sql-ddl`에 추가
- `users.status` ENUM ↔ Kotlin enum 정합
- `alter_works_joined_from_flat.sql` 실행 (운영 DB 이미 JOINED)

---

## 4. DDL 기준 (works JOINED)

### 4.1 부모 `works`

| 컬럼 | 타입 | 비고 |
|------|------|------|
| `id` | INT PK AI | |
| `dtype` | VARCHAR(31) NOT NULL | JPA `@DiscriminatorValue`와 동일 문자열 |
| `name` | VARCHAR(100) NOT NULL UQ | |
| `cover_url` | VARCHAR(1024) NULL | |
| `created_at` | DATETIME(6) NOT NULL | |
| `updated_at` | DATETIME(6) NOT NULL | |

### 4.2 자식 `works_animation`

`work_id` PK/FK → `works.id`. AniList·TMDB 필드: `anilist_id`, `title_romaji`, `title_english`, `title_native`, `korean_title`, `genres`(JSON), `tmdb_logo_url`, `popularity`, `anilist_synced_at`.

### 4.3 자식 `works_game`

`work_id` PK/FK → `works.id`. 추가 컬럼 없음(추후 확장).

### 4.4 Discriminator 값

- `ANIMATION` → `AnimationWork`
- `GAME` → `GameWork`

DDL·EC2 데이터와 **대소문자 일치** 필수.

---

## 5. 설계 — works (server)

### 5.1 엔티티

```text
Work (abstract)
  @Entity @Inheritance(JOINED) @DiscriminatorColumn(name = "dtype")
  - id, name, coverUrl, createdAt, updatedAt

AnimationWork extends Work
  @DiscriminatorValue("ANIMATION") @PrimaryKeyJoinColumn
  - anilistId, titleRomaji, titleEnglish, titleNative, koreanTitle
  - genres, tmdbLogoUrl, popularity, anilistSyncedAt

GameWork extends Work
  @DiscriminatorValue("GAME") @PrimaryKeyJoinColumn
  - (추가 필드 없음)
```

- 파일 배치: 기존 `CategoryEntity.kt`의 flat `WorkEntity`를 분리·대체. `categories` 엔티티는 동 파일 유지 가능.
- `ShopEntity.works: MutableSet<Work>` — 타입을 추상 `Work`(또는 공통 인터face)로 변경.

### 5.2 Repository

- `WorkRepository : JpaRepository<Work, Int>` (또는 동등).
- **`findAllOrderByPopularityDesc`**: ANIMATION의 `popularity` 내림차순, NULL·GAME은 뒤로, 동률·미산정은 `name` ASC.
  - JPQL 예: `AnimationWork` 전용 조회 + `GameWork` 별도 조회 후 merge, 또는 LEFT JOIN `works_animation` on polymorphic query.
  - 구현 시 Hibernate/JPQL 호환성을 우선해 **가장 단순한 2-query merge**도 허용.

### 5.3 카탈로그 매핑

`WorkCatalogItem` 확장:

| 필드 | ANIMATION | GAME |
|------|-----------|------|
| `id`, `name`, `coverUrl` | O | O |
| `type` | `"ANIMATION"` | `"GAME"` |
| AniList/TMDB 필드 | 값 있으면 채움 | `null` |

`WorkCatalogPersistenceAdapter`: `when (work)` 또는 타입 체크로 분기 매핑.

### 5.4 Shop·검색

- `shop_works.work_id` → `works.id` (**변경 없음**).
- `ShopMapper` → `WorkSummary(id, name, coverUrl)` — 부모 `Work` 필드만 사용 (타입 무관).
- 샵 검색 `workKeyword`: ANIMATION의 `korean_title` + 부모 `name` OR 조건 유지. GAME은 `name`만 매칭.

### 5.5 Hibernate `ddl-auto: update`

- 엔티티가 EC2 JOINED 스키마와 일치하면 **기동 시 불필요한 ALTER가 발생하지 않아야** 한다.
- PR 검증: 로컬/Testcontainers 또는 EC2 read-only 스키마 diff 확인 권장.

---

## 6. 설계 — shops ichiban 제거

### 6.1 server

제거 대상:

- `ShopEntity.sellsIchibanKuji`
- `Shop.sellsIchibanKuji`
- `ShopMapper`, `ShopPersistenceAdapter`, `ShopController` request/response DTO

API JSON에서 `sellsIchibanKuji` 키 **삭제** (breaking change — client 동시 배포).

### 6.2 client

제거 대상 (grep 기준):

- `client/src/shared/api/types.ts`, `shops.ts`, `llm.ts`
- `MapDetailInfoCard.tsx`, `ShopPage.tsx`, `SearchPage.tsx`
- `AdminShopsPage.tsx`, `AdminShopDraftStore.ts`

이치방쿠지 UI 문구·체크박스·LLM 힌트 분기 전부 삭제.

### 6.3 DDL·운영

- DDL: `shop/01_shops.sql` — 이미 ichiban 없음.
- EC2: 컬럼 잔존 시 `ALTER TABLE shops DROP COLUMN sells_ichiban_kuji;`
- `SERVER_SCHEMA_SYNC.md`: ichiban 불리언 체크리스트 항목 삭제.

---

## 7. API 계약 요약

| API | 변경 |
|-----|------|
| `GET /api/v1/works` | `type` 필드 추가; GAME은 AniList 필드 null |
| `GET/POST/PUT /api/v1/shops` | `sellsIchibanKuji` 제거 |
| Shop JSON `works[]` | `WorkSummary` 유지 (`id`, `name`, `coverUrl`) |

---

## 8. 테스트

### server

- `WorkControllerTest`: ANIMATION·GAME fixture, `type` jsonPath, popularity 정렬
- `ShopControllerTest` / mapper: ichiban 필드 제거 반영
- Repository integration test (가능하면): JOINED 엔티티 persist/load

### client

- ichiban 관련 UI/타입 compile 통과 (수동 QA: admin·지도·검색)

---

## 9. 터치 예상 파일

### server

- `adapter/out/persistence/entity/` — Work 계층 (신규/분리), `ShopEntity.kt`
- `adapter/out/persistence/repository/ShopRepository.kt` — WorkRepository JPQL
- `adapter/out/persistence/WorkCatalogPersistenceAdapter.kt`
- `domain/work/model/WorkCatalogItem.kt`
- `domain/shop/model/Shop.kt`
- `adapter/out/persistence/mapper/ShopMapper.kt`, `ShopPersistenceAdapter.kt`
- `adapter/in/web/ShopController.kt`
- 테스트: `WorkControllerTest`, `ShopControllerTest`, 기타 ichiban/work 참조

### client

- `shared/api/types.ts`, `shops.ts`, `llm.ts`
- `pages/explore/MapDetailInfoCard.tsx`, `ShopPage.tsx`, `SearchPage.tsx`
- `pages/admin/AdminShopsPage.tsx`, `AdminShopDraftStore.ts`

### docs

- `aniwhere-sql-ddl/SERVER_SCHEMA_SYNC.md`
- `docs/search-backend-api-jira.md` (ichiban 필터 설명 제거)

---

## 10. 리스크·완화

| 리스크 | 완화 |
|--------|------|
| GAME-only work가 popularity 목록에서 뒤로 밀림 | 기존 “인기도 정렬” 의미 유지, GAME은 name 순 하위 |
| client/server 배포 시차 | 단일 PR로 동시 머지·배포 |
| EC2 shops ichiban 컬럼 잔존 | DROP COLUMN 수동 실행 (배포 체크리스트) |
| 구 spec(2026-05-15) flat 전제 | 본 문서가 works 영역의 새 기준 |

---

## 11. 승인 기록

| 결정 | 선택 |
|------|------|
| ichiban 제거 | 의도적 — DB·API·client 전부 제거 |
| works DB 상태 | EC2 JOINED, ANIMATION+GAME 혼재 |
| 접근 | JOINED JPA + 단일 카탈로그 API |
| PR 범위 | server + client 단일 PR |

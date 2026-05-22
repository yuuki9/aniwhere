# works 테이블 확장에 따른 DTO·API 설계

**상태:** 브레인스토밍 승인 완료 (2026-05-15)  
**DDL 단일 기준:** `D:\codebase\aniwhere-sql-ddl\work\works.sql`  
**동기화 참고:** `D:\codebase\aniwhere-sql-ddl\SERVER_SCHEMA_SYNC.md`

---

## 1. 배경

`works` 테이블에 AniList·TMDB 카탈로그 컬럼이 추가되었다. 서버의 `WorkEntity`·반환 모델·JSON 계약을 DDL과 맞추고, 작품 카탈로그는 전용 API로 제공한다.

---

## 2. 목표

- JPA `WorkEntity`를 `work/works.sql`과 논리적으로 동일하게 맞춘다.
- 샵 응답의 `works`는 **안정 식별자 + UI에 필요한 최소 요약**(`WorkSummary`)으로 노출한다.
- `GET /api/v1/works`는 **카탈로그 전 필드(공개 의도)** 를 반환하도록 확장한다. 별도 “목록 전용” 경로는 추가하지 않는다.

---

## 3. DDL 요약 (참조)

`works`: `id`, `name` (NOT NULL, UQ), `anilist_id` (NULL, UQ), `title_romaji`, `title_english`, `title_native`, `korean_title`, `genres` (JSON), `cover_url`, `tmdb_logo_url`, `popularity`, `anilist_synced_at`.

`shop_works` 조인은 기존과 동일 (`PRIMARY KEY (shop_id, work_id)`).

---

## 4. 설계 결정 (승인된 섹션)

### 4.1 영속 계층

- `WorkEntity`(위치: `server/.../entity/CategoryEntity.kt` 내)에 위 컬럼을 모두 매핑한다.
- `genres`: JSON 배열 ↔ 도메인/Kotlin 컬렉션 매핑은 프로젝트의 기존 JPA JSON 관례를 따른다.
- `anilist_synced_at`: 프로젝트 타임 타입 관례(`Instant` vs `LocalDateTime`)에 맞춘다.
- 스키마 변경 시 `aniwhere-sql-ddl`과 엔티티를 쌍으로 유지한다 (`SERVER_SCHEMA_SYNC.md`).

### 4.2 도메인 모델

- **`WorkSummary`**: `id`, `name`, `coverUrl` (nullable). 샵이 참조하는 작품의 최소 단위.
- **`Shop.works`**: `List<String>` → **`List<WorkSummary>`**.
- **카탈로그 항목**: `WorkCatalogItem`을 DDL 공개 필드에 맞게 확장하거나, 동등 역할의 타입(예: `WorkCatalogEntry`)으로 정리하고 `ListWorksUseCase` 반환 타입과 일치시킨다. 구현 시 한 가지 명명만 일관되게 사용한다.

### 4.3 매핑·조회

- **`ShopMapper`**: `e.works` → `WorkSummary` 리스트.
- **`WorkCatalogPersistenceAdapter`**: 확장 컬럼을 채운다. 정렬은 기존과 같이 **`name` 오름차순** 유지.
- **샵 검색**: `keyword`는 `shops.name` 부분 일치(LIKE). `workKeyword`는 취급 작품 `works.name` / `works.korean_title` 부분 일치(LIKE, 두 컬럼 OR). `workId`는 해당 `works.id`를 취급하는 매장만(정확 일치). 문자열·`workId` 필터를 함께 주면 AND.

### 4.4 API 계약

- 샵 목록/상세 JSON의 `works`: **`[{ "id", "name", "coverUrl"? }]`** 형태. 기존 `string[]`과 비호환(브레이킹 변경).
- **`GET /api/v1/works`**: 응답 항목에 카탈로그 공개 필드 전부. 비공개 컬럼이 생기면 어댑터/DTO에서 제외.
- 신규 REST 경로는 추가하지 않는다.

### 4.5 에러·경계

- `genres` JSON이 비정상인 경우 **행 전체 로드를 실패시키지 않는 것**을 권장한다(예: 빈 리스트/ null 처리 + 로깅). 세부는 기존 예외·로깅 패턴에 맞춘다.

### 4.6 테스트

- `WorkControllerTest`: 확장 필드 `jsonPath` 검증.
- `ShopControllerTest`, `ShopMapper`(또는 동일 책임 테스트): `works` 객체 배열 및 필드 기대값.
- 필요 시 픽스처에 `WorkEntity` 신규 컬럼 반영.

---

## 5. 구현 시 터치 예상 파일 (참고)

- `server/src/main/kotlin/.../entity/CategoryEntity.kt` (`WorkEntity`)
- `server/src/main/kotlin/.../domain/work/model/` (카탈로그 모델, `WorkSummary` 등)
- `server/src/main/kotlin/.../domain/shop/model/Shop.kt`
- `server/src/main/kotlin/.../mapper/ShopMapper.kt`
- `server/src/main/kotlin/.../WorkCatalogPersistenceAdapter.kt`
- `server/src/main/kotlin/.../WorkController.kt` (직렬화 결과만 바뀔 수 있음)
- 대응 테스트 클래스 (`WorkControllerTest`, `ShopControllerTest`, 기타)

---

## 6. 비범위

- 구버전 클라이언트를 위한 API 버전 분기 또는 필드 병행(`workNames` + `works`)은 포함하지 않는다. 필요 시 별도 릴리즈에서 결정한다.

---

## 7. 다음 단계

`writing-plans` 스킬로 구현 계획 문서를 작성한다 (`docs/superpowers/plans/`). 사용자가 본 스펙 검토를 마친 뒤 진행한다.

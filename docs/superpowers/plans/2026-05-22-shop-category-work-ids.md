# Shop categoryIds / workIds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shop 등록·수정(JSON/multipart) API에서 `categoryIds`·`workIds`로 M2M 조인을 전체 교체한다.

**Architecture:** `ShopRequest` DTO 확장 → `Shop` 도메인에 id 목록 전달 → `ShopPersistenceAdapter.save/update`에서 Category/Work bulk lookup 후 `entity.categories`·`entity.works` clear/addAll. invalid/duplicate id는 `BadRequestException`.

**Tech Stack:** Kotlin, Spring Boot 3.3, JPA, MockK, JUnit 5

**Spec:** `docs/superpowers/specs/2026-05-22-shop-category-work-ids-design.md`

---

### Task 1: Domain + DTO

**Files:**
- Modify: `server/src/main/kotlin/com/aniwhere/server/domain/shop/model/Shop.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/in/web/ShopController.kt`

- [ ] `Shop`에 `categoryIds`, `workIds` 추가
- [ ] `ShopRequest` / multipart DTO에 동일 필드 + `toDomain()`/`toShop()` 매핑

### Task 2: Repository + Persistence

**Files:**
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/ShopRepository.kt`
- Modify: `server/src/main/kotlin/com/aniwhere/server/adapter/out/persistence/ShopPersistenceAdapter.kt`

- [ ] `WorkRepository : JpaRepository<WorkEntity, Int>` 추가
- [ ] `CategoryRepository` 주입, duplicate/unknown 검증 helper
- [ ] `save()` / `update()`에서 M2M 전체 교체

### Task 3: Tests

**Files:**
- Create: `server/src/test/kotlin/com/aniwhere/server/adapter/out/persistence/ShopPersistenceAdapterTest.kt`
- Modify: `server/src/test/kotlin/com/aniwhere/server/adapter/in/web/ShopControllerTest.kt`

- [ ] Adapter: save/update M2M, unknown id, duplicate id
- [ ] Controller: POST/PUT JSON에서 ids가 useCase로 전달

### Task 4: Verify

- [ ] `./gradlew test` (server)

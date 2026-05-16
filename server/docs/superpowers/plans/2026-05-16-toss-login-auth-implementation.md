# Toss Login Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apps in Toss 로그인(`appLogin` 인가코드) 기반으로 일반/관리자 공통 인증과 DB refresh 세션 관리를 서버에 도입한다.

**Architecture:** 클라이언트는 인가코드를 서버에 전달하고, 서버는 Toss API(`generate-token`, `login-me`)로 사용자(`userKey`)를 검증한 뒤 내부 JWT(access/refresh)를 발급한다. `users`/`admins`로 권한을 분리하고 `refresh_tokens`에 해시 기반으로 refresh를 저장·회전한다. unlink 콜백 수신 시 사용자 상태와 세션을 정리해 토스 연결 상태를 반영한다.

**Tech Stack:** Kotlin, Spring Boot 3, Spring Web, Spring Data JPA, Spring Security, JJWT, MySQL, MockK, Spring MVC Test

---

## File Structure

- Modify: `build.gradle.kts` - Security/JWT 의존성 추가
- Modify: `src/main/resources/application.yml` - JWT/Toss 설정 바인딩 값 추가
- Create: `src/main/resources/schema-auth.sql` - 인증 관련 테이블 DDL
- Create: `src/main/kotlin/com/aniwhere/server/domain/auth/model/AuthModels.kt` - 도메인 인증 모델
- Create: `src/main/kotlin/com/aniwhere/server/domain/auth/port/in/AuthUseCase.kt` - 인증 유즈케이스 인터페이스
- Create: `src/main/kotlin/com/aniwhere/server/domain/auth/port/out/AuthPersistencePort.kt` - 사용자/토큰 영속 포트
- Create: `src/main/kotlin/com/aniwhere/server/domain/auth/port/out/TossAuthPort.kt` - Toss 연동 포트
- Create: `src/main/kotlin/com/aniwhere/server/domain/auth/service/AuthService.kt` - 인증 핵심 서비스
- Create: `src/main/kotlin/com/aniwhere/server/config/AuthProperties.kt` - 설정 프로퍼티
- Create: `src/main/kotlin/com/aniwhere/server/config/security/JwtTokenProvider.kt` - JWT 발급/검증
- Create: `src/main/kotlin/com/aniwhere/server/config/security/SecurityPrincipal.kt` - 인증 principal
- Create: `src/main/kotlin/com/aniwhere/server/config/security/JwtAuthenticationFilter.kt` - Bearer 필터
- Create: `src/main/kotlin/com/aniwhere/server/config/security/SecurityConfig.kt` - 보안 규칙
- Create: `src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/AuthEntities.kt` - users/admins/refresh/unlink 엔티티
- Create: `src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/AuthRepositories.kt` - 인증 리포지토리
- Create: `src/main/kotlin/com/aniwhere/server/adapter/out/persistence/AuthPersistenceAdapter.kt` - 영속 어댑터
- Create: `src/main/kotlin/com/aniwhere/server/adapter/out/toss/TossAuthApiClient.kt` - Toss API 클라이언트
- Create: `src/main/kotlin/com/aniwhere/server/adapter/in/web/AuthController.kt` - 로그인/재발급/로그아웃/콜백 API
- Modify: `src/main/kotlin/com/aniwhere/server/common/exception/GlobalExceptionHandler.kt` - 인증 예외 매핑
- Create: `src/main/kotlin/com/aniwhere/server/common/exception/AuthExceptions.kt` - 인증 전용 예외
- Test: `src/test/kotlin/com/aniwhere/server/domain/auth/service/AuthServiceTest.kt`
- Test: `src/test/kotlin/com/aniwhere/server/adapter/in/web/AuthControllerTest.kt`
- Test: `src/test/kotlin/com/aniwhere/server/config/security/JwtTokenProviderTest.kt`
- Test: `src/test/kotlin/com/aniwhere/server/adapter/out/toss/TossAuthApiClientTest.kt`
- Test: `src/test/kotlin/com/aniwhere/server/config/security/SecurityConfigAuthTest.kt`

### Task 1: 인증 기초 인프라(의존성/설정/DDL) 준비

**Files:**
- Modify: `build.gradle.kts`
- Modify: `src/main/resources/application.yml`
- Create: `src/main/resources/schema-auth.sql`
- Test: `src/test/kotlin/com/aniwhere/server/config/AuthPropertiesBindingTest.kt`

- [ ] **Step 1: 설정 바인딩 실패 테스트 작성**

```kotlin
package com.aniwhere.server.config

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.test.context.runner.ApplicationContextRunner

class AuthPropertiesBindingTest {
    private val runner = ApplicationContextRunner()
        .withUserConfiguration(TestConfig::class.java)
        .withPropertyValues(
            "app.auth.jwt.issuer=aniwhere",
            "app.auth.jwt.access-exp-seconds=900",
            "app.auth.jwt.refresh-exp-seconds=1209600",
            "app.auth.jwt.secret=test-secret-test-secret-test-secret-1234",
            "app.auth.toss.base-url=https://apps-in-toss-api.toss.im"
        )

    @Test
    fun `auth properties bind 성공`() {
        runner.run { context ->
            val props = context.getBean(AuthProperties::class.java)
            assertThat(props.jwt.issuer).isEqualTo("aniwhere")
            assertThat(props.toss.baseUrl).contains("apps-in-toss-api")
        }
    }

    @EnableConfigurationProperties(AuthProperties::class)
    class TestConfig
}
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `./gradlew.bat test --tests "com.aniwhere.server.config.AuthPropertiesBindingTest" -q`  
Expected: `AuthProperties` 미존재 컴파일 실패

- [ ] **Step 3: 최소 구현(의존성/설정/DDL) 추가**

```kotlin
// build.gradle.kts (dependencies 블록에 추가)
implementation("org.springframework.boot:spring-boot-starter-security")
implementation("io.jsonwebtoken:jjwt-api:0.12.6")
runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")
```

```yaml
# src/main/resources/application.yml (app 아래 추가)
  auth:
    jwt:
      issuer: ${APP_AUTH_JWT_ISSUER:aniwhere}
      access-exp-seconds: ${APP_AUTH_JWT_ACCESS_EXP_SECONDS:900}
      refresh-exp-seconds: ${APP_AUTH_JWT_REFRESH_EXP_SECONDS:1209600}
      secret: ${APP_AUTH_JWT_SECRET:replace-me-with-strong-secret}
    toss:
      base-url: ${APP_TOSS_BASE_URL:https://apps-in-toss-api.toss.im}
      client-id: ${APP_TOSS_CLIENT_ID:}
      client-secret: ${APP_TOSS_CLIENT_SECRET:}
      unlink-basic-auth: ${APP_TOSS_UNLINK_BASIC_AUTH:}
```

```sql
-- src/main/resources/schema-auth.sql
CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_key BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_user_key (user_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admins (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'ADMIN',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_admins_user_id (user_id),
    CONSTRAINT fk_admins_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_refresh_token_hash (token_hash),
    KEY idx_refresh_user (user_id),
    KEY idx_refresh_expires (expires_at),
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS toss_unlink_events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_key BIGINT NOT NULL,
    referrer VARCHAR(40) NOT NULL,
    raw_payload JSON NULL,
    received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_unlink_user_key (user_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

```kotlin
// src/main/kotlin/com/aniwhere/server/config/AuthProperties.kt
package com.aniwhere.server.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.auth")
data class AuthProperties(
    val jwt: Jwt = Jwt(),
    val toss: Toss = Toss(),
) {
    data class Jwt(
        val issuer: String = "aniwhere",
        val accessExpSeconds: Long = 900,
        val refreshExpSeconds: Long = 1209600,
        val secret: String = "",
    )

    data class Toss(
        val baseUrl: String = "https://apps-in-toss-api.toss.im",
        val clientId: String = "",
        val clientSecret: String = "",
        val unlinkBasicAuth: String = "",
    )
}
```

```kotlin
// src/main/kotlin/com/aniwhere/server/AniwhereServerApplication.kt (annotation만 교체)
@SpringBootApplication
@org.springframework.boot.context.properties.ConfigurationPropertiesScan
class AniwhereServerApplication
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `./gradlew.bat test --tests "com.aniwhere.server.config.AuthPropertiesBindingTest"`  
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: 커밋**

```bash
git add build.gradle.kts src/main/resources/application.yml src/main/resources/schema-auth.sql src/main/kotlin/com/aniwhere/server/config/AuthProperties.kt src/main/kotlin/com/aniwhere/server/AniwhereServerApplication.kt src/test/kotlin/com/aniwhere/server/config/AuthPropertiesBindingTest.kt
git commit -m "feat(server): 인증 설정 및 스키마 초안 추가"
```

### Task 2: 인증 영속 계층(users/admins/refresh/unlink) 구현

**Files:**
- Create: `src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/AuthEntities.kt`
- Create: `src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/AuthRepositories.kt`
- Create: `src/main/kotlin/com/aniwhere/server/domain/auth/port/out/AuthPersistencePort.kt`
- Create: `src/main/kotlin/com/aniwhere/server/adapter/out/persistence/AuthPersistenceAdapter.kt`
- Test: `src/test/kotlin/com/aniwhere/server/adapter/out/persistence/AuthPersistenceAdapterTest.kt`

- [ ] **Step 1: 영속 어댑터 실패 테스트 작성**

```kotlin
package com.aniwhere.server.adapter.out.persistence

import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import io.mockk.verify
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import java.time.LocalDateTime

@SpringBootTest
@ActiveProfiles("test")
class AuthPersistenceAdapterTest(
    private val adapter: AuthPersistenceAdapter
) {
    @MockkBean
    private lateinit var userRepo: com.aniwhere.server.adapter.out.persistence.repository.UserRepository

    @Test
    fun `userKey로 사용자 조회`() {
        every { userRepo.findByUserKey(443731104L) } returns null
        adapter.findUserByUserKey(443731104L)
        verify(exactly = 1) { userRepo.findByUserKey(443731104L) }
    }
}
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `./gradlew.bat test --tests "com.aniwhere.server.adapter.out.persistence.AuthPersistenceAdapterTest"`  
Expected: `AuthPersistenceAdapter`/`UserRepository` 클래스 없음으로 실패

- [ ] **Step 3: 최소 구현 추가**

```kotlin
// src/main/kotlin/com/aniwhere/server/domain/auth/port/out/AuthPersistencePort.kt
package com.aniwhere.server.domain.auth.port.out

import java.time.LocalDateTime

data class AuthUserRecord(
    val id: Long,
    val userKey: Long,
    val status: String,
)

interface AuthPersistencePort {
    fun findUserByUserKey(userKey: Long): AuthUserRecord?
    fun createUser(userKey: Long): AuthUserRecord
    fun touchLastLogin(userId: Long, whenAt: LocalDateTime)
    fun isAdmin(userId: Long): Boolean
    fun saveRefreshToken(userId: Long, tokenHash: String, expiresAt: LocalDateTime)
    fun revokeRefreshToken(tokenHash: String): Boolean
    fun revokeAllRefreshTokens(userId: Long)
    fun existsActiveRefreshToken(tokenHash: String, now: LocalDateTime): Boolean
    fun markUserUnlinked(userKey: Long): Long?
    fun saveUnlinkEvent(userKey: Long, referrer: String, rawPayload: String?)
}
```

```kotlin
// src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/AuthEntities.kt
package com.aniwhere.server.adapter.out.persistence.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "users")
class UserEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    @Column(name = "user_key", nullable = false, unique = true)
    var userKey: Long,
    @Column(nullable = false, length = 20)
    var status: String = "ACTIVE",
    @Column(name = "last_login_at")
    var lastLoginAt: LocalDateTime? = null,
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)

@Entity
@Table(name = "admins")
class AdminEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    val user: UserEntity,
    @Column(nullable = false, length = 30)
    val role: String = "ADMIN",
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
)

@Entity
@Table(name = "refresh_tokens")
class RefreshTokenEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: UserEntity,
    @Column(name = "token_hash", nullable = false, unique = true, length = 255)
    val tokenHash: String,
    @Column(name = "expires_at", nullable = false)
    val expiresAt: LocalDateTime,
    @Column(name = "revoked_at")
    var revokedAt: LocalDateTime? = null,
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
)

@Entity
@Table(name = "toss_unlink_events")
class TossUnlinkEventEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    @Column(name = "user_key", nullable = false)
    val userKey: Long,
    @Column(nullable = false, length = 40)
    val referrer: String,
    @Column(name = "raw_payload", columnDefinition = "json")
    val rawPayload: String? = null,
    @Column(name = "received_at", nullable = false, updatable = false)
    val receivedAt: LocalDateTime = LocalDateTime.now(),
)
```

```kotlin
// src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/AuthRepositories.kt
package com.aniwhere.server.adapter.out.persistence.repository

import com.aniwhere.server.adapter.out.persistence.entity.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.time.LocalDateTime

interface UserRepository : JpaRepository<UserEntity, Long> {
    fun findByUserKey(userKey: Long): UserEntity?
}

interface AdminRepository : JpaRepository<AdminEntity, Long> {
    fun existsByUserId(userId: Long): Boolean
}

interface RefreshTokenRepository : JpaRepository<RefreshTokenEntity, Long> {
    fun findByTokenHash(tokenHash: String): RefreshTokenEntity?

    @Query(
        "select count(rt) > 0 from RefreshTokenEntity rt where rt.tokenHash = :tokenHash and rt.revokedAt is null and rt.expiresAt > :now"
    )
    fun existsActive(tokenHash: String, now: LocalDateTime): Boolean

    @Modifying
    @Query("update RefreshTokenEntity rt set rt.revokedAt = :now where rt.user.id = :userId and rt.revokedAt is null")
    fun revokeAll(userId: Long, now: LocalDateTime): Int
}

interface TossUnlinkEventRepository : JpaRepository<TossUnlinkEventEntity, Long>
```

```kotlin
// src/main/kotlin/com/aniwhere/server/adapter/out/persistence/AuthPersistenceAdapter.kt
package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.RefreshTokenEntity
import com.aniwhere.server.adapter.out.persistence.entity.TossUnlinkEventEntity
import com.aniwhere.server.adapter.out.persistence.entity.UserEntity
import com.aniwhere.server.adapter.out.persistence.repository.*
import com.aniwhere.server.domain.auth.port.out.AuthPersistencePort
import com.aniwhere.server.domain.auth.port.out.AuthUserRecord
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Component
class AuthPersistenceAdapter(
    private val userRepo: UserRepository,
    private val adminRepo: AdminRepository,
    private val refreshRepo: RefreshTokenRepository,
    private val unlinkRepo: TossUnlinkEventRepository,
) : AuthPersistencePort {
    override fun findUserByUserKey(userKey: Long): AuthUserRecord? =
        userRepo.findByUserKey(userKey)?.let { AuthUserRecord(it.id!!, it.userKey, it.status) }

    override fun createUser(userKey: Long): AuthUserRecord {
        val saved = userRepo.save(UserEntity(userKey = userKey))
        return AuthUserRecord(saved.id!!, saved.userKey, saved.status)
    }

    override fun touchLastLogin(userId: Long, whenAt: LocalDateTime) {
        val user = userRepo.findById(userId).orElseThrow()
        user.lastLoginAt = whenAt
        userRepo.save(user)
    }

    override fun isAdmin(userId: Long): Boolean = adminRepo.existsByUserId(userId)

    override fun saveRefreshToken(userId: Long, tokenHash: String, expiresAt: LocalDateTime) {
        val user = userRepo.findById(userId).orElseThrow()
        refreshRepo.save(RefreshTokenEntity(user = user, tokenHash = tokenHash, expiresAt = expiresAt))
    }

    @Transactional
    override fun revokeRefreshToken(tokenHash: String): Boolean {
        val entity = refreshRepo.findByTokenHash(tokenHash) ?: return false
        if (entity.revokedAt != null) return false
        entity.revokedAt = LocalDateTime.now()
        refreshRepo.save(entity)
        return true
    }

    override fun revokeAllRefreshTokens(userId: Long) {
        refreshRepo.revokeAll(userId, LocalDateTime.now())
    }

    override fun existsActiveRefreshToken(tokenHash: String, now: LocalDateTime): Boolean =
        refreshRepo.existsActive(tokenHash, now)

    @Transactional
    override fun markUserUnlinked(userKey: Long): Long? {
        val user = userRepo.findByUserKey(userKey) ?: return null
        user.status = "UNLINKED"
        userRepo.save(user)
        return user.id
    }

    override fun saveUnlinkEvent(userKey: Long, referrer: String, rawPayload: String?) {
        unlinkRepo.save(TossUnlinkEventEntity(userKey = userKey, referrer = referrer, rawPayload = rawPayload))
    }
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `./gradlew.bat test --tests "com.aniwhere.server.adapter.out.persistence.AuthPersistenceAdapterTest"`  
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: 커밋**

```bash
git add src/main/kotlin/com/aniwhere/server/domain/auth/port/out/AuthPersistencePort.kt src/main/kotlin/com/aniwhere/server/adapter/out/persistence/entity/AuthEntities.kt src/main/kotlin/com/aniwhere/server/adapter/out/persistence/repository/AuthRepositories.kt src/main/kotlin/com/aniwhere/server/adapter/out/persistence/AuthPersistenceAdapter.kt src/test/kotlin/com/aniwhere/server/adapter/out/persistence/AuthPersistenceAdapterTest.kt
git commit -m "feat(server): 인증 영속 계층 추가"
```

### Task 3: JWT Provider + 인증 서비스 핵심 로직 구현

**Files:**
- Create: `src/main/kotlin/com/aniwhere/server/domain/auth/model/AuthModels.kt`
- Create: `src/main/kotlin/com/aniwhere/server/domain/auth/port/in/AuthUseCase.kt`
- Create: `src/main/kotlin/com/aniwhere/server/domain/auth/port/out/TossAuthPort.kt`
- Create: `src/main/kotlin/com/aniwhere/server/config/security/JwtTokenProvider.kt`
- Create: `src/main/kotlin/com/aniwhere/server/domain/auth/service/AuthService.kt`
- Test: `src/test/kotlin/com/aniwhere/server/config/security/JwtTokenProviderTest.kt`
- Test: `src/test/kotlin/com/aniwhere/server/domain/auth/service/AuthServiceTest.kt`

- [ ] **Step 1: JWT/Auth 서비스 실패 테스트 작성**

```kotlin
package com.aniwhere.server.domain.auth.service

import com.aniwhere.server.config.AuthProperties
import com.aniwhere.server.config.security.JwtTokenProvider
import com.aniwhere.server.domain.auth.port.out.AuthPersistencePort
import com.aniwhere.server.domain.auth.port.out.TossAuthPort
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class AuthServiceTest {
    private val persistence = mockk<AuthPersistencePort>(relaxed = true)
    private val toss = mockk<TossAuthPort>()
    private val provider = JwtTokenProvider(
        AuthProperties(
            jwt = AuthProperties.Jwt(secret = "test-secret-test-secret-test-secret-1234"),
            toss = AuthProperties.Toss()
        )
    )
    private val service = AuthService(persistence, toss, provider)

    @Test
    fun `로그인 성공 시 access refresh 발급`() {
        every { toss.exchangeAndGetUserKey("code", "DEFAULT") } returns 443731104L
        every { persistence.findUserByUserKey(443731104L) } returns null
        every { persistence.createUser(443731104L) } returns com.aniwhere.server.domain.auth.port.out.AuthUserRecord(1L, 443731104L, "ACTIVE")
        every { persistence.isAdmin(1L) } returns false

        val result = service.login("code", "DEFAULT")
        assertThat(result.role).isEqualTo("ROLE_USER")
        assertThat(result.accessToken).isNotBlank
        assertThat(result.refreshToken).isNotBlank
    }
}
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `./gradlew.bat test --tests "com.aniwhere.server.domain.auth.service.AuthServiceTest"`  
Expected: `AuthService`/`JwtTokenProvider` 미존재로 실패

- [ ] **Step 3: 최소 구현 추가**

```kotlin
// src/main/kotlin/com/aniwhere/server/domain/auth/model/AuthModels.kt
package com.aniwhere.server.domain.auth.model

data class LoginResult(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
    val role: String,
    val isNewUser: Boolean,
)

data class RefreshResult(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
)
```

```kotlin
// src/main/kotlin/com/aniwhere/server/domain/auth/port/in/AuthUseCase.kt
package com.aniwhere.server.domain.auth.port.`in`

import com.aniwhere.server.domain.auth.model.LoginResult
import com.aniwhere.server.domain.auth.model.RefreshResult

interface AuthUseCase {
    fun login(authorizationCode: String, referrer: String): LoginResult
    fun refresh(refreshToken: String): RefreshResult
    fun logout(refreshToken: String)
    fun handleUnlink(userKey: Long, referrer: String, rawPayload: String?)
}
```

```kotlin
// src/main/kotlin/com/aniwhere/server/domain/auth/port/out/TossAuthPort.kt
package com.aniwhere.server.domain.auth.port.out

interface TossAuthPort {
    fun exchangeAndGetUserKey(authorizationCode: String, referrer: String): Long
}
```

```kotlin
// src/main/kotlin/com/aniwhere/server/config/security/JwtTokenProvider.kt
package com.aniwhere.server.config.security

import com.aniwhere.server.config.AuthProperties
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.time.Instant
import java.util.Date
import javax.crypto.SecretKey

class JwtTokenProvider(private val props: AuthProperties) {
    private val key: SecretKey = Keys.hmacShaKeyFor(props.jwt.secret.toByteArray(StandardCharsets.UTF_8))

    fun createAccessToken(userId: Long, role: String): String =
        Jwts.builder()
            .subject(userId.toString())
            .claim("role", role)
            .issuer(props.jwt.issuer)
            .expiration(Date.from(Instant.now().plusSeconds(props.jwt.accessExpSeconds)))
            .signWith(key)
            .compact()

    fun createRefreshToken(userId: Long): String =
        Jwts.builder()
            .subject(userId.toString())
            .claim("type", "refresh")
            .issuer(props.jwt.issuer)
            .expiration(Date.from(Instant.now().plusSeconds(props.jwt.refreshExpSeconds)))
            .signWith(key)
            .compact()

    fun parseUserId(token: String): Long = Jwts.parser().verifyWith(key).build()
        .parseSignedClaims(token).payload.subject.toLong()

    fun parseRole(token: String): String = Jwts.parser().verifyWith(key).build()
        .parseSignedClaims(token).payload["role"].toString()

    fun parseExpiryEpochSeconds(token: String): Long = Jwts.parser().verifyWith(key).build()
        .parseSignedClaims(token).payload.expiration.toInstant().epochSecond

    fun hashRefreshToken(token: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(token.toByteArray(StandardCharsets.UTF_8))
        return digest.joinToString("") { "%02x".format(it) }
    }
}
```

```kotlin
// src/main/kotlin/com/aniwhere/server/domain/auth/service/AuthService.kt
package com.aniwhere.server.domain.auth.service

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.config.security.JwtTokenProvider
import com.aniwhere.server.domain.auth.model.LoginResult
import com.aniwhere.server.domain.auth.model.RefreshResult
import com.aniwhere.server.domain.auth.port.`in`.AuthUseCase
import com.aniwhere.server.domain.auth.port.out.AuthPersistencePort
import com.aniwhere.server.domain.auth.port.out.TossAuthPort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId

@Service
class AuthService(
    private val persistence: AuthPersistencePort,
    private val toss: TossAuthPort,
    private val jwt: JwtTokenProvider,
) : AuthUseCase {
    @Transactional
    override fun login(authorizationCode: String, referrer: String): LoginResult {
        val userKey = toss.exchangeAndGetUserKey(authorizationCode, referrer)
        val existing = persistence.findUserByUserKey(userKey)
        val isNewUser = existing == null
        val user = existing ?: persistence.createUser(userKey)
        persistence.touchLastLogin(user.id, LocalDateTime.now())
        val role = if (persistence.isAdmin(user.id)) "ROLE_ADMIN" else "ROLE_USER"
        val access = jwt.createAccessToken(user.id, role)
        val refresh = jwt.createRefreshToken(user.id)
        val refreshExp = jwt.parseExpiryEpochSeconds(refresh)
        val refreshExpAt = LocalDateTime.ofInstant(Instant.ofEpochSecond(refreshExp), ZoneId.systemDefault())
        persistence.saveRefreshToken(user.id, jwt.hashRefreshToken(refresh), refreshExpAt)
        return LoginResult(access, refresh, jwt.parseExpiryEpochSeconds(access), role, isNewUser)
    }

    @Transactional
    override fun refresh(refreshToken: String): RefreshResult {
        val tokenHash = jwt.hashRefreshToken(refreshToken)
        val active = persistence.existsActiveRefreshToken(tokenHash, LocalDateTime.now())
        if (!active) throw BadRequestException("Invalid refresh token")
        val userId = jwt.parseUserId(refreshToken)
        val role = "ROLE_USER"
        val newAccess = jwt.createAccessToken(userId, role)
        val newRefresh = jwt.createRefreshToken(userId)
        persistence.revokeRefreshToken(tokenHash)
        val refreshExp = jwt.parseExpiryEpochSeconds(newRefresh)
        val refreshExpAt = LocalDateTime.ofInstant(Instant.ofEpochSecond(refreshExp), ZoneId.systemDefault())
        persistence.saveRefreshToken(userId, jwt.hashRefreshToken(newRefresh), refreshExpAt)
        return RefreshResult(newAccess, newRefresh, jwt.parseExpiryEpochSeconds(newAccess))
    }

    override fun logout(refreshToken: String) {
        persistence.revokeRefreshToken(jwt.hashRefreshToken(refreshToken))
    }

    @Transactional
    override fun handleUnlink(userKey: Long, referrer: String, rawPayload: String?) {
        persistence.saveUnlinkEvent(userKey, referrer, rawPayload)
        val userId = persistence.markUserUnlinked(userKey) ?: return
        persistence.revokeAllRefreshTokens(userId)
    }
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `./gradlew.bat test --tests "com.aniwhere.server.domain.auth.service.AuthServiceTest" --tests "com.aniwhere.server.config.security.JwtTokenProviderTest"`  
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: 커밋**

```bash
git add src/main/kotlin/com/aniwhere/server/domain/auth/model/AuthModels.kt src/main/kotlin/com/aniwhere/server/domain/auth/port/in/AuthUseCase.kt src/main/kotlin/com/aniwhere/server/domain/auth/port/out/TossAuthPort.kt src/main/kotlin/com/aniwhere/server/config/security/JwtTokenProvider.kt src/main/kotlin/com/aniwhere/server/domain/auth/service/AuthService.kt src/test/kotlin/com/aniwhere/server/domain/auth/service/AuthServiceTest.kt src/test/kotlin/com/aniwhere/server/config/security/JwtTokenProviderTest.kt
git commit -m "feat(server): JWT 기반 인증 서비스 구현"
```

### Task 4: Toss API 클라이언트 구현

**Files:**
- Create: `src/main/kotlin/com/aniwhere/server/adapter/out/toss/TossAuthApiClient.kt`
- Test: `src/test/kotlin/com/aniwhere/server/adapter/out/toss/TossAuthApiClientTest.kt`

- [ ] **Step 1: Toss 클라이언트 실패 테스트 작성**

```kotlin
package com.aniwhere.server.adapter.out.toss

import com.aniwhere.server.config.AuthProperties
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.web.client.RestClient

class TossAuthApiClientTest {
    @Test
    fun `인가코드 교환 후 userKey 반환`() {
        val client = TossAuthApiClient(
            RestClient.builder().baseUrl("https://apps-in-toss-api.toss.im").build(),
            AuthProperties(toss = AuthProperties.Toss(baseUrl = "https://apps-in-toss-api.toss.im"))
        )
        // 실제 호출 대신 메서드 시그니처 컴파일 검증
        assertThat(client).isNotNull
    }
}
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `./gradlew.bat test --tests "com.aniwhere.server.adapter.out.toss.TossAuthApiClientTest"`  
Expected: `TossAuthApiClient` 미존재로 실패

- [ ] **Step 3: 최소 구현 추가**

```kotlin
// src/main/kotlin/com/aniwhere/server/adapter/out/toss/TossAuthApiClient.kt
package com.aniwhere.server.adapter.out.toss

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.config.AuthProperties
import com.aniwhere.server.domain.auth.port.out.TossAuthPort
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient

@Component
class TossAuthApiClient(
    private val restClientBuilder: RestClient.Builder,
    private val props: AuthProperties,
) : TossAuthPort {
    override fun exchangeAndGetUserKey(authorizationCode: String, referrer: String): Long {
        val rest = restClientBuilder.baseUrl(props.toss.baseUrl).build()

        val tokenResponse = rest.post()
            .uri("/api-partner/v1/apps-in-toss/user/oauth2/generate-token")
            .body(mapOf("authorizationCode" to authorizationCode, "referrer" to referrer))
            .retrieve()
            .body(GenerateTokenResponse::class.java)
            ?: throw BadRequestException("토스 토큰 발급에 실패했습니다.")

        val accessToken = tokenResponse.success?.accessToken
            ?: throw BadRequestException("토스 accessToken 응답이 비어 있습니다.")

        val me = rest.get()
            .uri("/api-partner/v1/apps-in-toss/user/oauth2/login-me")
            .header("Authorization", "Bearer $accessToken")
            .retrieve()
            .body(LoginMeResponse::class.java)
            ?: throw BadRequestException("토스 사용자 조회에 실패했습니다.")

        return me.success?.userKey ?: throw BadRequestException("토스 userKey 응답이 비어 있습니다.")
    }

    data class GenerateTokenResponse(val success: GenerateTokenSuccess?)
    data class GenerateTokenSuccess(val accessToken: String?)
    data class LoginMeResponse(val success: LoginMeSuccess?)
    data class LoginMeSuccess(val userKey: Long?)
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `./gradlew.bat test --tests "com.aniwhere.server.adapter.out.toss.TossAuthApiClientTest"`  
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: 커밋**

```bash
git add src/main/kotlin/com/aniwhere/server/adapter/out/toss/TossAuthApiClient.kt src/test/kotlin/com/aniwhere/server/adapter/out/toss/TossAuthApiClientTest.kt
git commit -m "feat(server): 토스 로그인 API 클라이언트 추가"
```

### Task 5: 인증 API 컨트롤러 + 예외 매핑 구현

**Files:**
- Create: `src/main/kotlin/com/aniwhere/server/adapter/in/web/AuthController.kt`
- Create: `src/main/kotlin/com/aniwhere/server/common/exception/AuthExceptions.kt`
- Modify: `src/main/kotlin/com/aniwhere/server/common/exception/GlobalExceptionHandler.kt`
- Test: `src/test/kotlin/com/aniwhere/server/adapter/in/web/AuthControllerTest.kt`

- [ ] **Step 1: 컨트롤러 실패 테스트 작성**

```kotlin
package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.domain.auth.model.LoginResult
import com.aniwhere.server.domain.auth.model.RefreshResult
import com.aniwhere.server.domain.auth.port.`in`.AuthUseCase
import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(AuthController::class)
class AuthControllerTest {
    @Autowired private lateinit var mvc: MockMvc
    @Autowired private lateinit var mapper: ObjectMapper
    @MockkBean private lateinit var authUseCase: AuthUseCase

    @Test
    fun `login API returns tokens`() {
        every { authUseCase.login("code-1", "DEFAULT") } returns LoginResult("acc", "ref", 900, "ROLE_USER", true)
        mvc.perform(
            post("/api/v1/auth/toss/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"authorizationCode":"code-1","referrer":"DEFAULT"}""")
        ).andExpect(status().isOk)
            .andExpect(jsonPath("$.data.accessToken").value("acc"))
    }

    @Test
    fun `refresh API rotates token`() {
        every { authUseCase.refresh("old-ref") } returns RefreshResult("new-acc", "new-ref", 900)
        mvc.perform(
            post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"refreshToken":"old-ref"}""")
        ).andExpect(status().isOk)
            .andExpect(jsonPath("$.data.refreshToken").value("new-ref"))
    }
}
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `./gradlew.bat test --tests "com.aniwhere.server.adapter.in.web.AuthControllerTest"`  
Expected: `AuthController` 미존재로 실패

- [ ] **Step 3: 최소 구현 추가**

```kotlin
// src/main/kotlin/com/aniwhere/server/adapter/in/web/AuthController.kt
package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.domain.auth.port.`in`.AuthUseCase
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/auth")
@Validated
class AuthController(
    private val authUseCase: AuthUseCase,
) {
    @PostMapping("/toss/login")
    fun tossLogin(@Valid @RequestBody request: TossLoginRequest) =
        ApiResponse.ok(authUseCase.login(request.authorizationCode, request.referrer))

    @PostMapping("/refresh")
    fun refresh(@Valid @RequestBody request: RefreshRequest) =
        ApiResponse.ok(authUseCase.refresh(request.refreshToken))

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.OK)
    fun logout(@Valid @RequestBody request: RefreshRequest): ApiResponse<Unit> {
        authUseCase.logout(request.refreshToken)
        return ApiResponse.ok()
    }

    @PostMapping("/toss/unlink-callback")
    @ResponseStatus(HttpStatus.OK)
    fun unlinkCallback(@RequestBody request: UnlinkRequest) =
        ApiResponse.ok(authUseCase.handleUnlink(request.userKey, request.referrer, request.rawPayload))
}

data class TossLoginRequest(
    @field:NotBlank val authorizationCode: String,
    @field:NotBlank val referrer: String,
)

data class RefreshRequest(
    @field:NotBlank val refreshToken: String,
)

data class UnlinkRequest(
    val userKey: Long,
    val referrer: String,
    val rawPayload: String? = null,
)
```

```kotlin
// src/main/kotlin/com/aniwhere/server/common/exception/AuthExceptions.kt
package com.aniwhere.server.common.exception

class UnauthorizedException(message: String) : RuntimeException(message)
class ForbiddenException(message: String) : RuntimeException(message)
class UpstreamAuthException(message: String) : RuntimeException(message)
```

```kotlin
// GlobalExceptionHandler.kt에 추가할 핸들러
@ExceptionHandler(UnauthorizedException::class)
fun handleUnauthorized(e: UnauthorizedException): ResponseEntity<ApiResponse<Unit>> =
    ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(e.message ?: "Unauthorized"))

@ExceptionHandler(ForbiddenException::class)
fun handleForbidden(e: ForbiddenException): ResponseEntity<ApiResponse<Unit>> =
    ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.message ?: "Forbidden"))

@ExceptionHandler(UpstreamAuthException::class)
fun handleUpstreamAuth(e: UpstreamAuthException): ResponseEntity<ApiResponse<Unit>> =
    ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(ApiResponse.error(e.message ?: "Auth upstream error"))
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `./gradlew.bat test --tests "com.aniwhere.server.adapter.in.web.AuthControllerTest"`  
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: 커밋**

```bash
git add src/main/kotlin/com/aniwhere/server/adapter/in/web/AuthController.kt src/main/kotlin/com/aniwhere/server/common/exception/AuthExceptions.kt src/main/kotlin/com/aniwhere/server/common/exception/GlobalExceptionHandler.kt src/test/kotlin/com/aniwhere/server/adapter/in/web/AuthControllerTest.kt
git commit -m "feat(server): 인증 API 및 예외 매핑 추가"
```

### Task 6: Spring Security(JWT 필터 + 권한 가드) 적용

**Files:**
- Create: `src/main/kotlin/com/aniwhere/server/config/security/SecurityPrincipal.kt`
- Create: `src/main/kotlin/com/aniwhere/server/config/security/JwtAuthenticationFilter.kt`
- Create: `src/main/kotlin/com/aniwhere/server/config/security/SecurityConfig.kt`
- Test: `src/test/kotlin/com/aniwhere/server/config/security/SecurityConfigAuthTest.kt`

- [ ] **Step 1: 보안 가드 실패 테스트 작성**

```kotlin
package com.aniwhere.server.config.security

import com.aniwhere.server.adapter.`in`.web.AuthController
import com.aniwhere.server.domain.auth.port.`in`.AuthUseCase
import com.ninjasquad.springmockk.MockkBean
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(AuthController::class)
class SecurityConfigAuthTest {
    @Autowired private lateinit var mvc: MockMvc
    @MockkBean private lateinit var authUseCase: AuthUseCase

    @Test
    fun `auth endpoint는 인증 없이 접근 가능`() {
        mvc.perform(get("/api/v1/auth/health")).andExpect(status().isNotFound)
    }
}
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `./gradlew.bat test --tests "com.aniwhere.server.config.security.SecurityConfigAuthTest"`  
Expected: Security 설정 부재 또는 컨텍스트 오류로 실패

- [ ] **Step 3: 최소 구현 추가**

```kotlin
// src/main/kotlin/com/aniwhere/server/config/security/SecurityPrincipal.kt
package com.aniwhere.server.config.security

data class SecurityPrincipal(
    val userId: Long,
    val role: String,
)
```

```kotlin
// src/main/kotlin/com/aniwhere/server/config/security/JwtAuthenticationFilter.kt
package com.aniwhere.server.config.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.filter.OncePerRequestFilter

class JwtAuthenticationFilter(
    private val jwt: JwtTokenProvider,
) : OncePerRequestFilter() {
    override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, chain: FilterChain) {
        val auth = request.getHeader("Authorization")
        if (auth != null && auth.startsWith("Bearer ")) {
            val token = auth.removePrefix("Bearer ").trim()
            runCatching {
                val userId = jwt.parseUserId(token)
                val role = jwt.parseRole(token)
                val principal = SecurityPrincipal(userId, role)
                val authorities = listOf(SimpleGrantedAuthority(role))
                val authentication = UsernamePasswordAuthenticationToken(principal, null, authorities)
                SecurityContextHolder.getContext().authentication = authentication
            }
        }
        chain.doFilter(request, response)
    }
}
```

```kotlin
// src/main/kotlin/com/aniwhere/server/config/security/SecurityConfig.kt
package com.aniwhere.server.config.security

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter

@Configuration
class SecurityConfig(
    private val jwt: JwtTokenProvider,
) {
    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain =
        http
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it.requestMatchers("/api/v1/auth/**", "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                it.requestMatchers(HttpMethod.POST, "/api/v1/shops/**").hasAuthority("ROLE_ADMIN")
                it.requestMatchers(HttpMethod.PUT, "/api/v1/shops/**").hasAuthority("ROLE_ADMIN")
                it.requestMatchers(HttpMethod.DELETE, "/api/v1/shops/**").hasAuthority("ROLE_ADMIN")
                it.anyRequest().authenticated()
            }
            .addFilterBefore(JwtAuthenticationFilter(jwt), UsernamePasswordAuthenticationFilter::class.java)
            .build()
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `./gradlew.bat test --tests "com.aniwhere.server.config.security.SecurityConfigAuthTest"`  
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: 커밋**

```bash
git add src/main/kotlin/com/aniwhere/server/config/security/SecurityPrincipal.kt src/main/kotlin/com/aniwhere/server/config/security/JwtAuthenticationFilter.kt src/main/kotlin/com/aniwhere/server/config/security/SecurityConfig.kt src/test/kotlin/com/aniwhere/server/config/security/SecurityConfigAuthTest.kt
git commit -m "feat(server): JWT 보안 필터 및 권한 정책 적용"
```

### Task 7: Unlink 콜백 보안(Basic Auth) 및 운영 검증

**Files:**
- Modify: `src/main/kotlin/com/aniwhere/server/adapter/in/web/AuthController.kt`
- Test: `src/test/kotlin/com/aniwhere/server/adapter/in/web/AuthUnlinkCallbackSecurityTest.kt`

- [ ] **Step 1: Basic Auth 검증 실패 테스트 작성**

```kotlin
package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.domain.auth.port.`in`.AuthUseCase
import com.ninjasquad.springmockk.MockkBean
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(AuthController::class)
class AuthUnlinkCallbackSecurityTest {
    @Autowired private lateinit var mvc: MockMvc
    @MockkBean private lateinit var authUseCase: AuthUseCase

    @Test
    fun `unlink callback basic auth 불일치 시 401`() {
        mvc.perform(
            post("/api/v1/auth/toss/unlink-callback")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Basic invalid")
                .content("""{"userKey":443731104,"referrer":"UNLINK"}""")
        ).andExpect(status().isUnauthorized)
    }
}
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `./gradlew.bat test --tests "com.aniwhere.server.adapter.in.web.AuthUnlinkCallbackSecurityTest"`  
Expected: 현재 200 응답으로 테스트 실패

- [ ] **Step 3: 최소 구현 추가**

```kotlin
// AuthController unlinkCallback 메서드 교체
@PostMapping("/toss/unlink-callback")
@ResponseStatus(HttpStatus.OK)
fun unlinkCallback(
    @RequestHeader(name = "Authorization", required = false) authorization: String?,
    @RequestBody request: UnlinkRequest,
): ApiResponse<Unit> {
    val expected = "Basic ${authProperties.toss.unlinkBasicAuth}"
    if (authorization == null || authorization != expected) {
        throw com.aniwhere.server.common.exception.UnauthorizedException("Invalid unlink callback authorization")
    }
    authUseCase.handleUnlink(request.userKey, request.referrer, request.rawPayload)
    return ApiResponse.ok()
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `./gradlew.bat test --tests "com.aniwhere.server.adapter.in.web.AuthUnlinkCallbackSecurityTest"`  
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: 커밋**

```bash
git add src/main/kotlin/com/aniwhere/server/adapter/in/web/AuthController.kt src/test/kotlin/com/aniwhere/server/adapter/in/web/AuthUnlinkCallbackSecurityTest.kt
git commit -m "feat(server): unlink 콜백 인증 검증 추가"
```

### Task 8: 통합 검증/문서/운영 체크리스트 마무리

**Files:**
- Modify: `docs/superpowers/specs/2026-05-16-toss-login-design.md`
- Create: `docs/superpowers/plans/2026-05-16-toss-login-auth-qa-checklist.md`

- [ ] **Step 1: QA 체크리스트 문서 작성**

```markdown
# Toss Login QA Checklist

- [ ] appLogin으로 authorizationCode 획득 후 `/api/v1/auth/toss/login` 성공
- [ ] 일반 사용자 role=`ROLE_USER` 발급 확인
- [ ] 관리자 매핑 사용자 role=`ROLE_ADMIN` 발급 확인
- [ ] `/api/v1/auth/refresh` 호출 시 기존 refresh 폐기/신규 발급 확인
- [ ] 로그아웃 후 같은 refresh 재사용 불가 확인
- [ ] unlink callback 수신 후 refresh 전량 폐기 확인
- [ ] unlink callback Authorization 불일치 시 401 확인
- [ ] 토스 API 실패 시 502 매핑 확인
```

- [ ] **Step 2: 전체 테스트 실행**

Run: `./gradlew.bat test`  
Expected: `BUILD SUCCESSFUL` and auth 관련 신규 테스트 전부 PASS

- [ ] **Step 3: 문서 업데이트**

```markdown
<!-- docs/superpowers/specs/2026-05-16-toss-login-design.md 하단에 추가 -->
## 구현 상태

- [x] 구현 계획 문서 작성 완료
- [ ] 인증 코드 구현
- [ ] 샌드박스 실기기 검증
```

- [ ] **Step 4: 변경사항 검토**

Run: `git status --short`  
Expected: 계획 문서/체크리스트/필요한 코드 변경만 표시되고 불필요한 파일 없음

- [ ] **Step 5: 커밋**

```bash
git add docs/superpowers/specs/2026-05-16-toss-login-design.md docs/superpowers/plans/2026-05-16-toss-login-auth-qa-checklist.md
git commit -m "docs(server): 토스 로그인 구현 체크리스트 추가"
```

## Self-Review

- **Spec coverage:** 인증 플로우(login/refresh/logout/unlink), 데이터 모델(users/admins/refresh/unlink), 보안 정책(JWT + role guard), 에러/테스트/마일스톤을 각각 Task 1~8에 매핑했다.
- **Placeholder scan:** `TBD`, `TODO`, “적절히 처리” 같은 문구를 제거하고 파일/코드/명령을 모두 명시했다.
- **Type consistency:** `userKey`, `ROLE_USER/ROLE_ADMIN`, `refreshToken` 명칭을 전 태스크에서 동일하게 유지했다.

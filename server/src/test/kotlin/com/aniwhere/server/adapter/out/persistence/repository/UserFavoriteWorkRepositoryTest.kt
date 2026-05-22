package com.aniwhere.server.adapter.out.persistence.repository

import com.aniwhere.server.adapter.out.persistence.entity.FavoriteWorkSource
import com.aniwhere.server.adapter.out.persistence.entity.UserEntity
import com.aniwhere.server.adapter.out.persistence.entity.UserFavoriteWorkEntity
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager
import org.springframework.dao.DataIntegrityViolationException
import java.time.LocalDateTime

@DataJpaTest(
    properties = [
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.datasource.url=jdbc:h2:mem:user-favorite-work-repo;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.sql.init.mode=always",
        "spring.sql.init.schema-locations=classpath:test-auth-schema.sql",
    ],
)
class UserFavoriteWorkRepositoryTest {

    @Autowired
    private lateinit var entityManager: TestEntityManager

    @Autowired
    private lateinit var repository: UserFavoriteWorkRepository

    @Test
    fun `중복 user-work 저장 시 unique 제약 위반`() {
        val user = entityManager.persist(UserEntity(userKey = 101L))
        repository.saveAndFlush(
            UserFavoriteWorkEntity(
                user = user,
                workId = 11,
                source = FavoriteWorkSource.ONBOARDING,
            ),
        )

        assertThrows(DataIntegrityViolationException::class.java) {
            repository.saveAndFlush(
                UserFavoriteWorkEntity(
                    user = user,
                    workId = 11,
                    source = FavoriteWorkSource.MANUAL,
                ),
            )
        }
    }

    @Test
    fun `사용자별 최신순 조회`() {
        val user = entityManager.persist(UserEntity(userKey = 201L))
        val otherUser = entityManager.persist(UserEntity(userKey = 202L))

        val first = repository.save(
            UserFavoriteWorkEntity(
                user = user,
                workId = 1001,
                source = FavoriteWorkSource.ONBOARDING,
                createdAt = LocalDateTime.of(2026, 5, 20, 10, 0, 0),
                updatedAt = LocalDateTime.of(2026, 5, 20, 10, 0, 0),
            ),
        )
        val second = repository.save(
            UserFavoriteWorkEntity(
                user = user,
                workId = 1002,
                source = FavoriteWorkSource.MANUAL,
                createdAt = LocalDateTime.of(2026, 5, 20, 11, 0, 0),
                updatedAt = LocalDateTime.of(2026, 5, 20, 11, 0, 0),
            ),
        )
        repository.save(
            UserFavoriteWorkEntity(
                user = otherUser,
                workId = 2001,
                source = FavoriteWorkSource.MANUAL,
                createdAt = LocalDateTime.of(2026, 5, 20, 12, 0, 0),
                updatedAt = LocalDateTime.of(2026, 5, 20, 12, 0, 0),
            ),
        )
        entityManager.flush()
        entityManager.clear()

        val result = repository.findAllByUserIdOrderByCreatedAtDesc(user.id!!)

        assertEquals(2, result.size)
        assertEquals(second.id, result[0].id)
        assertEquals(first.id, result[1].id)
    }

    @Test
    fun `createdAt 동률이면 id 내림차순으로 조회`() {
        val user = entityManager.persist(UserEntity(userKey = 301L))
        val sameCreatedAt = LocalDateTime.of(2026, 5, 21, 9, 0, 0)

        val first = repository.save(
            UserFavoriteWorkEntity(
                user = user,
                workId = 3001,
                source = FavoriteWorkSource.ONBOARDING,
                createdAt = sameCreatedAt,
                updatedAt = sameCreatedAt,
            ),
        )
        val second = repository.save(
            UserFavoriteWorkEntity(
                user = user,
                workId = 3002,
                source = FavoriteWorkSource.MANUAL,
                createdAt = sameCreatedAt,
                updatedAt = sameCreatedAt,
            ),
        )
        entityManager.flush()
        entityManager.clear()

        val result = repository.findAllByUserIdOrderByCreatedAtDesc(user.id!!)

        assertEquals(2, result.size)
        assertEquals(second.id, result[0].id)
        assertEquals(first.id, result[1].id)
    }
}

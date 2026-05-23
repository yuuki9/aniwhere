package com.aniwhere.server.adapter.out.persistence.repository

import com.aniwhere.server.adapter.out.persistence.entity.UserEntity
import com.aniwhere.server.adapter.out.persistence.entity.UserFavoriteShopEntity
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager
import org.springframework.dao.DataIntegrityViolationException

@DataJpaTest(
    properties = [
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.datasource.url=jdbc:h2:mem:user-favorite-shop-repo;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.sql.init.mode=always",
        "spring.sql.init.schema-locations=classpath:test-auth-schema.sql",
    ],
)
class UserFavoriteShopRepositoryTest {

    @Autowired
    private lateinit var entityManager: TestEntityManager

    @Autowired
    private lateinit var repository: UserFavoriteShopRepository

    @Test
    fun `중복 user-shop 저장 시 unique 제약 위반`() {
        val user = entityManager.persist(UserEntity(userKey = 999L))
        repository.saveAndFlush(UserFavoriteShopEntity(user = user, shopId = 10L))

        assertThrows(DataIntegrityViolationException::class.java) {
            repository.saveAndFlush(UserFavoriteShopEntity(user = user, shopId = 10L))
        }
    }
}

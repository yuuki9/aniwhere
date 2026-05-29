package com.aniwhere.server.domain.favorite.service

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.domain.favorite.port.out.UserFavoritePersistencePort
import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.model.ShopStatus
import io.mockk.every
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import java.math.BigDecimal

@ExtendWith(MockKExtension::class)
class UserFavoriteServiceTest {

    @MockK
    private lateinit var port: UserFavoritePersistencePort

    @InjectMockKs
    private lateinit var service: UserFavoriteService

    @Test
    fun `listFavoriteShops - 내 즐겨찾기 매장 목록 조회`() {
        val favoriteShops = listOf(
            Shop(
                id = 5L,
                name = "최애샵",
                address = "서울시 마포구",
                px = BigDecimal("126.9200"),
                py = BigDecimal("37.5500"),
                status = ShopStatus.ACTIVE,
            ),
        )
        every { port.existsUser(1L) } returns true
        every { port.findFavoriteShops(1L) } returns favoriteShops

        val result = service.listFavoriteShops(1L)

        verify { port.findFavoriteShops(1L) }
        assertEquals(1, result.size)
        assertEquals(5L, result.first().id)
    }

    @Test
    fun `addFavoriteWork - 존재하지 않는 작품이면 예외`() {
        every { port.existsUser(1L) } returns true
        every { port.existsWork(999) } returns false

        assertThrows<EntityNotFoundException> {
            service.addFavoriteWork(1L, 999)
        }
    }

    @Test
    fun `addFavoriteWork - 이미 즐겨찾기된 작품이면 저장하지 않음`() {
        every { port.existsUser(1L) } returns true
        every { port.existsWork(10) } returns true
        every { port.existsFavoriteWork(1L, 10) } returns true

        service.addFavoriteWork(1L, 10)

        verify(exactly = 0) { port.saveFavoriteWork(any(), any()) }
    }

    @Test
    fun `addFavoriteShop - 정상 추가`() {
        every { port.existsUser(1L) } returns true
        every { port.existsShop(5L) } returns true
        every { port.existsFavoriteShop(1L, 5L) } returns false
        every { port.saveFavoriteShop(1L, 5L) } returns Unit

        service.addFavoriteShop(1L, 5L)

        verify { port.saveFavoriteShop(1L, 5L) }
    }

    @Test
    fun `removeFavoriteShop - 유효하지 않은 id면 예외`() {
        assertThrows<BadRequestException> {
            service.removeFavoriteShop(1L, 0L)
        }
    }
}

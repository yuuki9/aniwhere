package com.aniwhere.server.adapter.out.persistence.mapper

import com.aniwhere.server.adapter.out.persistence.entity.CategoryEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopStatusEnum
import com.aniwhere.server.config.ShopImagesS3Properties
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.math.BigDecimal

class ShopMapperTest {

    private val mapper = ShopMapper(ShopImagesS3Properties())

    @Test
    fun `toDomain - categories는 WorkSummary와 같이 id와 name 객체 배열`() {
        val entity = ShopEntity(
            id = 1L,
            name = "테스트샵",
            address = "서울",
            px = BigDecimal.ONE,
            py = BigDecimal.ONE,
            status = ShopStatusEnum.active,
        ).apply {
            categories.add(CategoryEntity(id = 2, name = "굿즈"))
            categories.add(CategoryEntity(id = 1, name = "피규어"))
        }

        val shop = mapper.toDomain(entity)

        assertEquals(
            listOf(
                com.aniwhere.server.domain.category.model.CategorySummary(id = 2, name = "굿즈"),
                com.aniwhere.server.domain.category.model.CategorySummary(id = 1, name = "피규어"),
            ),
            shop.categories,
        )
    }
}

package com.aniwhere.server.adapter.out.persistence.mapper

import com.aniwhere.server.adapter.out.persistence.entity.ShopReviewEntity
import com.aniwhere.server.adapter.out.persistence.entity.UserEntity
import com.aniwhere.server.config.ReviewImagesS3Properties
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

class ShopReviewMapperTest {

    private val mapper = ShopReviewMapper(ReviewImagesS3Properties())

    @Test
    fun `toDomain - 작성자 닉네임과 이모지 파일명을 users에서 매핑한다`() {
        val author = UserEntity(
            id = 10L,
            userKey = 100L,
            nickname = "  테스트유저  ",
            emojiIconFilename = "mashiro.png",
        )
        val entity = ShopReviewEntity(
            id = 1L,
            shopId = 2L,
            author = author,
            rating = 4,
            content = "좋은 샵이에요",
        )

        val review = mapper.toDomain(entity)

        assertEquals("테스트유저", review.authorNickname)
        assertEquals("mashiro.png", review.authorEmojiIconFilename)
    }

    @Test
    fun `toDomain - 이모지 파일명이 없으면 null을 반환한다`() {
        val author = UserEntity(
            id = 10L,
            userKey = 100L,
            nickname = "테스트유저",
            emojiIconFilename = null,
        )
        val entity = ShopReviewEntity(
            id = 1L,
            shopId = 2L,
            author = author,
            rating = 4,
            content = "좋은 샵이에요",
        )

        val review = mapper.toDomain(entity)

        assertNull(review.authorEmojiIconFilename)
    }
}

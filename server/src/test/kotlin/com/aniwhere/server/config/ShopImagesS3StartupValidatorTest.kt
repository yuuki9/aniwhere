package com.aniwhere.server.config

import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.boot.DefaultApplicationArguments

class ShopImagesS3StartupValidatorTest {

    private val noArgs = DefaultApplicationArguments()

    @Test
    fun `버킷이 비었고 스킵이 아니면 기동 검증 실패`() {
        val validator = ShopImagesS3StartupValidator(ShopImagesS3Properties())
        assertThrows(IllegalStateException::class.java) {
            validator.run(noArgs)
        }
    }

    @Test
    fun `버킷이 비어도 스킵이면 통과`() {
        val validator = ShopImagesS3StartupValidator(
            ShopImagesS3Properties(skipStartupBucketCheck = true),
        )
        validator.run(noArgs)
    }

    @Test
    fun `버킷이 있으면 통과`() {
        val validator = ShopImagesS3StartupValidator(
            ShopImagesS3Properties(bucket = "some-bucket"),
        )
        validator.run(noArgs)
    }
}

package com.aniwhere.server.config

import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component

/**
 * 배포 시 버킷 미설정을 요청 처리 중이 아니라 기동 단계에서 차단한다.
 * 로컬에서는 [ShopImagesS3Properties.skipStartupBucketCheck] 를 켜거나
 * `APP_S3_SHOP_IMAGES_SKIP_STARTUP_BUCKET_CHECK=true` 로 우회한다.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class ShopImagesS3StartupValidator(
    private val props: ShopImagesS3Properties,
) : ApplicationRunner {
    override fun run(args: ApplicationArguments) {
        if (props.skipStartupBucketCheck) return
        if (props.bucket.trim().isNotEmpty()) return
        throw IllegalStateException(
            "app.s3.shop-images.bucket(AWS_S3_SHOP_IMAGES_BUCKET)이 비어 있어 기동을 중단했습니다. " +
                "로컬에서 버킷 없이 띄우려면 APP_S3_SHOP_IMAGES_SKIP_STARTUP_BUCKET_CHECK=true 를 설정하세요.",
        )
    }
}

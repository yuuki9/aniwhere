package com.aniwhere.server.config

import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class ReviewImagesS3StartupValidator(
    private val props: ReviewImagesS3Properties,
) : ApplicationRunner {
    override fun run(args: ApplicationArguments) {
        if (props.skipStartupBucketCheck) return
        if (props.bucket.trim().isNotEmpty()) return
        throw IllegalStateException(
            "app.s3.review-images.bucket(AWS_S3_REVIEW_IMAGES_BUCKET)이 비어 있어 기동을 중단했습니다. " +
                "로컬에서 버킷 없이 띄우려면 APP_S3_REVIEW_IMAGES_SKIP_STARTUP_BUCKET_CHECK=true 를 설정하세요.",
        )
    }
}

package com.aniwhere.server.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Configuration

@ConfigurationProperties(prefix = "app.s3.review-images")
data class ReviewImagesS3Properties(
    val bucket: String = "",
    val region: String = "ap-northeast-2",
    val publicBaseUrl: String = "",
    val apiPublicUrl: String = "https://api.aniwhere.link",
    val useApiProxyUrls: Boolean = true,
    val skipStartupBucketCheck: Boolean = false,
) {
    fun resolvePublicUrl(s3Key: String): String {
        if (useApiProxyUrls) {
            val base = apiPublicUrl.trimEnd('/')
            val relative = s3Key.removePrefix("$KEY_PREFIX/")
            return "$base/api/v1/review-images/$relative"
        }

        val base = publicBaseUrl.trimEnd('/')
        if (base.isNotEmpty()) return "$base/$s3Key"
        val b = bucket.trim()
        if (b.isEmpty()) return s3Key
        return "https://$b.s3.$region.amazonaws.com/$s3Key"
    }

    companion object {
        const val KEY_PREFIX = "img/review"
    }
}

@Configuration
@EnableConfigurationProperties(ReviewImagesS3Properties::class)
class ReviewImagesS3Configuration

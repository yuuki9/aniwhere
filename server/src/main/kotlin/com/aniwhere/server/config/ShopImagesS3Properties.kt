package com.aniwhere.server.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Configuration

@ConfigurationProperties(prefix = "app.s3.shop-images")
data class ShopImagesS3Properties(
    val bucket: String = "",
    val region: String = "ap-northeast-2",
    val publicBaseUrl: String = "",
    val apiPublicUrl: String = "https://api.aniwhere.link",
    val useApiProxyUrls: Boolean = true,
    /** true면 버킷 비어 있어도 기동 허용 (로컬 전용 권장). */
    val skipStartupBucketCheck: Boolean = false,
) {
    fun resolvePublicUrl(s3Key: String): String {
        if (useApiProxyUrls) {
            val base = apiPublicUrl.trimEnd('/')
            return "$base/api/v1/shop-images/$s3Key"
        }

        val base = publicBaseUrl.trimEnd('/')
        if (base.isNotEmpty()) return "$base/$s3Key"
        val b = bucket.trim()
        if (b.isEmpty()) return s3Key
        return "https://$b.s3.$region.amazonaws.com/$s3Key"
    }
}

@Configuration
@EnableConfigurationProperties(ShopImagesS3Properties::class)
class ShopImagesS3Configuration

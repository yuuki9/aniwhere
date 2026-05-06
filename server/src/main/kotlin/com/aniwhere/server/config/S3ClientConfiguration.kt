package com.aniwhere.server.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client

@Configuration
class S3ClientConfiguration(
    private val shopImagesS3Properties: ShopImagesS3Properties,
) {
    @Bean
    fun s3Client(): S3Client =
        S3Client.builder()
            .region(Region.of(shopImagesS3Properties.region))
            .build()
}

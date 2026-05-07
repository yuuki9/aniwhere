package com.aniwhere.server.adapter.out.storage

import com.aniwhere.server.config.ShopImagesS3Properties
import org.junit.jupiter.api.Assertions.assertArrayEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest
import software.amazon.awssdk.services.s3.model.GetObjectRequest
import java.util.UUID

/**
 * 실제 S3 업로드 검증. 기본 `test` 태스크에서는 비활성화됨.
 *
 * PowerShell 예:
 *   $env:RUN_S3_SHOP_IMAGE_TEST="1"
 *   $env:AWS_S3_SHOP_IMAGES_BUCKET="(버킷 이름)"
 *   ./gradlew test --tests "com.aniwhere.server.adapter.out.storage.S3ShopImageStorageIntegrationTest"
 *
 * 자격 증명은 AWS CLI와 동일(Default credential chain + AWS_REGION).
 */
@EnabledIfEnvironmentVariable(named = "RUN_S3_SHOP_IMAGE_TEST", matches = "1")
class S3ShopImageStorageIntegrationTest {

    private val bucket: String =
        System.getenv("AWS_S3_SHOP_IMAGES_BUCKET")?.trim().orEmpty()

    private val region: String =
        System.getenv("AWS_REGION")?.trim()?.takeIf { it.isNotEmpty() } ?: "ap-northeast-2"

    @Test
    fun `S3ShopImageStorageAdapter putObject 후 객체를 읽어 내용이 같다`() {
        require(bucket.isNotEmpty()) {
            "RUN_S3_SHOP_IMAGE_TEST=1 일 때 AWS_S3_SHOP_IMAGES_BUCKET 이 필요합니다."
        }
        val key = "999999997/s3-probe-${UUID.randomUUID()}.txt"
        val body = "aniwhere-s3-probe ${System.currentTimeMillis()}\n".toByteArray(Charsets.UTF_8)

        S3Client.builder().region(Region.of(region)).build().use { s3 ->
            try {
                val adapter = S3ShopImageStorageAdapter(
                    s3,
                    ShopImagesS3Properties(bucket = bucket, region = region),
                )
                adapter.putObject(key, body, "text/plain; charset=utf-8")
                val downloaded = s3.getObjectAsBytes(
                    GetObjectRequest.builder().bucket(bucket).key(key).build(),
                ).asByteArray()
                assertArrayEquals(body, downloaded)
            } finally {
                runCatching {
                    s3.deleteObject(
                        DeleteObjectRequest.builder().bucket(bucket).key(key).build(),
                    )
                }
            }
        }
    }
}

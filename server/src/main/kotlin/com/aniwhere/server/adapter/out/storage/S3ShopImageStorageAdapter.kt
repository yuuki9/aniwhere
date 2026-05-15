package com.aniwhere.server.adapter.out.storage

import com.aniwhere.server.config.ShopImagesS3Properties
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.domain.shop.port.out.ShopImageStoragePort
import com.aniwhere.server.domain.shop.port.out.StoredShopImage
import org.springframework.stereotype.Component
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest
import software.amazon.awssdk.services.s3.model.GetObjectRequest
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import software.amazon.awssdk.services.s3.model.S3Exception

@Component
class S3ShopImageStorageAdapter(
    private val s3: S3Client,
    private val props: ShopImagesS3Properties,
) : ShopImageStoragePort {
    override fun putObject(key: String, body: ByteArray, contentType: String) {
        val bucket = props.bucket.trim().ifEmpty {
            error("app.s3.shop-images.bucket is not set")
        }
        s3.putObject(
            PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .build(),
            RequestBody.fromBytes(body),
        )
    }

    override fun getObject(key: String): StoredShopImage {
        val bucket = props.bucket.trim().ifEmpty {
            error("app.s3.shop-images.bucket is not set")
        }
        return try {
            s3.getObject(GetObjectRequest.builder().bucket(bucket).key(key).build()).use { response ->
                StoredShopImage(
                    body = response.readAllBytes(),
                    contentType = response.response().contentType() ?: "application/octet-stream",
                )
            }
        } catch (e: S3Exception) {
            if (e.statusCode() == 404 || e.awsErrorDetails()?.errorCode() == "NoSuchKey") {
                throw EntityNotFoundException("이미지를 찾을 수 없습니다.")
            }
            throw e
        }
    }

    override fun deleteObject(key: String) {
        val bucket = props.bucket.trim().ifEmpty {
            error("app.s3.shop-images.bucket is not set")
        }
        runCatching {
            s3.deleteObject(
                DeleteObjectRequest.builder().bucket(bucket).key(key).build(),
            )
        }
    }
}

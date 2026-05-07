package com.aniwhere.server.adapter.out.storage

import com.aniwhere.server.config.ShopImagesS3Properties
import com.aniwhere.server.domain.shop.port.out.ShopImageStoragePort
import org.springframework.stereotype.Component
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest
import software.amazon.awssdk.services.s3.model.PutObjectRequest

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

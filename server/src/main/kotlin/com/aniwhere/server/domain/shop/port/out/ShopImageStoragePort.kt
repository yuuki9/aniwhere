package com.aniwhere.server.domain.shop.port.out

/**
 * 상점 이미지 바이너리 저장소(S3 등).
 */
interface ShopImageStoragePort {
    fun putObject(key: String, body: ByteArray, contentType: String)

    fun getObject(key: String): StoredShopImage

    /** 업로드 실패 보상 등. 해당 키가 없어도 idempotent 하게 처리합니다. */
    fun deleteObject(key: String)
}

data class StoredShopImage(
    val body: ByteArray,
    val contentType: String,
)

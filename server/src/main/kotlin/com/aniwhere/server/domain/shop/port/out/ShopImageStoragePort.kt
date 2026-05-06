package com.aniwhere.server.domain.shop.port.out

/**
 * 업로드된 객체의 S3 키(프리픽스 없이 bucket 기준 전체 키)를 반환합니다.
 */
interface ShopImageStoragePort {
    fun putObject(key: String, body: ByteArray, contentType: String)
}

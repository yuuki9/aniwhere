package com.aniwhere.server.domain.shop.model

data class ShopImage(
    val id: Long? = null,
    val url: String,
    val role: ShopImageRole,
    val sortOrder: Int,
)

enum class ShopImageRole {
    PRIMARY,
    GALLERY,
}

class ImageUploadPart(
    val bytes: ByteArray,
    val contentType: String,
)

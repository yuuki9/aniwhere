package com.aniwhere.server.adapter.out.persistence.entity

import jakarta.persistence.*

enum class ShopImageRoleEnum {
    primary,
    gallery,
}

@Entity
@Table(name = "shop_images")
class ShopImageEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    var shop: ShopEntity,

    @Column(name = "s3_key", nullable = false, length = 512)
    val s3Key: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    val role: ShopImageRoleEnum,

    @Column(name = "sort_order", nullable = false)
    val sortOrder: Int,
)

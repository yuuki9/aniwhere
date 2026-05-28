package com.aniwhere.server.adapter.out.persistence.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "shop_reviews")
class ShopReviewEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(name = "shop_id", nullable = false)
    val shopId: Long,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_user_id", nullable = false)
    val author: UserEntity,

    @Column(nullable = false)
    var rating: Int,

    @Column(nullable = false, columnDefinition = "TEXT")
    var content: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: ShopReviewStatusEnum = ShopReviewStatusEnum.VISIBLE,

    @OneToMany(mappedBy = "review", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    var images: MutableList<ShopReviewImageEntity> = mutableListOf(),

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)

enum class ShopReviewStatusEnum { VISIBLE, HIDDEN, DELETED }

@Entity
@Table(name = "shop_review_images")
class ShopReviewImageEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    val review: ShopReviewEntity,

    @Column(name = "s3_key", nullable = false, length = 500)
    val s3Key: String,

    @Column(name = "sort_order", nullable = false)
    val sortOrder: Int,
)

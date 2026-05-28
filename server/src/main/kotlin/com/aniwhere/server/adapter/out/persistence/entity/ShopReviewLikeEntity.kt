package com.aniwhere.server.adapter.out.persistence.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "shop_review_likes",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_shop_review_likes_review_user",
            columnNames = ["review_id", "user_id"],
        ),
    ],
    indexes = [
        Index(name = "idx_shop_review_likes_review", columnList = "review_id"),
        Index(name = "idx_shop_review_likes_user", columnList = "user_id"),
    ],
)
class ShopReviewLikeEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    val review: ShopReviewEntity,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: UserEntity,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
)

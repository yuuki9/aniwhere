package com.aniwhere.server.adapter.out.persistence.entity

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDateTime

@Entity
@Table(name = "shops")
class ShopEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false, length = 100) var name: String,
    @Column(nullable = false, length = 255) var address: String,
    @Column(nullable = false, precision = 10, scale = 7) var px: BigDecimal,
    @Column(nullable = false, precision = 10, scale = 7) var py: BigDecimal,
    @Column(length = 20) var floor: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "region_id") var region: RegionEntity? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false) var status: ShopStatusEnum = ShopStatusEnum.unverified,

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "shop_categories",
        joinColumns = [JoinColumn(name = "shop_id")],
        inverseJoinColumns = [JoinColumn(name = "category_id")])
    var categories: MutableSet<CategoryEntity> = mutableSetOf(),

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "shop_works",
        joinColumns = [JoinColumn(name = "shop_id")],
        inverseJoinColumns = [JoinColumn(name = "work_id")])
    var works: MutableSet<WorkEntity> = mutableSetOf(),

    @OneToMany(mappedBy = "shop", cascade = [CascadeType.ALL], orphanRemoval = true)
    var links: MutableList<ShopLinkEntity> = mutableListOf(),

    @OneToOne(mappedBy = "shop", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var detail: ShopDetailEntity? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)

enum class ShopStatusEnum { active, closed, unverified }

@Entity
@Table(name = "shop_links")
class ShopLinkEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false) val shop: ShopEntity,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false) val type: ShopLinkTypeEnum,
    @Column(nullable = false, length = 500) val url: String,
)

enum class ShopLinkTypeEnum { blog, insta, x, place, homepage }

@Entity
@Table(name = "shop_details")
class ShopDetailEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false, unique = true) val shop: ShopEntity,

    @Column(columnDefinition = "TEXT") var description: String? = null,
    @Column(name = "raw_crawl_text", columnDefinition = "LONGTEXT") var rawCrawlText: String? = null,
    @Column(name = "crawled_at") var crawledAt: LocalDateTime? = null,
)

package com.aniwhere.server.adapter.out.persistence.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "regions")
class RegionEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Short? = null,
    @Column(nullable = false, length = 50) val name: String,
    @Column(nullable = false, length = 50) val city: String = "서울",
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
)

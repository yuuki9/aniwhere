package com.aniwhere.server.adapter.out.persistence.entity

import jakarta.persistence.*

@Entity
@Table(name = "categories")
class CategoryEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Short? = null,
    @Column(nullable = false, length = 50, unique = true) val name: String,
)

@Entity
@Table(name = "works")
class WorkEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int? = null,
    @Column(nullable = false, length = 100, unique = true) val name: String,
)

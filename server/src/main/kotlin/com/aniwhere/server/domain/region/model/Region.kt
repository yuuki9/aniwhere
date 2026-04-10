package com.aniwhere.server.domain.region.model

import java.time.LocalDateTime

data class Region(
    val id: Short? = null,
    val name: String,
    val city: String = "서울",
    val createdAt: LocalDateTime? = null,
)

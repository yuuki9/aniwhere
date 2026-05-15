package com.aniwhere.server.domain.work.model

data class WorkSummary(
    val id: Int,
    val name: String,
    val coverUrl: String? = null,
)

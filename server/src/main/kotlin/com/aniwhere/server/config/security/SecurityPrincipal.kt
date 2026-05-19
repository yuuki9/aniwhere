package com.aniwhere.server.config.security

data class SecurityPrincipal(
    val userId: Long,
    val role: String,
)

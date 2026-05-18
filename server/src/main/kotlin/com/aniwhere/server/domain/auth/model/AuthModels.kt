package com.aniwhere.server.domain.auth.model

data class LoginResult(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
    val role: String,
    val isNewUser: Boolean,
)

data class RefreshResult(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
)

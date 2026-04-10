package com.aniwhere.server.domain.community.model

import java.time.LocalDateTime

data class Post(
    val id: Long? = null,
    val title: String,
    val content: String,
    val authorNickname: String,
    val viewCount: Long = 0,
    val createdAt: LocalDateTime? = null,
    val updatedAt: LocalDateTime? = null,
)

data class Comment(
    val id: Long? = null,
    val postId: Long,
    val content: String,
    val authorNickname: String,
    val createdAt: LocalDateTime? = null,
)

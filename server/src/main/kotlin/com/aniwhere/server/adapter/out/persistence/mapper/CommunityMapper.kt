package com.aniwhere.server.adapter.out.persistence.mapper

import com.aniwhere.server.adapter.out.persistence.entity.CommentEntity
import com.aniwhere.server.adapter.out.persistence.entity.PostEntity
import com.aniwhere.server.domain.community.model.Comment
import com.aniwhere.server.domain.community.model.Post

object CommunityMapper {
    fun toDomain(e: PostEntity) = Post(
        id = e.id, title = e.title, content = e.content,
        authorNickname = e.authorNickname, viewCount = e.viewCount,
        createdAt = e.createdAt, updatedAt = e.updatedAt,
    )

    fun toDomain(e: CommentEntity) = Comment(
        id = e.id, postId = e.post.id!!, content = e.content,
        authorNickname = e.authorNickname, createdAt = e.createdAt,
    )
}

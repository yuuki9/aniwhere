package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.CommentEntity
import com.aniwhere.server.adapter.out.persistence.entity.PostEntity
import com.aniwhere.server.adapter.out.persistence.mapper.CommunityMapper
import com.aniwhere.server.adapter.out.persistence.repository.CommentRepository
import com.aniwhere.server.adapter.out.persistence.repository.PostRepository
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.domain.community.model.Comment
import com.aniwhere.server.domain.community.model.Post
import com.aniwhere.server.domain.community.port.out.CommentPersistencePort
import com.aniwhere.server.domain.community.port.out.PostPersistencePort
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Component

@Component
class PostPersistenceAdapter(private val repo: PostRepository) : PostPersistencePort {

    override fun findById(id: Long) = repo.findByIdOrNull(id)?.let(CommunityMapper::toDomain)

    override fun findAll(pageable: Pageable): Page<Post> = repo.findAll(pageable).map(CommunityMapper::toDomain)

    override fun save(post: Post): Post {
        val entity = PostEntity(
            title = post.title, content = post.content, authorNickname = post.authorNickname,
        )
        return CommunityMapper.toDomain(repo.save(entity))
    }

    override fun update(id: Long, post: Post): Post {
        val entity = repo.findByIdOrNull(id) ?: throw EntityNotFoundException("Post not found: $id")
        entity.title = post.title
        entity.content = post.content
        return CommunityMapper.toDomain(repo.save(entity))
    }

    override fun deleteById(id: Long) {
        if (!repo.existsById(id)) throw EntityNotFoundException("Post not found: $id")
        repo.deleteById(id)
    }
}

@Component
class CommentPersistenceAdapter(
    private val commentRepo: CommentRepository,
    private val postRepo: PostRepository,
) : CommentPersistencePort {

    override fun findByPostId(postId: Long) =
        commentRepo.findByPostIdOrderByCreatedAtAsc(postId).map(CommunityMapper::toDomain)

    override fun save(comment: Comment): Comment {
        val post = postRepo.findByIdOrNull(comment.postId)
            ?: throw EntityNotFoundException("Post not found: ${comment.postId}")
        val entity = CommentEntity(
            post = post, content = comment.content, authorNickname = comment.authorNickname,
        )
        return CommunityMapper.toDomain(commentRepo.save(entity))
    }

    override fun deleteById(id: Long) {
        if (!commentRepo.existsById(id)) throw EntityNotFoundException("Comment not found: $id")
        commentRepo.deleteById(id)
    }
}

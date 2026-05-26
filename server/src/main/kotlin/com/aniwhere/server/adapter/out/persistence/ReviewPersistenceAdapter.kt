package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.CommentEntity
import com.aniwhere.server.adapter.out.persistence.entity.PostLikeEntity
import com.aniwhere.server.adapter.out.persistence.entity.PostEntity
import com.aniwhere.server.adapter.out.persistence.entity.UserEntity
import com.aniwhere.server.adapter.out.persistence.mapper.ReviewMapper
import com.aniwhere.server.adapter.out.persistence.repository.CommentRepository
import com.aniwhere.server.adapter.out.persistence.repository.PostLikeRepository
import com.aniwhere.server.adapter.out.persistence.repository.PostRepository
import com.aniwhere.server.adapter.out.persistence.repository.UserRepository
import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.domain.review.model.Comment
import com.aniwhere.server.domain.review.model.Post
import com.aniwhere.server.domain.review.port.out.CommentPersistencePort
import com.aniwhere.server.domain.review.port.out.PostPersistencePort
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Component

@Component
class PostPersistenceAdapter(
    private val repo: PostRepository,
    private val userRepo: UserRepository,
    private val postLikeRepo: PostLikeRepository,
) : PostPersistencePort {

    override fun findById(id: Long) = repo.findByIdOrNull(id)?.let(ReviewMapper::toDomain)

    override fun findByIdAndIncreaseViewCount(id: Long): Post? {
        if (repo.incrementViewCount(id) == 0) {
            return null
        }
        return repo.findByIdOrNull(id)?.let(ReviewMapper::toDomain)
    }

    override fun findAll(pageable: Pageable): Page<Post> = repo.findAll(pageable).map(ReviewMapper::toDomain)

    override fun save(post: Post): Post {
        val author = userRepo.findByIdOrNull(post.authorUserId)
            ?: throw EntityNotFoundException("User not found: ${post.authorUserId}")
        val authorNickname = resolveOrInitializeNickname(author, post.authorNickname)
        val entity = PostEntity(
            title = post.title,
            content = post.content,
            author = author,
            authorNickname = authorNickname,
        )
        return ReviewMapper.toDomain(repo.save(entity))
    }

    override fun update(id: Long, post: Post): Post {
        val entity = repo.findByIdOrNull(id) ?: throw EntityNotFoundException("Post not found: $id")
        entity.title = post.title
        entity.content = post.content
        return ReviewMapper.toDomain(repo.save(entity))
    }

    override fun deleteById(id: Long) {
        if (!repo.existsById(id)) throw EntityNotFoundException("Post not found: $id")
        repo.deleteById(id)
    }

    override fun like(postId: Long, userId: Long) {
        val post = repo.findByIdOrNull(postId) ?: throw EntityNotFoundException("Post not found: $postId")
        if (postLikeRepo.existsByPost_IdAndUserId(postId, userId)) {
            return
        }
        postLikeRepo.save(PostLikeEntity(post = post, userId = userId))
        repo.incrementLikeCount(postId)
    }

    override fun unlike(postId: Long, userId: Long) {
        if (!repo.existsById(postId)) throw EntityNotFoundException("Post not found: $postId")
        val deleted = postLikeRepo.deleteByPost_IdAndUserId(postId, userId)
        if (deleted > 0) {
            repo.decrementLikeCount(postId)
        }
    }
}

@Component
class CommentPersistenceAdapter(
    private val commentRepo: CommentRepository,
    private val postRepo: PostRepository,
    private val userRepo: UserRepository,
) : CommentPersistencePort {

    override fun findById(id: Long) = commentRepo.findByIdOrNull(id)?.let(ReviewMapper::toDomain)

    override fun findByPostId(postId: Long) =
        commentRepo.findByPostIdOrderByCreatedAtAsc(postId).map(ReviewMapper::toDomain)

    override fun save(comment: Comment): Comment {
        val post = postRepo.findByIdOrNull(comment.postId)
            ?: throw EntityNotFoundException("Post not found: ${comment.postId}")
        val author = userRepo.findByIdOrNull(comment.authorUserId)
            ?: throw EntityNotFoundException("User not found: ${comment.authorUserId}")
        val authorNickname = resolveOrInitializeNickname(author, comment.authorNickname)
        val entity = CommentEntity(
            post = post,
            author = author,
            content = comment.content,
            authorNickname = authorNickname,
        )
        return ReviewMapper.toDomain(commentRepo.save(entity))
    }

    override fun deleteById(id: Long) {
        if (!commentRepo.existsById(id)) throw EntityNotFoundException("Comment not found: $id")
        commentRepo.deleteById(id)
    }
}

private fun resolveOrInitializeNickname(author: UserEntity, requestedNickname: String): String {
    val normalizedRequestedNickname = requestedNickname.trim()
    if (normalizedRequestedNickname.isBlank()) {
        throw BadRequestException("authorNickname must not be blank")
    }

    val normalizedStoredNickname = author.nickname?.trim().orEmpty()
    if (normalizedStoredNickname.isBlank()) {
        author.nickname = normalizedRequestedNickname
        return normalizedRequestedNickname
    }

    if (normalizedStoredNickname != normalizedRequestedNickname) {
        throw BadRequestException("authorNickname does not match user profile nickname")
    }
    return normalizedStoredNickname
}

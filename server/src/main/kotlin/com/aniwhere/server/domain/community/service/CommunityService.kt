package com.aniwhere.server.domain.community.service

import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.common.exception.ForbiddenException
import com.aniwhere.server.domain.community.model.Comment
import com.aniwhere.server.domain.community.model.Post
import com.aniwhere.server.domain.community.port.`in`.CommentUseCase
import com.aniwhere.server.domain.community.port.`in`.PostUseCase
import com.aniwhere.server.domain.community.port.out.CommentPersistencePort
import com.aniwhere.server.domain.community.port.out.PostPersistencePort
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class PostService(private val port: PostPersistencePort) : PostUseCase {

    @Transactional
    override fun getPost(id: Long) =
        port.findByIdAndIncreaseViewCount(id) ?: throw EntityNotFoundException("Post not found: $id")

    override fun listPosts(pageable: Pageable): Page<Post> = port.findAll(pageable)

    @Transactional
    override fun createPost(authorUserId: Long, post: Post) = port.save(post.copy(authorUserId = authorUserId))

    @Transactional
    override fun updatePost(actorUserId: Long, id: Long, post: Post): Post {
        val existing = port.findById(id) ?: throw EntityNotFoundException("Post not found: $id")
        requireOwnership(actorUserId, existing.authorUserId)
        return port.update(id, post.copy(authorUserId = existing.authorUserId, authorNickname = existing.authorNickname))
    }

    @Transactional
    override fun deletePost(actorUserId: Long, id: Long) {
        val existing = port.findById(id) ?: throw EntityNotFoundException("Post not found: $id")
        requireOwnership(actorUserId, existing.authorUserId)
        port.deleteById(id)
    }

    private fun requireOwnership(actorUserId: Long, ownerUserId: Long) {
        if (actorUserId != ownerUserId) {
            throw ForbiddenException("Only the author can modify this post")
        }
    }

    @Transactional
    override fun likePost(postId: Long, userId: Long) = port.like(postId, userId)

    @Transactional
    override fun unlikePost(postId: Long, userId: Long) = port.unlike(postId, userId)
}

@Service
@Transactional(readOnly = true)
class CommentService(private val port: CommentPersistencePort) : CommentUseCase {

    override fun listComments(postId: Long) = port.findByPostId(postId)

    @Transactional
    override fun createComment(authorUserId: Long, comment: Comment) =
        port.save(comment.copy(authorUserId = authorUserId))

    @Transactional
    override fun deleteComment(actorUserId: Long, id: Long) {
        val existing = port.findById(id) ?: throw EntityNotFoundException("Comment not found: $id")
        if (actorUserId != existing.authorUserId) {
            throw ForbiddenException("Only the author can delete this comment")
        }
        port.deleteById(id)
    }
}

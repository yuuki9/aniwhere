package com.aniwhere.server.domain.community.service

import com.aniwhere.server.common.exception.EntityNotFoundException
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

    override fun getPost(id: Long) =
        port.findById(id) ?: throw EntityNotFoundException("Post not found: $id")

    override fun listPosts(pageable: Pageable): Page<Post> = port.findAll(pageable)

    @Transactional
    override fun createPost(post: Post) = port.save(post)

    @Transactional
    override fun updatePost(id: Long, post: Post) = port.update(id, post)

    @Transactional
    override fun deletePost(id: Long) = port.deleteById(id)
}

@Service
@Transactional(readOnly = true)
class CommentService(private val port: CommentPersistencePort) : CommentUseCase {

    override fun listComments(postId: Long) = port.findByPostId(postId)

    @Transactional
    override fun createComment(comment: Comment) = port.save(comment)

    @Transactional
    override fun deleteComment(id: Long) = port.deleteById(id)
}

package com.aniwhere.server.domain.community.service

import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.domain.community.model.Comment
import com.aniwhere.server.domain.community.model.Post
import com.aniwhere.server.domain.community.port.out.CommentPersistencePort
import com.aniwhere.server.domain.community.port.out.PostPersistencePort
import io.mockk.every
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.verify
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.time.LocalDateTime

@ExtendWith(MockKExtension::class)
class PostServiceTest {

    @MockK
    private lateinit var port: PostPersistencePort

    @InjectMockKs
    private lateinit var service: PostService

    private val samplePost = Post(
        id = 1L, title = "테스트 글", content = "내용입니다",
        authorNickname = "유저1", viewCount = 0,
        createdAt = LocalDateTime.now(),
    )

    @Test
    fun `getPost - 존재하는 게시글 조회 성공`() {
        every { port.findById(1L) } returns samplePost
        assertEquals("테스트 글", service.getPost(1L).title)
    }

    @Test
    fun `getPost - 존재하지 않는 게시글 조회시 예외`() {
        every { port.findById(999L) } returns null
        assertThrows<EntityNotFoundException> { service.getPost(999L) }
    }

    @Test
    fun `listPosts - 페이징 조회`() {
        val pageable = PageRequest.of(0, 20)
        every { port.findAll(pageable) } returns PageImpl(listOf(samplePost))
        val result = service.listPosts(pageable)
        assertEquals(1, result.totalElements)
    }

    @Test
    fun `createPost - 게시글 작성 성공`() {
        every { port.save(any()) } returns samplePost
        val result = service.createPost(samplePost.copy(id = null))
        assertNotNull(result.id)
    }

    @Test
    fun `updatePost - 게시글 수정 성공`() {
        val updated = samplePost.copy(title = "수정된 글")
        every { port.update(1L, any()) } returns updated
        assertEquals("수정된 글", service.updatePost(1L, updated).title)
    }

    @Test
    fun `deletePost - 게시글 삭제 성공`() {
        every { port.deleteById(1L) } returns Unit
        service.deletePost(1L)
        verify { port.deleteById(1L) }
    }
}

@ExtendWith(MockKExtension::class)
class CommentServiceTest {

    @MockK
    private lateinit var port: CommentPersistencePort

    @InjectMockKs
    private lateinit var service: CommentService

    private val sampleComment = Comment(
        id = 1L, postId = 1L, content = "댓글입니다",
        authorNickname = "유저1", createdAt = LocalDateTime.now(),
    )

    @Test
    fun `listComments - 댓글 목록 조회`() {
        every { port.findByPostId(1L) } returns listOf(sampleComment)
        assertEquals(1, service.listComments(1L).size)
    }

    @Test
    fun `createComment - 댓글 작성 성공`() {
        every { port.save(any()) } returns sampleComment
        val result = service.createComment(sampleComment.copy(id = null))
        assertNotNull(result.id)
    }

    @Test
    fun `deleteComment - 댓글 삭제 성공`() {
        every { port.deleteById(1L) } returns Unit
        service.deleteComment(1L)
        verify { port.deleteById(1L) }
    }
}

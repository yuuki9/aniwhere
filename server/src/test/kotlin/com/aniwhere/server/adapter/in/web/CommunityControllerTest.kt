package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.config.security.SecurityPrincipal
import com.aniwhere.server.domain.community.model.Comment
import com.aniwhere.server.domain.community.model.Post
import com.aniwhere.server.domain.community.port.`in`.CommentUseCase
import com.aniwhere.server.domain.community.port.`in`.PostUseCase
import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import io.mockk.verify
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.data.domain.PageImpl
import org.springframework.http.MediaType
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import java.time.LocalDateTime

@WebMvcTest(PostController::class, CommentController::class)
@AutoConfigureMockMvc(addFilters = false)
class CommunityControllerTest {
    @AfterEach
    fun clearSecurityContext() {
        SecurityContextHolder.clearContext()
    }


    @Autowired
    private lateinit var mvc: MockMvc

    @Autowired
    private lateinit var mapper: ObjectMapper

    @MockkBean
    private lateinit var postUseCase: PostUseCase

    @MockkBean
    private lateinit var commentUseCase: CommentUseCase

    private val samplePost = Post(
        id = 1L, title = "테스트 글", content = "내용",
        authorUserId = 10L,
        authorNickname = "유저1", createdAt = LocalDateTime.now(),
    )

    private val sampleComment = Comment(
        id = 1L, postId = 1L, content = "댓글",
        authorUserId = 10L,
        authorNickname = "유저1", createdAt = LocalDateTime.now(),
    )

    @Test
    fun `GET posts - 게시글 목록 조회`() {
        every { postUseCase.listPosts(any()) } returns PageImpl(listOf(samplePost))
        mvc.perform(get("/api/v1/posts"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
    }

    @Test
    fun `GET posts_{id} - 게시글 단건 조회`() {
        every { postUseCase.getPost(1L) } returns samplePost
        mvc.perform(get("/api/v1/posts/1"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.title").value("테스트 글"))
    }

    @Test
    fun `POST posts - 게시글 작성`() {
        mockAuthenticatedUser(10L)
        every { postUseCase.createPost(10L, any()) } returns samplePost
        val req = PostRequest(title = "테스트 글", content = "내용", authorNickname = "유저1")
        mvc.perform(
            post("/api/v1/posts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.data.id").value(1))
    }

    @Test
    fun `PUT posts_{id} - 게시글 수정`() {
        mockAuthenticatedUser(10L)
        val updated = samplePost.copy(title = "수정됨")
        every { postUseCase.updatePost(10L, 1L, any()) } returns updated
        val req = PostUpdateRequest(title = "수정됨", content = "내용")
        mvc.perform(
            put("/api/v1/posts/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.title").value("수정됨"))
    }

    @Test
    fun `DELETE posts_{id} - 게시글 삭제`() {
        mockAuthenticatedUser(10L)
        every { postUseCase.deletePost(10L, 1L) } returns Unit
        mvc.perform(delete("/api/v1/posts/1"))
            .andExpect(status().isOk)
        verify { postUseCase.deletePost(10L, 1L) }
    }

    @Test
    fun `GET posts_{postId}_comments - 댓글 목록 조회`() {
        every { commentUseCase.listComments(1L) } returns listOf(sampleComment)
        mvc.perform(get("/api/v1/posts/1/comments"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.length()").value(1))
    }

    @Test
    fun `POST posts_{postId}_comments - 댓글 작성`() {
        mockAuthenticatedUser(10L)
        every { commentUseCase.createComment(10L, any()) } returns sampleComment
        val req = CommentRequest(content = "댓글", authorNickname = "유저1")
        mvc.perform(
            post("/api/v1/posts/1/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.data.id").value(1))
    }

    @Test
    fun `DELETE comments_{id} - 댓글 삭제`() {
        mockAuthenticatedUser(10L)
        every { commentUseCase.deleteComment(10L, 1L) } returns Unit
        mvc.perform(delete("/api/v1/posts/1/comments/1"))
            .andExpect(status().isOk)
        verify { commentUseCase.deleteComment(10L, 1L) }
    }

    private fun mockAuthenticatedUser(userId: Long) {
        val principal = SecurityPrincipal(userId = userId, role = "ROLE_USER")
        val authentication = UsernamePasswordAuthenticationToken(principal, null, emptyList())
        SecurityContextHolder.getContext().authentication = authentication
    }
}

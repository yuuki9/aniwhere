package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.common.exception.UnauthorizedException
import com.aniwhere.server.config.security.SecurityPrincipal
import com.aniwhere.server.domain.review.model.Comment
import com.aniwhere.server.domain.review.model.Post
import com.aniwhere.server.domain.review.port.`in`.CommentUseCase
import com.aniwhere.server.domain.review.port.`in`.PostUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springdoc.core.annotations.ParameterObject
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.*

@Tag(name = "Review - Post", description = "후기·제보 API (클라이언트 호환: /api/v1/posts)")
@RestController
@RequestMapping("/api/v1/posts")
class PostController(private val useCase: PostUseCase) {

    @Operation(summary = "게시글 목록 조회")
    @GetMapping
    fun listPosts(@ParameterObject @PageableDefault(size = 20) pageable: Pageable) =
        ApiResponse.ok(useCase.listPosts(pageable))

    @Operation(summary = "게시글 단건 조회")
    @GetMapping("/{id}")
    fun getPost(@PathVariable id: Long) = ApiResponse.ok(useCase.getPost(id))

    @Operation(summary = "게시글 작성")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createPost(@Valid @RequestBody req: PostRequest) =
        ApiResponse.ok(useCase.createPost(currentUserId(), req.toDomain()))

    @Operation(summary = "게시글 수정")
    @PutMapping("/{id}")
    fun updatePost(@PathVariable id: Long, @Valid @RequestBody req: PostUpdateRequest) =
        ApiResponse.ok(useCase.updatePost(currentUserId(), id, req.toDomain()))

    @Operation(summary = "게시글 삭제")
    @DeleteMapping("/{id}")
    fun deletePost(@PathVariable id: Long) = run { useCase.deletePost(currentUserId(), id); ApiResponse.ok() }

    @Operation(summary = "게시글 좋아요")
    @PostMapping("/{id}/likes")
    fun likePost(@PathVariable id: Long) =
        run { useCase.likePost(id, currentUserId()); ApiResponse.ok() }

    @Operation(summary = "게시글 좋아요 취소")
    @DeleteMapping("/{id}/likes")
    fun unlikePost(@PathVariable id: Long) =
        run { useCase.unlikePost(id, currentUserId()); ApiResponse.ok() }

    private fun currentUserId(): Long =
        (SecurityContextHolder.getContext().authentication?.principal as? SecurityPrincipal)?.userId
            ?: throw UnauthorizedException("Authentication required")
}

@Tag(name = "Review - Comment", description = "후기·제보 댓글 API")
@RestController
@RequestMapping("/api/v1/posts/{postId}/comments")
class CommentController(private val useCase: CommentUseCase) {

    @Operation(summary = "댓글 목록 조회")
    @GetMapping
    fun listComments(@PathVariable postId: Long) =
        ApiResponse.ok(useCase.listComments(postId))

    @Operation(summary = "댓글 작성")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createComment(@PathVariable postId: Long, @Valid @RequestBody req: CommentRequest) =
        ApiResponse.ok(useCase.createComment(currentUserId(), req.toDomain(postId)))

    @Operation(summary = "댓글 삭제")
    @DeleteMapping("/{commentId}")
    fun deleteComment(@PathVariable commentId: Long) =
        run { useCase.deleteComment(currentUserId(), commentId); ApiResponse.ok() }

    private fun currentUserId(): Long =
        (SecurityContextHolder.getContext().authentication?.principal as? SecurityPrincipal)?.userId
            ?: throw UnauthorizedException("Authentication required")
}

data class PostRequest(
    @field:NotBlank val title: String,
    @field:NotBlank val content: String,
    @field:NotBlank val authorNickname: String,
) {
    fun toDomain() = Post(title = title, content = content, authorUserId = 0, authorNickname = authorNickname)
}

data class PostUpdateRequest(
    @field:NotBlank val title: String,
    @field:NotBlank val content: String,
) {
    fun toDomain() = Post(title = title, content = content, authorUserId = 0, authorNickname = "")
}

data class CommentRequest(
    @field:NotBlank val content: String,
    @field:NotBlank val authorNickname: String,
) {
    fun toDomain(postId: Long) = Comment(postId = postId, content = content, authorUserId = 0, authorNickname = authorNickname)
}

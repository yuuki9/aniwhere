package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.domain.community.model.Comment
import com.aniwhere.server.domain.community.model.Post
import com.aniwhere.server.domain.community.port.`in`.CommentUseCase
import com.aniwhere.server.domain.community.port.`in`.PostUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springdoc.core.annotations.ParameterObject
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@Tag(name = "Community - Post", description = "커뮤니티 게시판 API")
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
        ApiResponse.ok(useCase.createPost(req.toDomain()))

    @Operation(summary = "게시글 수정")
    @PutMapping("/{id}")
    fun updatePost(@PathVariable id: Long, @Valid @RequestBody req: PostRequest) =
        ApiResponse.ok(useCase.updatePost(id, req.toDomain()))

    @Operation(summary = "게시글 삭제")
    @DeleteMapping("/{id}")
    fun deletePost(@PathVariable id: Long) = run { useCase.deletePost(id); ApiResponse.ok() }
}

@Tag(name = "Community - Comment", description = "댓글 API")
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
        ApiResponse.ok(useCase.createComment(req.toDomain(postId)))

    @Operation(summary = "댓글 삭제")
    @DeleteMapping("/{commentId}")
    fun deleteComment(@PathVariable commentId: Long) =
        run { useCase.deleteComment(commentId); ApiResponse.ok() }
}

data class PostRequest(
    @field:NotBlank val title: String,
    @field:NotBlank val content: String,
    @field:NotBlank val authorNickname: String,
) {
    fun toDomain() = Post(title = title, content = content, authorNickname = authorNickname)
}

data class CommentRequest(
    @field:NotBlank val content: String,
    @field:NotBlank val authorNickname: String,
) {
    fun toDomain(postId: Long) = Comment(postId = postId, content = content, authorNickname = authorNickname)
}

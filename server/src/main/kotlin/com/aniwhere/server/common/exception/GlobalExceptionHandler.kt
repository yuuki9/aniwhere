package com.aniwhere.server.common.exception

import com.aniwhere.server.common.dto.ApiResponse
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.multipart.MaxUploadSizeExceededException
import org.springframework.web.multipart.MultipartException

class EntityNotFoundException(message: String) : RuntimeException(message)

@RestControllerAdvice
class GlobalExceptionHandler {

    private companion object {
        private const val CODE_UPLOAD_SIZE_EXCEEDED = "UPLOAD_SIZE_EXCEEDED"
        private const val MSG_UPLOAD_SIZE_EXCEEDED = "업로드 가능한 파일 크기를 초과했습니다."
    }

    private fun Throwable.containsMaxUploadSizeExceeded(): Boolean {
        var c: Throwable? = this
        while (c != null) {
            if (c is MaxUploadSizeExceededException) return true
            c = c.cause
        }
        return false
    }

    private fun uploadTooLarge(): ResponseEntity<ApiResponse<Unit>> =
        ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(
            ApiResponse.error(MSG_UPLOAD_SIZE_EXCEEDED, CODE_UPLOAD_SIZE_EXCEEDED),
        )

    @ExceptionHandler(EntityNotFoundException::class)
    fun handleNotFound(e: EntityNotFoundException) =
        ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.message ?: "Not found"))

    @ExceptionHandler(BadRequestException::class)
    fun handleBadRequest(e: BadRequestException) =
        ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.message ?: "Bad request"))

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(e: MethodArgumentNotValidException): ResponseEntity<ApiResponse<Unit>> {
        val msg = e.bindingResult.fieldErrors.joinToString("; ") { "${it.field}: ${it.defaultMessage}" }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error(msg.ifBlank { "Validation failed" }))
    }

    @ExceptionHandler(MaxUploadSizeExceededException::class)
    fun handleMaxUploadSizeExceeded(@Suppress("UNUSED_PARAMETER") e: MaxUploadSizeExceededException) =
        uploadTooLarge()

    @ExceptionHandler(MultipartException::class)
    fun handleMultipart(e: MultipartException): ResponseEntity<ApiResponse<Unit>> =
        if (e.containsMaxUploadSizeExceeded()) uploadTooLarge()
        else ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error("파일 업로드 처리에 실패했습니다."))

    @ExceptionHandler(Exception::class)
    fun handleException(e: Exception) =
        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error(e.message ?: "Internal error"))
}

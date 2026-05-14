package com.aniwhere.server.common.exception

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.common.logging.describeForLog
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
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

    private val log = LoggerFactory.getLogger(javaClass)

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
    fun handleNotFound(e: EntityNotFoundException, request: HttpServletRequest): ResponseEntity<ApiResponse<Unit>> {
        log.warn(
            "Not found request={} message={}",
            request.describeForLog(),
            e.message,
        )
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.message ?: "Not found"))
    }

    @ExceptionHandler(BadRequestException::class)
    fun handleBadRequest(e: BadRequestException, request: HttpServletRequest): ResponseEntity<ApiResponse<Unit>> {
        log.warn(
            "Bad request request={} message={}",
            request.describeForLog(),
            e.message,
        )
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.message ?: "Bad request"))
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(e: MethodArgumentNotValidException, request: HttpServletRequest): ResponseEntity<ApiResponse<Unit>> {
        val msg = e.bindingResult.fieldErrors.joinToString("; ") { "${it.field}: ${it.defaultMessage}" }
        log.warn(
            "Validation failed request={} errors={}",
            request.describeForLog(),
            msg.ifBlank { "(none)" },
        )
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error(msg.ifBlank { "Validation failed" }))
    }

    @ExceptionHandler(MaxUploadSizeExceededException::class)
    fun handleMaxUploadSizeExceeded(
        @Suppress("UNUSED_PARAMETER") e: MaxUploadSizeExceededException,
        request: HttpServletRequest,
    ): ResponseEntity<ApiResponse<Unit>> {
        log.warn("Payload too large request={}", request.describeForLog())
        return uploadTooLarge()
    }

    @ExceptionHandler(MultipartException::class)
    fun handleMultipart(e: MultipartException, request: HttpServletRequest): ResponseEntity<ApiResponse<Unit>> =
        if (e.containsMaxUploadSizeExceeded()) {
            log.warn("Payload too large (multipart) request={}", request.describeForLog())
            uploadTooLarge()
        } else {
            log.warn(
                "Multipart request failed request={} message={}",
                request.describeForLog(),
                e.message,
                e,
            )
            ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("파일 업로드 처리에 실패했습니다."))
        }

    @ExceptionHandler(Exception::class)
    fun handleException(e: Exception, request: HttpServletRequest): ResponseEntity<ApiResponse<Unit>> {
        log.error(
            "Unhandled exception request={} message={}",
            request.describeForLog(),
            e.message,
            e,
        )
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error(e.message ?: "Internal error"))
    }
}

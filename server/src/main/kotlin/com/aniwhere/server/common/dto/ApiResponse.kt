package com.aniwhere.server.common.dto

import com.fasterxml.jackson.annotation.JsonInclude

@JsonInclude(JsonInclude.Include.NON_NULL)
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    /** 빈 조회 등 특정 케이스에서만 설정 (예: 검색 결과 없음) */
    val code: String? = null,
    val message: String? = null,
) {
    companion object {
        fun <T> ok(data: T, code: String? = null, message: String? = null) =
            ApiResponse(success = true, data = data, code = code, message = message)

        fun ok() = ApiResponse<Unit>(success = true)

        fun error(message: String) = ApiResponse<Unit>(success = false, message = message)
    }
}

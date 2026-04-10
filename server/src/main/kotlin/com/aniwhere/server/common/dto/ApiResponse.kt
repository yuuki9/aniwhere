package com.aniwhere.server.common.dto

import com.fasterxml.jackson.annotation.JsonInclude

@JsonInclude(JsonInclude.Include.NON_NULL)
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null,
) {
    companion object {
        fun <T> ok(data: T) = ApiResponse(success = true, data = data)
        fun ok() = ApiResponse<Unit>(success = true)
        fun error(message: String) = ApiResponse<Unit>(success = false, message = message)
    }
}

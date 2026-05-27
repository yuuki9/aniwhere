package com.aniwhere.server.common.exception

class BadRequestException(
    message: String,
    cause: Throwable? = null,
) : RuntimeException(message, cause)

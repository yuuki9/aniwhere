package com.aniwhere.server.common.exception

class UnauthorizedException(message: String) : RuntimeException(message)

class ForbiddenException(message: String) : RuntimeException(message)

class UpstreamAuthException(message: String) : RuntimeException(message)

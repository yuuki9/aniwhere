package com.aniwhere.server.common.logging

import jakarta.servlet.http.HttpServletRequest

fun HttpServletRequest.describeForLog(): String =
    buildString {
        append(method)
        append(' ')
        append(requestURI)
        queryString?.takeIf { it.isNotBlank() }?.let { qs ->
            append('?')
            append(qs)
        }
        append(" remote=")
        append(remoteAddr)
    }

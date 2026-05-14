package com.aniwhere.server.common.logging

import jakarta.servlet.http.HttpServletRequest

private const val HEADER_X_FORWARDED_FOR = "X-Forwarded-For"

/**
 * 로그에 넣을 클라이언트 IP 문자열.
 *
 * 프록시/LB가 요청마다 `X-Forwarded-For`를 **추가**하는 일반적인 구성이라면, 목록의 **첫 번째** 값이 원 클라이언트에 해당합니다.
 * 클라이언트가 직접 조작한 헤더가 프록시까지 도달하면 왜곡될 수 있으므로, 리버스 프록시에서 신뢰 구간(trusted hops)을 두는 것이 전제입니다.
 *
 * IP 주소는 GDPR 등 일부 관할권에서 개인정보로 간주될 수 있습니다. 보존 기간·수집 목적·법적 근거는 서비스 정책에 맞게 검토하세요.
 */
fun HttpServletRequest.clientIpForLog(): String {
    val raw = getHeader(HEADER_X_FORWARDED_FOR)?.trim()?.takeIf { it.isNotEmpty() }
        ?: return remoteAddr
    val client = raw.split(',').firstOrNull()?.trim()?.takeIf { it.isNotEmpty() }
    return client ?: remoteAddr
}

fun HttpServletRequest.describeForLog(): String =
    buildString {
        append(method)
        append(' ')
        append(requestURI)
        queryString?.takeIf { it.isNotBlank() }?.let { qs ->
            append('?')
            append(qs)
        }
        append(" client=")
        append(clientIpForLog())
    }

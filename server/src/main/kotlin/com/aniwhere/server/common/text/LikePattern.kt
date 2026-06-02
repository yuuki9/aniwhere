package com.aniwhere.server.common.text

/**
 * JPQL `LIKE CONCAT('%', :pattern, '%') ESCAPE '\'` 에 넣을 중간 문자열.
 * 사용자 입력의 `%`, `_`, `\` 를 이스케이프한다. 쿼리에도 동일한 `ESCAPE '\'` 가 필요하다.
 */
object LikePattern {
    fun escapeForContains(raw: String): String =
        raw.trim()
            .replace("\\", "\\\\")
            .replace("%", "\\%")
            .replace("_", "\\_")
}

package com.aniwhere.server.common.text

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class LikePatternTest {

    @Test
    fun `escapeForContains - trims and escapes wildcard characters`() {
        assertEquals("원피스", LikePattern.escapeForContains("  원피스  "))
        assertEquals("100\\%", LikePattern.escapeForContains("100%"))
        assertEquals("a\\_b", LikePattern.escapeForContains("a_b"))
        assertEquals("path\\\\file", LikePattern.escapeForContains("path\\file"))
    }
}

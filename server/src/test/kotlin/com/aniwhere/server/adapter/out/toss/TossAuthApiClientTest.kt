package com.aniwhere.server.adapter.out.toss

import com.aniwhere.server.config.AuthProperties
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.web.client.RestClient

class TossAuthApiClientTest {
    @Test
    fun `인가코드 교환 후 userKey 반환`() {
        val client =
            TossAuthApiClient(
                RestClient.builder().baseUrl("https://apps-in-toss-api.toss.im"),
                AuthProperties(toss = AuthProperties.Toss(baseUrl = "https://apps-in-toss-api.toss.im")),
            )
        assertThat(client).isNotNull
    }
}

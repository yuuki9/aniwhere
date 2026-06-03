package com.aniwhere.server.domain.popularity.port.`in`

import com.aniwhere.server.domain.popularity.model.KeywordRankingResponse
import com.aniwhere.server.domain.popularity.model.MixedEntityRankingResponse
import com.aniwhere.server.domain.popularity.model.PopularityWindow
import com.aniwhere.server.domain.popularity.model.RecordPopularityEventCommand
import com.aniwhere.server.domain.popularity.model.ShopRankingResponse
import com.aniwhere.server.domain.popularity.model.WorkRankingResponse

interface PopularityEventUseCase {
    fun recordEvent(command: RecordPopularityEventCommand)
}

interface PopularityRankingUseCase {
    fun shopRankings(window: PopularityWindow, limit: Int): ShopRankingResponse
    fun workRankings(window: PopularityWindow, limit: Int): WorkRankingResponse
    fun keywordRankings(window: PopularityWindow, limit: Int): KeywordRankingResponse
    fun mixedEntityRankings(window: PopularityWindow, limit: Int): MixedEntityRankingResponse
}

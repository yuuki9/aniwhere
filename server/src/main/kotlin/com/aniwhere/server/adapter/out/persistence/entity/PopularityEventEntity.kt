package com.aniwhere.server.adapter.out.persistence.entity

import com.aniwhere.server.domain.popularity.model.PopularityEventType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "popularity_events")
class PopularityEventEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    @Column(name = "user_id", nullable = false)
    val userId: Long,
    @Column(name = "event_type", nullable = false, length = 64)
    val eventType: String,
    @Column(name = "shop_id")
    val shopId: Long? = null,
    @Column(name = "work_id")
    val workId: Int? = null,
    @Column(length = 100)
    val keyword: String? = null,
    @Column(name = "keyword_normalized", length = 100)
    val keywordNormalized: String? = null,
    @Column(name = "work_keyword", length = 100)
    val workKeyword: String? = null,
    @Column(name = "work_keyword_normalized", length = 100)
    val workKeywordNormalized: String? = null,
    @Column(length = 16)
    val scope: String? = null,
    @Column(length = 16)
    val source: String? = null,
    @Column(name = "occurred_at", nullable = false)
    val occurredAt: LocalDateTime,
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
) {
    val type: PopularityEventType
        get() = PopularityEventType.parse(eventType)
}

package com.aniwhere.server.adapter.out.persistence.repository

import com.aniwhere.server.adapter.out.persistence.entity.AnimationWorkEntity
import com.aniwhere.server.adapter.out.persistence.entity.CategoryEntity
import com.aniwhere.server.adapter.out.persistence.entity.GameWorkEntity
import com.aniwhere.server.adapter.out.persistence.entity.RegionEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopStatusEnum
import com.aniwhere.server.adapter.out.persistence.entity.WorkEntity
import com.aniwhere.server.domain.category.model.CategoryListItem
import com.aniwhere.server.domain.region.model.RegionListItem
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.math.BigDecimal

interface ShopRepository : JpaRepository<ShopEntity, Long> {
    @Query(
        """
        SELECT DISTINCT s FROM ShopEntity s
        LEFT JOIN FETCH s.region
        WHERE s.py BETWEEN :swLat AND :neLat
          AND s.px BETWEEN :swLng AND :neLng
        """,
    )
    fun findWithinBounds(
        swLat: BigDecimal,
        swLng: BigDecimal,
        neLat: BigDecimal,
        neLng: BigDecimal,
    ): List<ShopEntity>

    @Query("""
        SELECT DISTINCT s FROM ShopEntity s
        LEFT JOIN FETCH s.region
        WHERE (:applyRegionIds = false OR s.region.id IN :regionIds)
          AND (:applyCategoryIds = false OR EXISTS (
                SELECT 1 FROM ShopEntity s3 JOIN s3.categories c3
                WHERE s3.id = s.id AND c3.id IN :categoryIds))
          AND (:status IS NULL OR s.status = :status)
          AND (:keyword IS NULL OR s.name LIKE CONCAT('%', :keyword, '%'))
          AND (:workKeyword IS NULL OR EXISTS (
                  SELECT 1 FROM ShopEntity s2 JOIN s2.works w
                  WHERE s2.id = s.id AND (
                       w.name LIKE CONCAT('%', :workKeyword, '%')
                    OR (TYPE(w) = AnimationWorkEntity AND TREAT(w AS AnimationWorkEntity).koreanTitle LIKE CONCAT('%', :workKeyword, '%')))))
          AND (:applyWorkIds = false OR EXISTS (
                SELECT 1 FROM ShopEntity s2 JOIN s2.works w
                WHERE s2.id = s.id AND w.id IN :workIds))
          AND (:workType IS NULL OR EXISTS (
                SELECT 1 FROM ShopEntity s4 JOIN s4.works w4
                WHERE s4.id = s.id AND (
                    (:workType = 'ANIMATION' AND TYPE(w4) = AnimationWorkEntity)
                    OR (:workType = 'GAME' AND TYPE(w4) = GameWorkEntity)
                )))
    """,
    countQuery = """
        SELECT COUNT(DISTINCT s) FROM ShopEntity s
        WHERE (:applyRegionIds = false OR s.region.id IN :regionIds)
          AND (:applyCategoryIds = false OR EXISTS (
                SELECT 1 FROM ShopEntity s3 JOIN s3.categories c3
                WHERE s3.id = s.id AND c3.id IN :categoryIds))
          AND (:status IS NULL OR s.status = :status)
          AND (:keyword IS NULL OR s.name LIKE CONCAT('%', :keyword, '%'))
          AND (:workKeyword IS NULL OR EXISTS (
                  SELECT 1 FROM ShopEntity s2 JOIN s2.works w
                  WHERE s2.id = s.id AND (
                       w.name LIKE CONCAT('%', :workKeyword, '%')
                    OR (TYPE(w) = AnimationWorkEntity AND TREAT(w AS AnimationWorkEntity).koreanTitle LIKE CONCAT('%', :workKeyword, '%')))))
          AND (:applyWorkIds = false OR EXISTS (
                SELECT 1 FROM ShopEntity s2 JOIN s2.works w
                WHERE s2.id = s.id AND w.id IN :workIds))
          AND (:workType IS NULL OR EXISTS (
                SELECT 1 FROM ShopEntity s4 JOIN s4.works w4
                WHERE s4.id = s.id AND (
                    (:workType = 'ANIMATION' AND TYPE(w4) = AnimationWorkEntity)
                    OR (:workType = 'GAME' AND TYPE(w4) = GameWorkEntity)
                )))
    """)
    fun search(
        applyRegionIds: Boolean,
        regionIds: Set<Short>,
        applyCategoryIds: Boolean,
        categoryIds: Set<Short>,
        keyword: String?,
        workKeyword: String?,
        applyWorkIds: Boolean,
        workIds: Set<Int>,
        workType: String?,
        status: ShopStatusEnum?,
        pageable: Pageable,
    ): Page<ShopEntity>

    @Query(
        """
        SELECT new com.aniwhere.server.adapter.out.persistence.repository.ShopNameSuggestRow(
            s.id,
            s.name
        )
        FROM ShopEntity s
        WHERE s.name LIKE CONCAT('%', :pattern, '%') ESCAPE '\'
        ORDER BY s.name ASC
        """,
    )
    fun suggestShopNames(pattern: String, pageable: Pageable): List<ShopNameSuggestRow>

    @Query(
        """
        SELECT new com.aniwhere.server.adapter.out.persistence.repository.RegionFacetCountRow(
            r.id,
            r.name,
            COALESCE((
                SELECT COUNT(DISTINCT s.id)
                FROM ShopEntity s
                WHERE (s.region.id = r.id OR s.region.id IN :selectedRegionIds)
                  AND (:applyCategory = false OR EXISTS (
                      SELECT 1 FROM ShopEntity sc JOIN sc.categories c
                      WHERE sc.id = s.id AND c.id IN :categoryIds
                  ))
                  AND (:applyWork = false OR EXISTS (
                      SELECT 1 FROM ShopEntity sw JOIN sw.works w
                      WHERE sw.id = s.id AND w.id IN :workIds
                  ))
                  AND (:status IS NULL OR s.status = :status)
                  AND (:keyword IS NULL OR s.name LIKE CONCAT('%', :keyword, '%'))
                  AND (:swLat IS NULL OR (s.py BETWEEN :swLat AND :neLat AND s.px BETWEEN :swLng AND :neLng))
            ), 0)
        )
        FROM RegionEntity r
        ORDER BY r.name ASC
        """,
    )
    fun findRegionFacetCounts(
        keyword: String?,
        selectedRegionIds: Set<Short>,
        applyCategory: Boolean,
        categoryIds: Set<Short>,
        applyWork: Boolean,
        workIds: Set<Int>,
        status: ShopStatusEnum?,
        swLat: BigDecimal?,
        swLng: BigDecimal?,
        neLat: BigDecimal?,
        neLng: BigDecimal?,
    ): List<RegionFacetCountRow>

    @Query(
        """
        SELECT new com.aniwhere.server.adapter.out.persistence.repository.CategoryFacetCountRow(
            c.id,
            c.name,
            COALESCE((
                SELECT COUNT(DISTINCT s.id)
                FROM ShopEntity s
                WHERE (:applyRegion = false OR s.region.id IN :regionIds)
                  AND EXISTS (
                      SELECT 1 FROM ShopEntity sc JOIN sc.categories c2
                      WHERE sc.id = s.id AND (
                          c2.id = c.id
                          OR (:applySelectedCategory = true AND c2.id IN :selectedCategoryIds)
                      )
                  )
                  AND (:applyWork = false OR EXISTS (
                      SELECT 1 FROM ShopEntity sw JOIN sw.works w
                      WHERE sw.id = s.id AND w.id IN :workIds
                  ))
                  AND (:status IS NULL OR s.status = :status)
                  AND (:keyword IS NULL OR s.name LIKE CONCAT('%', :keyword, '%'))
                  AND (:swLat IS NULL OR (s.py BETWEEN :swLat AND :neLat AND s.px BETWEEN :swLng AND :neLng))
            ), 0)
        )
        FROM CategoryEntity c
        ORDER BY c.name ASC
        """,
    )
    fun findCategoryFacetCounts(
        keyword: String?,
        applyRegion: Boolean,
        regionIds: Set<Short>,
        applySelectedCategory: Boolean,
        selectedCategoryIds: Set<Short>,
        applyWork: Boolean,
        workIds: Set<Int>,
        status: ShopStatusEnum?,
        swLat: BigDecimal?,
        swLng: BigDecimal?,
        neLat: BigDecimal?,
        neLng: BigDecimal?,
    ): List<CategoryFacetCountRow>

    @Query(
        """
        SELECT new com.aniwhere.server.adapter.out.persistence.repository.WorkFacetCatalogRow(
            w.id,
            w.name,
            w.coverUrl
        )
        FROM WorkEntity w
        WHERE (
            :workType IS NULL
            OR (:workType = 'ANIMATION' AND TYPE(w) = AnimationWorkEntity)
            OR (:workType = 'GAME' AND TYPE(w) = GameWorkEntity)
        )
        ORDER BY w.name ASC
        """,
    )
    fun findWorkFacetCatalog(workType: String?): List<WorkFacetCatalogRow>

    @Query(
        """
        SELECT new com.aniwhere.server.adapter.out.persistence.repository.WorkFacetGroupCountRow(
            w.id,
            COUNT(DISTINCT s.id)
        )
        FROM ShopEntity s
        JOIN s.works w
        WHERE (:applyRegion = false OR s.region.id IN :regionIds)
          AND (:applyCategory = false OR EXISTS (
              SELECT 1 FROM ShopEntity sc JOIN sc.categories c
              WHERE sc.id = s.id AND c.id IN :categoryIds
          ))
          AND (:status IS NULL OR s.status = :status)
          AND (:keyword IS NULL OR s.name LIKE CONCAT('%', :keyword, '%'))
          AND (:swLat IS NULL OR (s.py BETWEEN :swLat AND :neLat AND s.px BETWEEN :swLng AND :neLng))
          AND (
              :workType IS NULL
              OR (:workType = 'ANIMATION' AND TYPE(w) = AnimationWorkEntity)
              OR (:workType = 'GAME' AND TYPE(w) = GameWorkEntity)
          )
        GROUP BY w.id
        """,
    )
    fun findWorkFacetCandidateCounts(
        keyword: String?,
        applyRegion: Boolean,
        regionIds: Set<Short>,
        applyCategory: Boolean,
        categoryIds: Set<Short>,
        status: ShopStatusEnum?,
        swLat: BigDecimal?,
        swLng: BigDecimal?,
        neLat: BigDecimal?,
        neLng: BigDecimal?,
        workType: String?,
    ): List<WorkFacetGroupCountRow>

    @Query(
        """
        SELECT COUNT(DISTINCT s.id)
        FROM ShopEntity s
        WHERE (:applyRegion = false OR s.region.id IN :regionIds)
          AND (:applyCategory = false OR EXISTS (
              SELECT 1 FROM ShopEntity sc JOIN sc.categories c
              WHERE sc.id = s.id AND c.id IN :categoryIds
          ))
          AND (:status IS NULL OR s.status = :status)
          AND (:keyword IS NULL OR s.name LIKE CONCAT('%', :keyword, '%'))
          AND (:swLat IS NULL OR (s.py BETWEEN :swLat AND :neLat AND s.px BETWEEN :swLng AND :neLng))
          AND (:applySelectedWork = false OR EXISTS (
              SELECT 1 FROM ShopEntity sw JOIN sw.works w
              WHERE sw.id = s.id AND w.id IN :selectedWorkIds
          ))
        """,
    )
    fun countWorkFacetSelectedBase(
        keyword: String?,
        applyRegion: Boolean,
        regionIds: Set<Short>,
        applyCategory: Boolean,
        categoryIds: Set<Short>,
        status: ShopStatusEnum?,
        swLat: BigDecimal?,
        swLng: BigDecimal?,
        neLat: BigDecimal?,
        neLng: BigDecimal?,
        applySelectedWork: Boolean,
        selectedWorkIds: Set<Int>,
    ): Long

    /**
     * Intermediate optimization for work union semantics:
     * compute per-work overlap with selected works in a grouped query
     * to avoid per-candidate correlated COUNT subqueries.
     */
    @Query(
        """
        SELECT new com.aniwhere.server.adapter.out.persistence.repository.WorkFacetGroupCountRow(
            w.id,
            COUNT(DISTINCT s.id)
        )
        FROM ShopEntity s
        JOIN s.works w
        WHERE (:applyRegion = false OR s.region.id IN :regionIds)
          AND (:applyCategory = false OR EXISTS (
              SELECT 1 FROM ShopEntity sc JOIN sc.categories c
              WHERE sc.id = s.id AND c.id IN :categoryIds
          ))
          AND (:status IS NULL OR s.status = :status)
          AND (:keyword IS NULL OR s.name LIKE CONCAT('%', :keyword, '%'))
          AND (:swLat IS NULL OR (s.py BETWEEN :swLat AND :neLat AND s.px BETWEEN :swLng AND :neLng))
          AND (:applySelectedWork = false OR EXISTS (
              SELECT 1 FROM ShopEntity sw JOIN sw.works ws
              WHERE sw.id = s.id AND ws.id IN :selectedWorkIds
          ))
          AND (
              :workType IS NULL
              OR (:workType = 'ANIMATION' AND TYPE(w) = AnimationWorkEntity)
              OR (:workType = 'GAME' AND TYPE(w) = GameWorkEntity)
          )
        GROUP BY w.id
        """,
    )
    fun findWorkFacetSelectedIntersections(
        keyword: String?,
        applyRegion: Boolean,
        regionIds: Set<Short>,
        applyCategory: Boolean,
        categoryIds: Set<Short>,
        status: ShopStatusEnum?,
        swLat: BigDecimal?,
        swLng: BigDecimal?,
        neLat: BigDecimal?,
        neLng: BigDecimal?,
        applySelectedWork: Boolean,
        selectedWorkIds: Set<Int>,
        workType: String?,
    ): List<WorkFacetGroupCountRow>

    @Query(
        """
        SELECT new com.aniwhere.server.adapter.out.persistence.repository.StatusFacetCountRow(
            s.status,
            COUNT(DISTINCT s.id)
        )
        FROM ShopEntity s
        WHERE (:applyRegion = false OR s.region.id IN :regionIds)
          AND (:applyCategory = false OR EXISTS (
              SELECT 1 FROM ShopEntity sc JOIN sc.categories c
              WHERE sc.id = s.id AND c.id IN :categoryIds
          ))
          AND (:applyWork = false OR EXISTS (
              SELECT 1 FROM ShopEntity sw JOIN sw.works w
              WHERE sw.id = s.id AND w.id IN :workIds
          ))
          AND (:keyword IS NULL OR s.name LIKE CONCAT('%', :keyword, '%'))
          AND (:swLat IS NULL OR (s.py BETWEEN :swLat AND :neLat AND s.px BETWEEN :swLng AND :neLng))
        GROUP BY s.status
        """,
    )
    fun findStatusFacetCounts(
        keyword: String?,
        applyRegion: Boolean,
        regionIds: Set<Short>,
        applyCategory: Boolean,
        categoryIds: Set<Short>,
        applyWork: Boolean,
        workIds: Set<Int>,
        swLat: BigDecimal?,
        swLng: BigDecimal?,
        neLat: BigDecimal?,
        neLng: BigDecimal?,
    ): List<StatusFacetCountRow>
}

data class RegionFacetCountRow(
    val id: Short,
    val name: String,
    val count: Long,
)

data class CategoryFacetCountRow(
    val id: Short,
    val name: String,
    val count: Long,
)

data class WorkFacetCountRow(
    val id: Int,
    val name: String,
    val coverUrl: String?,
    val count: Long,
)

data class WorkFacetCatalogRow(
    val id: Int,
    val name: String,
    val coverUrl: String?,
)

data class WorkFacetGroupCountRow(
    val workId: Int,
    val count: Long,
)

data class StatusFacetCountRow(
    val status: ShopStatusEnum,
    val count: Long,
)

data class ShopNameSuggestRow(
    val id: Long,
    val name: String,
)

interface RegionRepository : JpaRepository<RegionEntity, Short> {
    @Query(
        """
        SELECT new com.aniwhere.server.domain.region.model.RegionListItem(
            r.id, r.name, r.city, COUNT(DISTINCT s)
        )
        FROM RegionEntity r
        LEFT JOIN ShopEntity s ON s.region = r
        GROUP BY r.id, r.name, r.city
        ORDER BY r.name ASC
        """,
    )
    fun findAllWithShopCount(): List<RegionListItem>
}
interface CategoryRepository : JpaRepository<CategoryEntity, Short> {
    @Query(
        """
        SELECT new com.aniwhere.server.domain.category.model.CategoryListItem(
            c.id,
            c.name,
            COALESCE((
                SELECT COUNT(DISTINCT s.id)
                FROM ShopEntity s JOIN s.categories cat
                WHERE cat.id = c.id
            ), 0)
        )
        FROM CategoryEntity c
        ORDER BY c.name ASC
        """,
    )
    fun findAllWithShopCount(): List<CategoryListItem>
}
interface AnimationWorkRepository : JpaRepository<AnimationWorkEntity, Int> {
    @Query(
        """
        SELECT a FROM AnimationWorkEntity a
        ORDER BY a.popularity DESC NULLS LAST, a.name ASC
        """,
    )
    fun findAllOrderByPopularityDesc(): List<AnimationWorkEntity>

    @Query(
        """
        SELECT a FROM AnimationWorkEntity a
        ORDER BY a.popularity DESC NULLS LAST, a.name ASC
        """,
    )
    fun findAllOrderByPopularityDesc(pageable: Pageable): List<AnimationWorkEntity>
}

interface GameWorkRepository : JpaRepository<GameWorkEntity, Int> {
    @Query("SELECT g FROM GameWorkEntity g ORDER BY g.name ASC")
    fun findAllOrderByNameAsc(): List<GameWorkEntity>
}

interface WorkRepository : JpaRepository<WorkEntity, Int> {
    @Query(
        """
        SELECT w FROM WorkEntity w
        WHERE w.name LIKE CONCAT('%', :pattern, '%') ESCAPE '\'
           OR (TYPE(w) = AnimationWorkEntity
               AND TREAT(w AS AnimationWorkEntity).koreanTitle LIKE CONCAT('%', :pattern, '%') ESCAPE '\')
        ORDER BY
            CASE WHEN TYPE(w) = AnimationWorkEntity THEN TREAT(w AS AnimationWorkEntity).popularity ELSE NULL END DESC NULLS LAST,
            w.name ASC
        """,
    )
    fun suggestWorks(pattern: String, pageable: Pageable): List<WorkEntity>
}

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

interface ShopRepository : JpaRepository<ShopEntity, Long> {
    @Query("""
        SELECT DISTINCT s FROM ShopEntity s
        LEFT JOIN FETCH s.region
        LEFT JOIN s.categories c
        WHERE (:regionId IS NULL OR s.region.id = :regionId)
          AND (:categoryName IS NULL OR c.name = :categoryName)
          AND (:status IS NULL OR s.status = :status)
          AND (:keyword IS NULL OR s.name LIKE CONCAT('%', :keyword, '%'))
          AND (:workKeyword IS NULL OR EXISTS (
                  SELECT 1 FROM ShopEntity s2 JOIN s2.works w
                  WHERE s2.id = s.id AND (
                       w.name LIKE CONCAT('%', :workKeyword, '%')
                    OR (TYPE(w) = AnimationWorkEntity AND TREAT(w AS AnimationWorkEntity).koreanTitle LIKE CONCAT('%', :workKeyword, '%')))))
          AND (:workId IS NULL OR EXISTS (
                SELECT 1 FROM ShopEntity s2 JOIN s2.works w
                WHERE s2.id = s.id AND w.id = :workId))
    """,
    countQuery = """
        SELECT COUNT(DISTINCT s) FROM ShopEntity s
        LEFT JOIN s.categories c
        WHERE (:regionId IS NULL OR s.region.id = :regionId)
          AND (:categoryName IS NULL OR c.name = :categoryName)
          AND (:status IS NULL OR s.status = :status)
          AND (:keyword IS NULL OR s.name LIKE CONCAT('%', :keyword, '%'))
          AND (:workKeyword IS NULL OR EXISTS (
                  SELECT 1 FROM ShopEntity s2 JOIN s2.works w
                  WHERE s2.id = s.id AND (
                       w.name LIKE CONCAT('%', :workKeyword, '%')
                    OR (TYPE(w) = AnimationWorkEntity AND TREAT(w AS AnimationWorkEntity).koreanTitle LIKE CONCAT('%', :workKeyword, '%')))))
          AND (:workId IS NULL OR EXISTS (
                SELECT 1 FROM ShopEntity s2 JOIN s2.works w
                WHERE s2.id = s.id AND w.id = :workId))
    """)
    fun search(
        regionId: Short?,
        categoryName: String?,
        keyword: String?,
        workKeyword: String?,
        workId: Int?,
        status: ShopStatusEnum?,
        pageable: Pageable,
    ): Page<ShopEntity>
}

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
}

interface GameWorkRepository : JpaRepository<GameWorkEntity, Int> {
    @Query("SELECT g FROM GameWorkEntity g ORDER BY g.name ASC")
    fun findAllOrderByNameAsc(): List<GameWorkEntity>
}

interface WorkRepository : JpaRepository<WorkEntity, Int>

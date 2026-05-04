package com.aniwhere.server.adapter.out.persistence.repository

import com.aniwhere.server.adapter.out.persistence.entity.CategoryEntity
import com.aniwhere.server.adapter.out.persistence.entity.RegionEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopEntity
import com.aniwhere.server.adapter.out.persistence.entity.WorkEntity
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
          AND (:keyword IS NULL OR s.name LIKE CONCAT('%', :keyword, '%'))
          AND (:workName IS NULL OR EXISTS (
                SELECT 1 FROM ShopEntity s2 JOIN s2.works w
                WHERE s2.id = s.id AND w.name = :workName))
    """,
    countQuery = """
        SELECT COUNT(DISTINCT s) FROM ShopEntity s
        LEFT JOIN s.categories c
        WHERE (:regionId IS NULL OR s.region.id = :regionId)
          AND (:categoryName IS NULL OR c.name = :categoryName)
          AND (:keyword IS NULL OR s.name LIKE CONCAT('%', :keyword, '%'))
          AND (:workName IS NULL OR EXISTS (
                SELECT 1 FROM ShopEntity s2 JOIN s2.works w
                WHERE s2.id = s.id AND w.name = :workName))
    """)
    fun search(regionId: Short?, categoryName: String?, keyword: String?, workName: String?, pageable: Pageable): Page<ShopEntity>
}

interface RegionRepository : JpaRepository<RegionEntity, Short>
interface CategoryRepository : JpaRepository<CategoryEntity, Short>
interface WorkRepository : JpaRepository<WorkEntity, Int>

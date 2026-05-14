import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation } from 'react-router-dom'
import { deleteShop, getShops } from '../../shared/api/shops'
import type { Shop, ShopStatus } from '../../shared/api/types'
import { formatRelativeUpdated } from '../../shared/lib/format'
import { AitButton, AitNavigation } from '../../shared/ui/ait'
import { StatusPill } from '../../shared/ui/StatusPill'

type AdminShopManageLocationState = {
  notice?: string
}

const SHOP_MANAGE_PAGE_SIZE = 20
const SHOP_TOAST_VISIBLE_MS = 2800

type ShopStatusFilter = 'ALL' | ShopStatus

function formatShopMeta(shop: Shop) {
  const parts = [shop.regionName, shop.floor].filter(Boolean)

  if (parts.length === 0) {
    return formatRelativeUpdated(shop.updatedAt)
  }

  return `${parts.join(' · ')} · ${formatRelativeUpdated(shop.updatedAt)}`
}

function isNoticeError(message: string) {
  return message.includes('실패') || message.includes('삭제')
}

function getShopDeleteErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '매장 삭제에 실패했습니다.'
}

export function AdminShopManagePage() {
  const queryClient = useQueryClient()
  const location = useLocation()
  const [keywordInput, setKeywordInput] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<ShopStatusFilter>('ALL')
  const [notice, setNotice] = useState<string | null>(
    () => (location.state as AdminShopManageLocationState | null)?.notice ?? null,
  )
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  const shopsQuery = useQuery({
    queryKey: ['shops', 'admin-shop-manage', appliedKeyword, statusFilter, currentPage],
    queryFn: () =>
      getShops({
        page: currentPage,
        size: SHOP_MANAGE_PAGE_SIZE,
        keyword: appliedKeyword || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
  })

  const summaryQueryParams = {
    page: 0,
    size: 1,
    keyword: appliedKeyword || undefined,
  }

  const totalSummaryQuery = useQuery({
    queryKey: ['shops', 'admin-shop-summary', appliedKeyword, 'ALL'],
    queryFn: () => getShops(summaryQueryParams),
  })

  const activeSummaryQuery = useQuery({
    queryKey: ['shops', 'admin-shop-summary', appliedKeyword, 'ACTIVE'],
    queryFn: () => getShops({ ...summaryQueryParams, status: 'ACTIVE' }),
  })

  const pendingSummaryQuery = useQuery({
    queryKey: ['shops', 'admin-shop-summary', appliedKeyword, 'UNVERIFIED'],
    queryFn: () => getShops({ ...summaryQueryParams, status: 'UNVERIFIED' }),
  })

  const closedSummaryQuery = useQuery({
    queryKey: ['shops', 'admin-shop-summary', appliedKeyword, 'CLOSED'],
    queryFn: () => getShops({ ...summaryQueryParams, status: 'CLOSED' }),
  })

  const shops = useMemo(() => shopsQuery.data?.content ?? [], [shopsQuery.data?.content])
  const totalPages = shopsQuery.data?.totalPages ?? 0
  const canGoPrevious = currentPage > 0 && !shopsQuery.isFetching
  const canGoNext = !!shopsQuery.data && !shopsQuery.data.last && !shopsQuery.isFetching

  const submitSearch = () => {
    setCurrentPage(0)
    setAppliedKeyword(keywordInput.trim())
  }

  const changeStatusFilter = (nextFilter: ShopStatusFilter) => {
    setStatusFilter(nextFilter)
    setCurrentPage(0)
  }

  useEffect(() => {
    if (!notice) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setNotice(null), SHOP_TOAST_VISIBLE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [notice])

  const deleteShopMutation = useMutation({
    mutationFn: deleteShop,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['shops'] })
      setDeleteTargetId(null)
      setNotice('매장을 삭제했습니다.')
    },
    onError: (error) => {
      setNotice(getShopDeleteErrorMessage(error))
    },
  })

  const requestDelete = (shop: Shop) => {
    if (deleteShopMutation.isPending) {
      return
    }

    setDeleteTargetId(shop.id)
  }

  const cancelDelete = () => {
    if (deleteShopMutation.isPending) {
      return
    }

    setDeleteTargetId(null)
  }

  const confirmDelete = (shop: Shop) => {
    if (deleteShopMutation.isPending) {
      return
    }

    deleteShopMutation.mutate(shop.id)
  }

  return (
    <main className="app-shell admin-shell admin-shop-crud-shell">
      <AitNavigation className="route-navigation" showBack title="매장 관리" showLogo={false} />

      <section className="admin-shop-crud-layout">
        <section className="admin-shop-manage-summary" aria-label="매장 관리 요약">
          <div>
            <span>전체 매장</span>
            <strong>{totalSummaryQuery.data?.totalElements ?? 0}</strong>
          </div>
          <div>
            <span>운영 중</span>
            <strong>{activeSummaryQuery.data?.totalElements ?? 0}</strong>
          </div>
          <div>
            <span>검증 필요</span>
            <strong>{pendingSummaryQuery.data?.totalElements ?? 0}</strong>
          </div>
          <div>
            <span>영업 종료</span>
            <strong>{closedSummaryQuery.data?.totalElements ?? 0}</strong>
          </div>
        </section>

        <Link className="admin-shop-create-link" to="/admin/shops/new">
          <AitButton display="full" type="button">
            매장 등록
          </AitButton>
        </Link>

        <section className="admin-shop-manage-tools" aria-label="매장 검색과 필터">
          <form
            className="admin-shop-manage-search"
            onSubmit={(event) => {
              event.preventDefault()
              submitSearch()
            }}
          >
            <input
              className="text-input"
              placeholder="매장명 또는 주소 검색"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
            />
            <button className="admin-shop-manage-search-button" type="submit">
              검색
            </button>
          </form>

          <div className="admin-shop-status-filter" role="tablist" aria-label="상태 필터">
            {[
              ['ALL', '전체'],
              ['UNVERIFIED', '검증 필요'],
              ['ACTIVE', '운영 중'],
              ['CLOSED', '영업 종료'],
            ].map(([value, label]) => (
              <button
                aria-selected={statusFilter === value}
                className="admin-shop-status-filter-button"
                key={value}
                role="tab"
                type="button"
                onClick={() => changeStatusFilter(value as ShopStatusFilter)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="admin-shop-manage-list-shell" aria-label="매장 목록">
          <div className="admin-shop-manage-list-head">
            <span>총 {shopsQuery.data?.totalElements ?? 0}건</span>
          </div>

          <div className="admin-shop-manage-list">
          {shopsQuery.isLoading ? <p className="admin-shop-manage-state">매장 목록을 불러오는 중입니다.</p> : null}
          {shopsQuery.isError ? (
            <p className="admin-shop-manage-state error-text">{(shopsQuery.error as Error).message}</p>
          ) : null}
          {!shopsQuery.isLoading && shops.length === 0 ? (
            <p className="admin-shop-manage-state">이 페이지에 표시할 매장이 없습니다.</p>
          ) : null}

          {shops.map((shop) => (
            <article className="admin-shop-manage-row" key={shop.id}>
              <div className="admin-shop-manage-row-copy">
                <div className="admin-shop-manage-row-head">
                  <strong>{shop.name}</strong>
                  <StatusPill status={shop.status} />
                </div>
                <span>{shop.address}</span>
                <small>{formatShopMeta(shop)}</small>
              </div>
              {deleteTargetId === shop.id ? (
                <div className="admin-shop-delete-confirm" role="group" aria-label="매장 삭제 확인">
                  <span>삭제할까요?</span>
                  <div className="admin-shop-delete-actions">
                    <button
                      className="admin-shop-manage-action"
                      disabled={deleteShopMutation.isPending}
                      type="button"
                      onClick={cancelDelete}
                    >
                      취소
                    </button>
                    <button
                      className="admin-shop-manage-action danger"
                      disabled={deleteShopMutation.isPending}
                      type="button"
                      onClick={() => confirmDelete(shop)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ) : (
                <div className="admin-shop-manage-row-actions">
                  <Link className="admin-shop-manage-action" to={`/admin/shops/${shop.id}/edit`}>
                    수정
                  </Link>
                  <button
                    className="admin-shop-manage-action danger"
                    disabled={deleteShopMutation.isPending}
                    type="button"
                    onClick={() => requestDelete(shop)}
                  >
                    삭제
                  </button>
                </div>
              )}
            </article>
          ))}
          </div>
        </section>

        <nav className="admin-shop-pagination" aria-label="매장 목록 페이지">
          <button
            className="admin-shop-page-button"
            disabled={!canGoPrevious}
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
          >
            이전
          </button>
          <span>
            {totalPages > 0 ? `${currentPage + 1} / ${totalPages}` : '0 / 0'}
          </span>
          <button
            className="admin-shop-page-button"
            disabled={!canGoNext}
            type="button"
            onClick={() => setCurrentPage((page) => page + 1)}
          >
            다음
          </button>
        </nav>
      </section>

      {notice ? (
        <p
          className={`admin-shop-toast ${isNoticeError(notice) ? 'admin-shop-toast-error' : 'admin-shop-toast-success'}`}
          role="status"
        >
          {notice}
        </p>
      ) : null}
    </main>
  )
}

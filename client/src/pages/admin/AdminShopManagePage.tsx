import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Toast } from '@aniwhere/tds-mobile'
import { deleteShop, getShops } from '../../shared/api/shops'
import type { Shop, ShopStatus } from '../../shared/api/types'
import { formatRelativeUpdated } from '../../shared/lib/format'
import { AppTopNavigation } from '../../shared/ui/AppTopNavigation'
import { StatusPill } from '../../shared/ui/StatusPill'
import {
  clearAdminShopManageNotice,
  readAdminShopManageNotice,
} from './AdminShopDraftStore'

type AdminShopManageLocationState = {
  notice?: string
}

const SHOP_MANAGE_PAGE_SIZE = 20
const SHOP_TOAST_VISIBLE_MS = 3000

type ShopStatusFilter = 'ALL' | ShopStatus

function formatShopMeta(shop: Shop) {
  const parts = [shop.regionName, shop.floor].filter(Boolean)

  if (parts.length === 0) {
    return formatRelativeUpdated(shop.updatedAt)
  }

  return `${parts.join(' · ')} · ${formatRelativeUpdated(shop.updatedAt)}`
}

function getShopDeleteErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '매장을 삭제하지 못했어요.'
}

function buildShopDeletedNotice(shopName: string) {
  return `${shopName} 매장을 삭제했어요.`
}

export function AdminShopManagePage() {
  const queryClient = useQueryClient()
  const location = useLocation()
  const navigate = useNavigate()
  const [keywordInput, setKeywordInput] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<ShopStatusFilter>('ALL')
  const [notice, setNotice] = useState<string | null>(
    () => (location.state as AdminShopManageLocationState | null)?.notice ?? readAdminShopManageNotice(),
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
  }

  const totalSummaryQuery = useQuery({
    queryKey: ['shops', 'admin-shop-summary', 'ALL'],
    queryFn: () => getShops(summaryQueryParams),
  })

  const activeSummaryQuery = useQuery({
    queryKey: ['shops', 'admin-shop-summary', 'ACTIVE'],
    queryFn: () => getShops({ ...summaryQueryParams, status: 'ACTIVE' }),
  })

  const pendingSummaryQuery = useQuery({
    queryKey: ['shops', 'admin-shop-summary', 'UNVERIFIED'],
    queryFn: () => getShops({ ...summaryQueryParams, status: 'UNVERIFIED' }),
  })

  const closedSummaryQuery = useQuery({
    queryKey: ['shops', 'admin-shop-summary', 'CLOSED'],
    queryFn: () => getShops({ ...summaryQueryParams, status: 'CLOSED' }),
  })

  const shops = useMemo(() => shopsQuery.data?.content ?? [], [shopsQuery.data?.content])
  const totalPages = shopsQuery.data?.totalPages ?? 0
  const canGoPrevious = currentPage > 0 && !shopsQuery.isFetching
  const canGoNext = !!shopsQuery.data && !shopsQuery.data.last && !shopsQuery.isFetching
  const closeNotice = useCallback(() => setNotice(null), [])
  const resultLabel = appliedKeyword || statusFilter !== 'ALL' ? '검색 결과' : '전체 목록'

  useEffect(() => {
    if ((location.state as AdminShopManageLocationState | null)?.notice || readAdminShopManageNotice()) {
      clearAdminShopManageNotice()
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
    }
  }, [location.pathname, location.search, location.state, navigate])

  const submitSearch = () => {
    setCurrentPage(0)
    setAppliedKeyword(keywordInput.trim())
  }

  const changeStatusFilter = (nextFilter: ShopStatusFilter) => {
    setStatusFilter(nextFilter)
    setCurrentPage(0)
  }

  const deleteShopMutation = useMutation({
    mutationFn: async (shop: Shop) => {
      await deleteShop(shop.id)
      return shop
    },
    onSuccess: async (deletedShop) => {
      await queryClient.invalidateQueries({ queryKey: ['shops'] })
      setDeleteTargetId(null)
      setNotice(buildShopDeletedNotice(deletedShop.name))
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

    deleteShopMutation.mutate(shop)
  }

  return (
    <main className="app-shell admin-shell admin-shop-crud-shell admin-shop-manage-shell">
      <AppTopNavigation
        className="route-navigation"
        showBack
        title="매장 관리"
        showLogo={false}
        onBack={() => navigate('/admin', { replace: true })}
      />

      <section className="admin-shop-crud-layout">
        <header className="admin-manage-page-header">
          <h1>매장 관리</h1>
        </header>

        <section className="admin-shop-manage-summary" aria-label="매장 관리 요약">
          <div>
            <span>등록 매장</span>
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

        <div className="admin-shop-create-link">
          <Button
            className="admin-shop-create-button"
            display="block"
            type="button"
            onClick={() => navigate('/admin/shops/new', { state: { returnTo: '/admin/shops' } })}
          >
            매장 등록
          </Button>
        </div>

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
            <span>
              {resultLabel} {shopsQuery.data?.totalElements ?? 0}건
            </span>
          </div>

          <div className="admin-shop-manage-list">
            {shopsQuery.isLoading ? <p className="admin-shop-manage-state">매장 목록을 불러오고 있어요.</p> : null}
            {shopsQuery.isError ? (
              <p className="admin-shop-manage-state error-text">{(shopsQuery.error as Error).message}</p>
            ) : null}
            {!shopsQuery.isLoading && shops.length === 0 ? (
              <p className="admin-shop-manage-state">조건에 맞는 매장이 없어요.</p>
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
                    <span>매장을 삭제할까요?</span>
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
                    <Link
                      className="admin-shop-manage-action"
                      to={`/admin/shops/${shop.id}/edit`}
                      state={{ returnTo: '/admin/shops' }}
                    >
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

      <Toast
        aria-live="polite"
        duration={SHOP_TOAST_VISIBLE_MS}
        higherThanCTA
        open={notice != null}
        position="bottom"
        text={notice ?? ''}
        onClose={closeNotice}
      />
    </main>
  )
}

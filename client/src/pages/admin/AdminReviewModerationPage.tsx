import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Toast } from '@aniwhere/tds-mobile'
import { listShopReviews, updateShopReviewStatus } from '../../shared/api/shopReviews'
import { getShops } from '../../shared/api/shops'
import type { Shop, ShopReview, ShopReviewStatus } from '../../shared/api/types'
import { formatDateTime } from '../../shared/lib/format'
import { AppTopNavigation } from '../../shared/ui/AppTopNavigation'

const REVIEW_TOAST_VISIBLE_MS = 3000
const REVIEW_STATUSES: Array<{ label: string; value: ShopReviewStatus }> = [
  { label: '공개', value: 'VISIBLE' },
  { label: '숨김', value: 'HIDDEN' },
  { label: '삭제 처리', value: 'DELETED' },
]

function reviewStatusLabel(status: ShopReviewStatus) {
  return REVIEW_STATUSES.find((item) => item.value === status)?.label ?? status
}

function getReviewSummary(review: ShopReview) {
  return `${review.authorNickname} · ${review.rating.toFixed(1)}점 · ${formatDateTime(review.createdAt)}`
}

export function AdminReviewModerationPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const shopsQuery = useQuery({
    queryKey: ['shops', 'admin-review-branches'],
    queryFn: () => getShops({ page: 0, size: 20 }),
  })
  const shops = useMemo(() => shopsQuery.data?.content ?? [], [shopsQuery.data?.content])
  const effectiveShopId = selectedShopId ?? shops[0]?.id ?? null
  const selectedShop = shops.find((shop) => shop.id === effectiveShopId) ?? null

  const reviewsQuery = useQuery({
    enabled: effectiveShopId != null,
    queryKey: ['shop-reviews', 'admin-review-moderation', effectiveShopId],
    queryFn: () => listShopReviews(effectiveShopId as number, { page: 0, size: 20, sort: 'NEWEST' }),
  })
  const reviews = reviewsQuery.data?.content ?? []

  const statusMutation = useMutation({
    mutationFn: ({ review, status }: { review: ShopReview; status: ShopReviewStatus }) =>
      updateShopReviewStatus(review.shopId, review.id, status),
    onSuccess: async (review) => {
      await queryClient.invalidateQueries({ queryKey: ['shop-reviews', 'admin-review-moderation', review.shopId] })
      setNotice('리뷰 상태를 변경했어요.')
    },
    onError: (error) => {
      setNotice(error instanceof Error ? error.message : '리뷰 상태를 변경하지 못했어요.')
    },
  })

  const changeReviewStatus = (review: ShopReview, status: ShopReviewStatus) => {
    if (review.status === status || statusMutation.isPending) {
      return
    }
    statusMutation.mutate({ review, status })
  }

  return (
    <main className="app-shell admin-shell admin-shop-crud-shell admin-branch-page-shell">
      <AppTopNavigation
        className="route-navigation"
        showBack
        title="리뷰 검수"
        showLogo={false}
        onBack={() => navigate('/admin', { replace: true })}
      />

      <section className="admin-branch-page">
        <header className="admin-branch-page-head">
          <h1>리뷰 검수</h1>
          <p>매장을 고른 뒤 방문 리뷰 상태를 공개, 숨김, 삭제 처리로 변경해요.</p>
        </header>

        <section className="admin-branch-panel" aria-label="매장 선택">
          <div className="admin-branch-panel-head">
            <strong>매장</strong>
            <Link className="admin-branch-text-link" to="/admin/shops">
              매장 관리
            </Link>
          </div>
          <div className="admin-branch-chip-row" role="listbox" aria-label="리뷰를 확인할 매장">
            {shopsQuery.isLoading ? <p className="admin-shop-manage-state">매장 목록을 불러오고 있어요.</p> : null}
            {shops.map((shop: Shop) => (
              <button
                aria-selected={effectiveShopId === shop.id}
                className="admin-branch-chip"
                key={shop.id}
                role="option"
                type="button"
                onClick={() => setSelectedShopId(shop.id)}
              >
                {shop.name}
              </button>
            ))}
          </div>
        </section>

        <section className="admin-branch-panel" aria-label="리뷰 목록">
          <div className="admin-branch-panel-head">
            <strong>{selectedShop?.name ?? '리뷰'}</strong>
            <span>{reviewsQuery.data?.totalElements ?? 0}건</span>
          </div>

          <div className="admin-branch-list">
            {reviewsQuery.isLoading ? <p className="admin-shop-manage-state">리뷰를 불러오고 있어요.</p> : null}
            {reviewsQuery.isError ? (
              <p className="admin-shop-manage-state error-text">{(reviewsQuery.error as Error).message}</p>
            ) : null}
            {!reviewsQuery.isLoading && reviews.length === 0 ? (
              <p className="admin-shop-manage-state">검수할 리뷰가 없어요.</p>
            ) : null}
            {reviews.map((review) => (
              <article className="admin-branch-row" key={review.id}>
                <div className="admin-branch-row-copy">
                  <div className="admin-branch-row-head">
                    <strong>{reviewStatusLabel(review.status)}</strong>
                    <span>{getReviewSummary(review)}</span>
                  </div>
                  <p>{review.content}</p>
                </div>
                <div className="admin-branch-action-grid" role="group" aria-label="리뷰 상태 변경">
                  {REVIEW_STATUSES.map((status) => (
                    <button
                      aria-pressed={review.status === status.value}
                      className="admin-branch-action"
                      disabled={statusMutation.isPending}
                      key={status.value}
                      type="button"
                      onClick={() => changeReviewStatus(review, status.value)}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <Toast
        aria-live="polite"
        duration={REVIEW_TOAST_VISIBLE_MS}
        higherThanCTA
        open={notice != null}
        position="bottom"
        text={notice ?? ''}
        onClose={() => setNotice(null)}
      />
    </main>
  )
}

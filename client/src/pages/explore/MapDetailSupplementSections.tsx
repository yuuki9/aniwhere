import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Modal, Rating } from '@aniwhere/tds-mobile'
import type { PageResponse, Shop, ShopReview } from '../../shared/api/types'
import { formatDateTime } from '../../shared/lib/format'
import type { MapDetailTab } from './MapDetailSummaryCard'

const WORK_FEED_PREVIEW_LIMIT = 5

type MapDetailSupplementSectionsProps = {
  shop: Shop
  activeTab: MapDetailTab
  mediaItems: Array<{
    id: string
    src: string
    alt: string
  }>
  reviewPage?: PageResponse<ShopReview> | null
  isReviewLoading?: boolean
  reviewErrorMessage?: string | null
  currentUserId?: number | null
  deletingReviewId?: number | null
  onStartReview: () => void
  onEditReview?: (review: ShopReview) => void
  onDeleteReview?: (review: ShopReview) => void
}

export function MapDetailSupplementSections({
  shop,
  activeTab,
  mediaItems,
  reviewPage = null,
  isReviewLoading = false,
  reviewErrorMessage = null,
  currentUserId = null,
  deletingReviewId = null,
  onStartReview,
  onEditReview,
  onDeleteReview,
}: MapDetailSupplementSectionsProps) {
  const [expandedWorkFeedShopId, setExpandedWorkFeedShopId] = useState<number | null>(null)
  const [deleteConfirmReview, setDeleteConfirmReview] = useState<ShopReview | null>(null)
  const isWorkFeedExpanded = expandedWorkFeedShopId === shop.id
  const visibleWorks = isWorkFeedExpanded ? shop.works : shop.works.slice(0, WORK_FEED_PREVIEW_LIMIT)
  const hiddenWorkCount = Math.max(0, shop.works.length - WORK_FEED_PREVIEW_LIMIT)
  const reviews = reviewPage?.content ?? []

  if (activeTab === 'works') {
    return (
      <section className="section map-sheet-info-card map-sheet-tab-panel" id="map-place-works">
        {shop.works.length > 0 ? (
          <div className="map-sheet-work-feed" aria-label={`취급 작품 ${shop.works.length}개`}>
            <div className="map-sheet-work-feed-head">
              <strong>취급 작품</strong>
              <span>{shop.works.length}개</span>
            </div>
            <div className="map-sheet-work-list">
              {visibleWorks.map((work) => (
                <Link
                  className="map-sheet-work-row"
                  key={work.id}
                  to={`/explore?view=list&scope=work&keyword=${encodeURIComponent(work.name)}`}
                >
                  {work.coverUrl ? (
                    <img
                      className="map-sheet-work-cover"
                      src={work.coverUrl}
                      alt={`${work.name} 포스터`}
                      loading="lazy"
                    />
                  ) : (
                    <span className="map-sheet-work-cover map-sheet-work-cover-fallback" aria-hidden="true">
                      {work.name.trim().slice(0, 1) || '?'}
                    </span>
                  )}
                  <span className="map-sheet-work-copy">
                    <strong>{work.name}</strong>
                    <span>이 작품으로 매장 더 보기</span>
                  </span>
                  <span className="map-sheet-work-action" aria-hidden="true">
                    ›
                  </span>
                </Link>
              ))}
            </div>
            {hiddenWorkCount > 0 ? (
              <button
                className="map-sheet-work-more"
                type="button"
                aria-expanded={isWorkFeedExpanded}
                onClick={() => setExpandedWorkFeedShopId(isWorkFeedExpanded ? null : shop.id)}
              >
                {isWorkFeedExpanded ? '접기' : `작품 ${hiddenWorkCount}개 더 보기`}
              </button>
            ) : null}
          </div>
        ) : (
          <p className="map-sheet-footnote">아직 연결된 작품 정보가 없어요.</p>
        )}
      </section>
    )
  }

  if (activeTab === 'photos') {
    return (
      <section className="section map-sheet-info-card map-sheet-tab-panel" id="map-place-photos">
        {mediaItems.length > 0 ? (
          <div className="map-sheet-photo-feed">
            {mediaItems.map((item) => (
              <article className="map-sheet-photo-item" key={item.id}>
                <img src={item.src} alt={item.alt} />
              </article>
            ))}
          </div>
        ) : (
          <p className="map-sheet-footnote">등록된 매장 사진이 없어요.</p>
        )}
      </section>
    )
  }

  if (activeTab === 'review') {
    return (
      <section className="section map-sheet-info-card map-sheet-tab-panel map-place-review-card" id="map-place-review">
        <div className="map-place-review-head">
          <div className="map-place-review-copy">
            <span>{shop.reviewCount > 0 ? `방문 리뷰 ${shop.reviewCount}개` : '방문 리뷰를 기다리고 있어요.'}</span>
            <p>
              {shop.averageRating != null
                ? `평균 별점 ${shop.averageRating.toFixed(1)}점이에요.`
                : '다녀온 매장 이야기와 굿즈 정보를 리뷰로 남기면 다음 방문자에게 도움이 돼요.'}
            </p>
          </div>
          <button className="map-place-review-button" type="button" onClick={onStartReview}>
            리뷰 작성하기
          </button>
        </div>

        {isReviewLoading ? <p className="map-sheet-footnote">리뷰를 불러오고 있어요.</p> : null}
        {reviewErrorMessage != null ? <p className="map-sheet-footnote map-place-review-error">{reviewErrorMessage}</p> : null}
        {!isReviewLoading && reviewErrorMessage == null && reviews.length === 0 ? (
          <p className="map-sheet-footnote">아직 등록된 리뷰가 없어요.</p>
        ) : null}

        {reviews.length > 0 ? (
          <div className="map-place-review-list">
            {reviews.map((review) => {
              const isMyReview = currentUserId != null && review.authorUserId === currentUserId
              const reviewDate = review.updatedAt ?? review.createdAt

              return (
                <article className="map-place-review-item" key={review.id}>
                  <div className="map-place-review-item-head">
                    <div className="map-place-review-author">
                      <strong>{review.authorNickname}</strong>
                      <span>{formatDateTime(reviewDate)}</span>
                    </div>
                    <Rating
                      aria-label={`${review.authorNickname} 별점`}
                      aria-valuetext={`5점 만점 중 ${review.rating}점`}
                      max={5}
                      readOnly
                      size="small"
                      value={review.rating}
                    />
                  </div>
                  <p className="map-place-review-text">{review.content}</p>
                  {review.images.length > 0 ? (
                    <div className="map-place-review-images" aria-label="리뷰 사진">
                      {review.images.map((image) => (
                        <img
                          alt={`${review.authorNickname} 리뷰 사진`}
                          key={`${image.id ?? image.url}-${image.sortOrder}`}
                          src={image.url}
                          loading="lazy"
                        />
                      ))}
                    </div>
                  ) : null}
                  {isMyReview ? (
                    <div className="map-place-review-actions" aria-label="내 리뷰 관리">
                      <button className="map-place-review-action" type="button" onClick={() => onEditReview?.(review)}>
                        수정
                      </button>
                      <button
                        className="map-place-review-action map-place-review-action-danger"
                        type="button"
                        disabled={deletingReviewId === review.id}
                        onClick={() => setDeleteConfirmReview(review)}
                      >
                        삭제
                      </button>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        ) : null}

        <Modal
          open={deleteConfirmReview != null}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteConfirmReview(null)
            }
          }}
        >
          <Modal.Overlay onClick={() => setDeleteConfirmReview(null)} />
          <Modal.Content className="map-review-leave-modal" aria-labelledby="map-review-delete-title" aria-modal="true">
            <div className="map-review-leave-copy">
              <strong id="map-review-delete-title">리뷰를 삭제할까요?</strong>
              <p>삭제한 리뷰는 다시 복구할 수 없어요.</p>
            </div>
            <div className="map-review-leave-actions">
              <Button color="dark" display="block" variant="weak" onClick={() => setDeleteConfirmReview(null)}>
                취소
              </Button>
              <Button
                color="danger"
                display="block"
                loading={deleteConfirmReview != null && deletingReviewId === deleteConfirmReview.id}
                onClick={() => {
                  if (deleteConfirmReview != null) {
                    onDeleteReview?.(deleteConfirmReview)
                    setDeleteConfirmReview(null)
                  }
                }}
              >
                삭제하기
              </Button>
            </div>
          </Modal.Content>
        </Modal>
      </section>
    )
  }

  return null
}

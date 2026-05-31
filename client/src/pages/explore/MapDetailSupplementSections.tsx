import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Menu, Modal, Rating, Result } from '@aniwhere/tds-mobile'
import type { PageResponse, Shop, ShopReview } from '../../shared/api/types'
import type { MapDetailTab } from './MapDetailSummaryCard'

const WORK_FEED_PREVIEW_LIMIT = 5
const TOSS_EMOJI_BASE_URL = 'https://static.toss.im/2d-emojis/png/4x/'
const EMPTY_REVIEWS: ShopReview[] = []

function normalizeRating(value: number) {
  return Math.max(0, Math.min(5, Number.isFinite(value) ? value : 0))
}

function emojiImageUrl(filename: string | null | undefined) {
  const normalized = filename?.trim()
  if (!normalized) {
    return null
  }

  return `${TOSS_EMOJI_BASE_URL}${encodeURIComponent(normalized)}`
}

function formatReviewDate(value: string) {
  const target = new Date(value)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime()
  const dayDiff = Math.max(0, Math.floor((startOfToday - startOfTarget) / (1000 * 60 * 60 * 24)))

  if (dayDiff === 0) {
    return '오늘'
  }

  if (dayDiff < 7) {
    return `${dayDiff}일 전`
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul',
  })
    .format(target)
    .replace(/\.\s?$/, '')
}

function formatReviewEditedDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul',
  })
    .format(new Date(value))
    .replace(/\.\s?/g, '.')
    .replace(/\.$/, '')
}

function isReviewEdited(review: ShopReview) {
  if (!review.updatedAt) {
    return false
  }

  return new Date(review.updatedAt).getTime() > new Date(review.createdAt).getTime()
}

type DetailMediaItem = {
  id: string
  src: string
  alt: string
}

type MapDetailSupplementSectionsProps = {
  shop: Shop
  activeTab: MapDetailTab
  mediaItems: DetailMediaItem[]
  reviewPage?: PageResponse<ShopReview> | null
  isReviewLoading?: boolean
  reviewErrorMessage?: string | null
  currentUserId?: number | null
  currentUserEmojiIconFilename?: string | null
  currentUserNickname?: string | null
  deletingReviewId?: number | null
  likingReviewId?: number | null
  onStartReview: () => void
  onEditReview?: (review: ShopReview) => void
  onDeleteReview?: (review: ShopReview) => void
  onReportReview?: (review: ShopReview) => void
  onToggleReviewLike?: (review: ShopReview, nextLiked: boolean) => void
  onShowReviewFromPhoto?: (review: ShopReview) => void
}

export type PhotoViewerItem = {
  id: string
  src: string
  alt: string
}

type MapPhotoFeedItem = PhotoViewerItem & {
  kind: 'shop' | 'review'
  review?: ShopReview
  reviewImages?: PhotoViewerItem[]
  reviewPhotoIndex?: number
}

export type MapPhotoViewerState = {
  items: PhotoViewerItem[]
  activeIndex: number
  review?: ShopReview
  authorEmojiUrl?: string | null
}

type MapPhotoViewerProps = {
  state: MapPhotoViewerState
  onActiveIndexChange: (index: number) => void
  onClose: () => void
  currentUserId?: number | null
  onDeleteReview?: (review: ShopReview) => void
  onEditReview?: (review: ShopReview) => void
  onReportReview?: (review: ShopReview) => void
  onShowReview?: (review: ShopReview) => void
}

function reviewImageItems(review: ShopReview): PhotoViewerItem[] {
  return review.images.map((image, index) => ({
    id: `review-${review.id}-${image.id ?? image.sortOrder}-${index}`,
    src: image.url,
    alt: `${review.authorNickname} 리뷰 사진 ${index + 1}`,
  }))
}

function ReviewActionMenu({
  className,
  isMyReview = false,
  onDeleteReview,
  onEditReview,
  review,
  onReportReview,
}: {
  className?: string
  isMyReview?: boolean
  onDeleteReview?: (review: ShopReview) => void
  onEditReview?: (review: ShopReview) => void
  review: ShopReview
  onReportReview?: (review: ShopReview) => void
}) {
  return (
    <Menu.Trigger
      className={['map-place-review-menu', className].filter(Boolean).join(' ')}
      placement="bottom-end"
      dropdown={
        <Menu.Dropdown>
          {isMyReview ? (
            <>
              {onEditReview ? (
                <Menu.DropdownItem
                  onClick={() => {
                    onEditReview(review)
                  }}
                >
                  수정하기
                </Menu.DropdownItem>
              ) : null}
              {onDeleteReview ? (
                <Menu.DropdownItem
                  onClick={() => {
                    onDeleteReview(review)
                  }}
                >
                  삭제하기
                </Menu.DropdownItem>
              ) : null}
            </>
          ) : (
            <Menu.DropdownItem
              onClick={() => {
                onReportReview?.(review)
              }}
            >
              리뷰 신고하기
            </Menu.DropdownItem>
          )}
        </Menu.Dropdown>
      }
    >
      <button className="map-place-review-more-button" type="button" aria-label="리뷰 더보기">
        <span aria-hidden="true">⋮</span>
      </button>
    </Menu.Trigger>
  )
}

export function MapPhotoViewer({
  state,
  onActiveIndexChange,
  onClose,
  currentUserId,
  onDeleteReview,
  onEditReview,
  onReportReview,
  onShowReview,
}: MapPhotoViewerProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const review = state.review
  const isMyReview = review != null && currentUserId != null && review.authorUserId === currentUserId

  useEffect(() => {
    const track = trackRef.current

    if (!track || state.items.length === 0) {
      return
    }

    track.scrollTo({
      left: track.clientWidth * state.activeIndex,
      behavior: 'auto',
    })
  }, [state.activeIndex, state.items.length])

  const handleScroll = () => {
    const track = trackRef.current

    if (!track || track.clientWidth <= 0) {
      return
    }

    const nextIndex = Math.round(track.scrollLeft / track.clientWidth)
    const boundedIndex = Math.max(0, Math.min(state.items.length - 1, nextIndex))

    if (boundedIndex !== state.activeIndex) {
      onActiveIndexChange(boundedIndex)
    }
  }

  return (
    <div className="map-photo-viewer" role="dialog" aria-modal="true" aria-label="사진 보기">
      <div className="map-photo-viewer-top">
        <button className="map-photo-viewer-close" type="button" aria-label="사진 닫기" onClick={onClose}>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M5 5l14 14M19 5 5 19" />
          </svg>
        </button>
        <strong>
          {state.activeIndex + 1} / {state.items.length}
        </strong>
        {review ? (
          <ReviewActionMenu
            className="map-photo-viewer-menu"
            isMyReview={isMyReview}
            review={review}
            onDeleteReview={onDeleteReview}
            onEditReview={onEditReview}
            onReportReview={onReportReview}
          />
        ) : (
          <span className="map-photo-viewer-menu" aria-hidden="true">
            ⋮
          </span>
        )}
      </div>
      <div className="map-photo-viewer-track" ref={trackRef} onScroll={handleScroll}>
        {state.items.map((item) => {
          const reviewDate = review ? review.updatedAt ?? review.createdAt : null
          const ratingValue = review ? normalizeRating(review.rating) : 0

          return (
            <article
              className={['map-photo-viewer-slide', review == null ? 'map-photo-viewer-slide-shop' : '']
                .filter(Boolean)
                .join(' ')}
              key={item.id}
            >
              <div className="map-photo-viewer-image-frame">
                <img src={item.src} alt={item.alt} />
              </div>
              {review ? (
                <div className="map-photo-viewer-review">
                  <div className="map-photo-viewer-author">
                    {state.authorEmojiUrl != null ? (
                      <img src={state.authorEmojiUrl} alt="" aria-hidden="true" />
                    ) : (
                      <span aria-hidden="true">{review.authorNickname.trim().slice(0, 1) || '?'}</span>
                    )}
                    <div>
                      <strong>{review.authorNickname}</strong>
                      {reviewDate != null ? <span>{formatReviewDate(reviewDate)}</span> : null}
                    </div>
                  </div>
                  <Rating
                    aria-label={`${review.authorNickname} 별점`}
                    aria-valuetext={`5점 만점 중 ${ratingValue}점`}
                    max={5}
                    readOnly
                    size="small"
                    value={ratingValue}
                    variant="full"
                  />
                  <p>{review.content}</p>
                  <button
                    className="map-photo-viewer-review-link"
                    type="button"
                    onClick={() => {
                      onClose()
                      onShowReview?.(review)
                    }}
                  >
                    리뷰 보기 <span aria-hidden="true">›</span>
                  </button>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </div>
  )
}

function ReviewText({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false)
  const [shouldShowMore, setShouldShowMore] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const text = textRef.current

    if (!text) {
      return
    }

    const measure = () => {
      setShouldShowMore(text.scrollHeight > text.clientHeight + 1)
    }
    const animationFrame = window.requestAnimationFrame(measure)
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(text)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
    }
  }, [content, expanded])

  return (
    <div className={['map-place-review-text-wrap', expanded ? 'map-place-review-text-expanded' : ''].join(' ')}>
      <p className="map-place-review-text" ref={textRef}>
        {content}
      </p>
      {!expanded && shouldShowMore ? (
        <button className="map-place-review-text-more" type="button" onClick={() => setExpanded(true)}>
          더보기
        </button>
      ) : null}
    </div>
  )
}

type ReviewImageCarouselProps = {
  review: ShopReview
  onOpenPhotoViewer: (state: MapPhotoViewerState) => void
  authorEmojiUrl?: string | null
}

function ReviewImageCarousel({ review, onOpenPhotoViewer, authorEmojiUrl }: ReviewImageCarouselProps) {
  const images = reviewImageItems(review)

  if (images.length === 0) {
    return null
  }

  return (
    <div className="map-place-review-images" aria-label="리뷰 사진">
      {images.map((image, index) => (
        <button
          className="map-place-review-image-frame"
          key={image.id}
          type="button"
          aria-label={`${review.authorNickname} 리뷰 사진 ${index + 1} 보기`}
          onClick={() =>
            onOpenPhotoViewer({
              items: images,
              activeIndex: index,
              review,
              authorEmojiUrl,
            })
          }
        >
          <img alt={image.alt} src={image.src} loading="lazy" />
          {images.length > 1 ? (
            <span>
              {index + 1}/{images.length}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

export function MapDetailSupplementSections({
  shop,
  activeTab,
  mediaItems,
  reviewPage = null,
  isReviewLoading = false,
  reviewErrorMessage = null,
  currentUserId = null,
  currentUserEmojiIconFilename = null,
  currentUserNickname = null,
  deletingReviewId = null,
  likingReviewId = null,
  onStartReview,
  onEditReview,
  onDeleteReview,
  onReportReview,
  onToggleReviewLike,
  onShowReviewFromPhoto,
}: MapDetailSupplementSectionsProps) {
  const [expandedWorkFeedShopId, setExpandedWorkFeedShopId] = useState<number | null>(null)
  const [deleteConfirmReview, setDeleteConfirmReview] = useState<ShopReview | null>(null)
  const [photoViewerState, setPhotoViewerState] = useState<MapPhotoViewerState | null>(null)
  const isWorkFeedExpanded = expandedWorkFeedShopId === shop.id
  const visibleWorks = isWorkFeedExpanded ? shop.works : shop.works.slice(0, WORK_FEED_PREVIEW_LIMIT)
  const hiddenWorkCount = Math.max(0, shop.works.length - WORK_FEED_PREVIEW_LIMIT)
  const reviews = reviewPage?.content ?? EMPTY_REVIEWS
  const reviewPromptName = currentUserNickname?.trim() || '방문자'
  const shopPhotoItems = useMemo<PhotoViewerItem[]>(
    () =>
      mediaItems.map((item) => ({
        id: `shop-${item.id}`,
        src: item.src,
        alt: item.alt,
      })),
    [mediaItems],
  )
  const reviewPhotoItems = useMemo<MapPhotoFeedItem[]>(() => {
    return reviews.flatMap((review) => {
      const images = reviewImageItems(review)

      return images.map((image, index) => ({
        ...image,
        kind: 'review' as const,
        review,
        reviewImages: images,
        reviewPhotoIndex: index,
      }))
    })
  }, [reviews])

  const photoItems = useMemo<MapPhotoFeedItem[]>(() => {
    return [
      ...shopPhotoItems.map((item) => ({
        ...item,
        kind: 'shop' as const,
      })),
      ...reviewPhotoItems,
    ]
  }, [reviewPhotoItems, shopPhotoItems])

  const handlePhotoViewerIndexChange = (activeIndex: number) => {
    setPhotoViewerState((current) => (current == null ? current : { ...current, activeIndex }))
  }

  const openShopPhotoViewer = (index: number) => {
    setPhotoViewerState({
      items: shopPhotoItems,
      activeIndex: index,
    })
  }

  const openReviewPhotoViewer = (item: MapPhotoFeedItem) => {
    if (item.review && item.reviewImages && item.reviewPhotoIndex != null) {
      const isMyReview = currentUserId != null && item.review.authorUserId === currentUserId
      const authorEmojiUrl = emojiImageUrl(
        item.review.authorEmojiIconFilename ?? (isMyReview ? currentUserEmojiIconFilename : null),
      )

      setPhotoViewerState({
        items: item.reviewImages,
        activeIndex: item.reviewPhotoIndex,
        review: item.review,
        authorEmojiUrl,
      })
    }
  }

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
        {photoItems.length > 0 ? (
          <div className="map-sheet-photo-feed">
            {photoItems.map((item) => (
              <button
                className={['map-sheet-photo-item', item.kind === 'review' ? 'map-sheet-photo-item-review' : '']
                  .filter(Boolean)
                  .join(' ')}
                key={item.id}
                type="button"
                aria-label={`${item.alt} 보기`}
                onClick={() => {
                  if (item.kind === 'shop') {
                    openShopPhotoViewer(shopPhotoItems.findIndex((photo) => photo.id === item.id))
                    return
                  }

                  openReviewPhotoViewer(item)
                }}
              >
                <img src={item.src} alt={item.alt} loading="eager" decoding="async" />
                {item.kind === 'review' ? <span>리뷰</span> : null}
              </button>
            ))}
          </div>
        ) : (
          <p className="map-sheet-footnote">등록된 사진이 없어요.</p>
        )}
        {isReviewLoading ? <p className="map-sheet-footnote">리뷰 사진을 불러오고 있어요.</p> : null}
        {photoViewerState != null ? (
          <MapPhotoViewer
            state={photoViewerState}
            onActiveIndexChange={handlePhotoViewerIndexChange}
            onClose={() => setPhotoViewerState(null)}
            onReportReview={onReportReview}
            onShowReview={onShowReviewFromPhoto}
          />
        ) : null}
      </section>
    )
  }

  if (activeTab === 'review') {
    return (
      <section className="section map-sheet-info-card map-sheet-tab-panel map-place-review-card" id="map-place-review">
        <div className="map-place-review-head">
          <Result
            className="map-place-review-result"
            title={
              <span className="map-place-review-prompt-title">
                <strong>{reviewPromptName}님</strong>
                {', '}
                <strong>{shop.name}</strong>
                에 다녀오셨나요?
              </span>
            }
            description="리뷰를 남기면, 검토 후 포인트를 지급해드려요!"
            button={
              <Result.Button type="button" onClick={onStartReview}>
                <span className="map-place-review-coin-icon" aria-hidden="true">
                  ₩
                </span>
                리뷰 남기기
              </Result.Button>
            }
          />
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
              const reviewDate = review.createdAt
              const reviewEditedLabel = isReviewEdited(review)
                ? `(${formatReviewEditedDate(review.updatedAt ?? review.createdAt)}에 수정됨)`
                : null
              const ratingValue = normalizeRating(review.rating)
              const authorEmojiUrl = emojiImageUrl(
                review.authorEmojiIconFilename ?? (isMyReview ? currentUserEmojiIconFilename : null),
              )

              return (
                <article className="map-place-review-item" key={review.id}>
                  <div className="map-place-review-item-head">
                    {authorEmojiUrl != null ? (
                      <img className="map-place-review-avatar" src={authorEmojiUrl} alt="" aria-hidden="true" />
                    ) : (
                      <span className="map-place-review-avatar map-place-review-avatar-fallback" aria-hidden="true">
                        {review.authorNickname.trim().slice(0, 1) || '?'}
                      </span>
                    )}
                    <div className="map-place-review-author">
                      <strong>{review.authorNickname}</strong>
                      {isMyReview ? <span className="map-place-review-owner-badge">내가 쓴 리뷰예요!</span> : null}
                    </div>
                    <ReviewActionMenu
                      isMyReview={isMyReview}
                      review={review}
                      onDeleteReview={setDeleteConfirmReview}
                      onEditReview={onEditReview}
                      onReportReview={onReportReview}
                    />
                  </div>
                  <div className="map-place-review-meta">
                    <Rating
                      aria-label={`${review.authorNickname} 별점`}
                      aria-valuetext={`5점 만점 중 ${ratingValue}점`}
                      max={5}
                      readOnly
                      size="small"
                      value={ratingValue}
                      variant="full"
                    />
                    <span>{formatReviewDate(reviewDate)}</span>
                    {reviewEditedLabel ? (
                      <span className="map-place-review-edited">{reviewEditedLabel}</span>
                    ) : null}
                  </div>
                  <ReviewImageCarousel
                    review={review}
                    authorEmojiUrl={authorEmojiUrl}
                    onOpenPhotoViewer={setPhotoViewerState}
                  />
                  <ReviewText content={review.content} />
                  <div className="map-place-review-like-row">
                    <button
                      className={['map-place-review-like', review.likedByMe ? 'map-place-review-like-active' : '']
                        .filter(Boolean)
                        .join(' ')}
                      type="button"
                      disabled={likingReviewId === review.id}
                      aria-pressed={review.likedByMe}
                      onClick={() => onToggleReviewLike?.(review, !review.likedByMe)}
                    >
                      <span aria-hidden="true">♡</span>
                      {review.likedByMe ? '유용해요 취소' : '유용해요'}
                    </button>
                    {review.likeCount > 0 ? (
                      <span className="map-place-review-like-count">{review.likeCount}명이 도움된다고 해요</span>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}

        {photoViewerState != null ? (
          <MapPhotoViewer
            state={photoViewerState}
            onActiveIndexChange={handlePhotoViewerIndexChange}
            onClose={() => setPhotoViewerState(null)}
            currentUserId={currentUserId}
            onDeleteReview={setDeleteConfirmReview}
            onEditReview={onEditReview}
            onReportReview={onReportReview}
            onShowReview={onShowReviewFromPhoto}
          />
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

import { useEffect, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { Button, Modal, Rating } from '@aniwhere/tds-mobile'
import type { CreateShopReviewPayload, Shop, ShopReview, UpdateShopReviewPayload } from '../../shared/api/types'

const MAX_REVIEW_IMAGES = 5
const MAX_REVIEW_IMAGE_SIZE = 10 * 1024 * 1024
const MIN_REVIEW_CONTENT_LENGTH = 10
const MAX_REVIEW_CONTENT_LENGTH = 800

type ReviewImageSelection = {
  id: string
  file: File
  name: string
  url: string
}

type MapReviewStationProps = {
  shop: Shop
  review?: ShopReview | null
  errorMessage?: string | null
  isSubmitting: boolean
  onSubmit: (payload: CreateShopReviewPayload | UpdateShopReviewPayload) => void
}

function getFileId(file: File) {
  return `${file.name}-${file.lastModified}-${file.size}`
}

function getExistingReviewImageId(image: ShopReview['images'][number], index: number) {
  return String(image.id ?? `${image.url}-${image.sortOrder}-${index}`)
}

function filterImageFiles(files: File[]) {
  return files.filter((file) => file.type.startsWith('image/') && file.size <= MAX_REVIEW_IMAGE_SIZE)
}

function getReviewStationDraftKey(shopId: number, review: ShopReview | null) {
  return review == null
    ? `create-${shopId}`
    : `edit-${shopId}-${review.id}-${review.rating}-${review.content}-${review.updatedAt ?? review.createdAt}-${
        review.images.map((image, index) => getExistingReviewImageId(image, index)).join(',')
      }`
}

export function MapReviewStation(props: MapReviewStationProps) {
  const draftKey = getReviewStationDraftKey(props.shop.id, props.review ?? null)

  return <MapReviewStationForm key={draftKey} {...props} />
}

function MapReviewStationForm({
  shop,
  review = null,
  errorMessage,
  isSubmitting,
  onSubmit,
}: MapReviewStationProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const imagesRef = useRef<ReviewImageSelection[]>([])
  const isEditing = review != null
  const initialRating = review?.rating ?? 0
  const initialContent = review?.content ?? ''
  const existingReviewImages = review?.images ?? []
  const [rating, setRating] = useState(initialRating)
  const [content, setContent] = useState(initialContent)
  const [images, setImages] = useState<ReviewImageSelection[]>([])
  const [hiddenExistingImageIds, setHiddenExistingImageIds] = useState<Set<string>>(() => new Set())
  const [localError, setLocalError] = useState<string | null>(null)
  const allowNavigationRef = useRef(false)
  const normalizedContent = content.trim()
  const visibleExistingReviewImages = existingReviewImages.filter(
    (image, index) => !hiddenExistingImageIds.has(getExistingReviewImageId(image, index)),
  )
  const attachedImageCount = visibleExistingReviewImages.length + images.length
  const remainingImageSlots = Math.max(0, MAX_REVIEW_IMAGES - attachedImageCount)
  const submitLabel = isEditing ? '수정 완료' : '작성 완료'
  const hasChanges =
    isEditing &&
    (rating !== initialRating ||
      normalizedContent !== initialContent.trim() ||
      images.length > 0 ||
      hiddenExistingImageIds.size > 0)
  const hasDraft = isEditing ? hasChanges : rating > 0 || normalizedContent.length > 0 || attachedImageCount > 0
  const canSubmit =
    rating > 0 && normalizedContent.length > 0 && !isSubmitting && (!isEditing || hasChanges)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (allowNavigationRef.current || isSubmitting || !hasDraft) {
      return false
    }

    return currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search
  })
  const isLeaveConfirmOpen = blocker.state === 'blocked'

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url))
    }
  }, [])

  useEffect(() => {
    if (errorMessage != null) {
      allowNavigationRef.current = false
    }
  }, [errorMessage])

  const handlePickImages = (files: FileList | null) => {
    if (!files) {
      return
    }

    const selectableImages = filterImageFiles(Array.from(files)).map((file) => ({
      id: getFileId(file),
      file,
      name: file.name,
      url: URL.createObjectURL(file),
    }))
    const acceptedImages = selectableImages.slice(0, remainingImageSlots)
    const nextImages = [...images, ...acceptedImages]
    const overflowImages = selectableImages.slice(remainingImageSlots)

    setImages(nextImages)
    overflowImages.forEach((image) => URL.revokeObjectURL(image.url))
    setLocalError(
      selectableImages.length === 0 && files.length > 0
        ? '10MB 이하의 이미지 파일만 첨부할 수 있어요.'
        : overflowImages.length > 0
          ? `사진은 최대 ${MAX_REVIEW_IMAGES}장까지 첨부할 수 있어요.`
          : null,
    )

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (targetId: string) => {
    setImages((current) => {
      const target = current.find((image) => image.id === targetId)
      if (target) {
        URL.revokeObjectURL(target.url)
      }

      return current.filter((image) => image.id !== targetId)
    })
  }

  const handleRemoveExistingImage = (targetId: string) => {
    setHiddenExistingImageIds((current) => {
      const next = new Set(current)
      next.add(targetId)
      return next
    })
    setLocalError(null)
  }

  const handleRatingChange = (nextRating: number) => {
    setRating(nextRating)
    setLocalError(null)
  }

  const handleContentChange = (nextContent: string) => {
    setContent(nextContent)
    setLocalError(null)
  }

  const handleSubmit = () => {
    if (rating <= 0) {
      setLocalError('별점을 선택해 주세요.')
      return
    }

    if (!normalizedContent) {
      setLocalError('리뷰 내용을 입력해 주세요.')
      return
    }

    if (normalizedContent.length < MIN_REVIEW_CONTENT_LENGTH) {
      setLocalError(`리뷰를 ${MIN_REVIEW_CONTENT_LENGTH}자 이상 작성해 주세요.`)
      return
    }

    const selectedImages = images.map((image) => image.file)
    const shouldReplaceReviewImages = isEditing && (images.length > 0 || hiddenExistingImageIds.size > 0)
    const existingImageIds = visibleExistingReviewImages.map((image) => image.id)

    if (shouldReplaceReviewImages && existingImageIds.some((id) => id == null)) {
      setLocalError('기존 리뷰 사진 정보를 다시 불러온 뒤 수정해 주세요.')
      return
    }

    setLocalError(null)
    allowNavigationRef.current = true
    const imagePayload = shouldReplaceReviewImages
      ? {
          existingImageIds: existingImageIds.filter((id): id is number => typeof id === 'number'),
          ...(selectedImages.length > 0 ? { images: selectedImages } : {}),
        }
      : selectedImages.length > 0
        ? { images: selectedImages }
        : {}

    onSubmit({
      rating,
      content: normalizedContent,
      ...imagePayload,
    })
  }

  const cancelLeave = () => {
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
  }

  const confirmLeave = () => {
    allowNavigationRef.current = true

    if (blocker.state === 'blocked') {
      blocker.proceed()
    }
  }

  return (
    <section
      className="map-bottom-sheet map-bottom-sheet-expanded map-review-station"
      aria-label={`${shop.name} ${isEditing ? '리뷰 수정' : '리뷰 작성'}`}
    >
      <div className="map-review-station-body">
        <div className="map-review-station-field map-review-rating-field">
          <span className="map-review-rating-question">
            <strong>{shop.name}</strong>
            <span>의 방문은 어떠셨나요?</span>
          </span>
          <Rating
            aria-label="별점 평가"
            aria-valuetext={`5점 만점 중 ${rating}점`}
            className="map-review-rating"
            max={5}
            readOnly={false}
            size="big"
            value={rating}
            variant="full"
            onValueChange={handleRatingChange}
          />
        </div>

        <label className="map-review-station-field map-review-content-field" htmlFor="map-review-content">
          <div className="map-review-content-box">
            <textarea
              className="map-review-textarea"
              id="map-review-content"
              maxLength={MAX_REVIEW_CONTENT_LENGTH}
              placeholder="리뷰를 10자 이상 작성해 주세요."
              rows={7}
              value={content}
              onChange={(event) => handleContentChange(event.target.value)}
            />
            <span className="map-review-content-counter">
              {content.length}/{MAX_REVIEW_CONTENT_LENGTH}
            </span>
          </div>
        </label>

        <div className="map-review-station-field">
          <input
            ref={fileInputRef}
            accept="image/*"
            className="map-review-file-input"
            multiple
            type="file"
            onChange={(event) => handlePickImages(event.target.files)}
          />
          <div className="map-review-photo-strip">
            <button
              className="map-review-photo-add"
              disabled={attachedImageCount >= MAX_REVIEW_IMAGES}
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              사진 추가
              <span className="map-review-photo-count">
                {attachedImageCount}/{MAX_REVIEW_IMAGES}
              </span>
            </button>
            {visibleExistingReviewImages.map((image, index) => {
              const imageId = getExistingReviewImageId(image, index)

              return (
                <span className="map-review-photo-preview map-review-photo-preview-existing" key={imageId}>
                  <img alt="기존 리뷰 사진" src={image.url} />
                  <button
                    type="button"
                    aria-label={`기존 리뷰 사진 삭제`}
                    onClick={() => handleRemoveExistingImage(imageId)}
                  >
                    ×
                  </button>
                </span>
              )
            })}
            {images.map((preview) => (
              <span className="map-review-photo-preview" key={preview.id}>
                <img alt={preview.name} src={preview.url} />
                <button type="button" aria-label={`${preview.name} 제거`} onClick={() => handleRemoveImage(preview.id)}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {localError || errorMessage ? (
          <p className="map-review-station-error" role="alert">
            {localError ?? errorMessage}
          </p>
        ) : null}
      </div>

      <div className="map-review-station-cta">
        <Button color="primary" display="block" loading={isSubmitting} disabled={!canSubmit} onClick={handleSubmit}>
          {submitLabel}
        </Button>
      </div>

      <Modal open={isLeaveConfirmOpen} onOpenChange={(open) => (!open ? cancelLeave() : undefined)}>
        <Modal.Overlay onClick={cancelLeave} />
        <Modal.Content className="map-review-leave-modal" aria-labelledby="map-review-leave-title" aria-modal="true">
          <div className="map-review-leave-copy">
            <strong id="map-review-leave-title">리뷰 작성을 그만할까요?</strong>
            <p>지금까지 입력한 내용은 저장되지 않아요.</p>
          </div>
          <div className="map-review-leave-actions">
            <Button color="dark" display="block" variant="weak" onClick={cancelLeave}>
              계속 작성
            </Button>
            <Button color="danger" display="block" onClick={confirmLeave}>
              그만하기
            </Button>
          </div>
        </Modal.Content>
      </Modal>
    </section>
  )
}

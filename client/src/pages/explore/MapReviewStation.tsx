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

function filterImageFiles(files: File[]) {
  return files.filter((file) => file.type.startsWith('image/') && file.size <= MAX_REVIEW_IMAGE_SIZE)
}

export function MapReviewStation({
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
  const [localError, setLocalError] = useState<string | null>(null)
  const allowNavigationRef = useRef(false)
  const normalizedContent = content.trim()
  const submitLabel = isEditing ? '수정 완료' : '작성 완료'
  const hasChanges =
    isEditing &&
    (rating !== initialRating || normalizedContent !== initialContent.trim() || images.length > 0)
  const hasDraft = isEditing ? hasChanges : rating > 0 || normalizedContent.length > 0 || images.length > 0
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
    const nextImages = [...images, ...selectableImages].slice(0, MAX_REVIEW_IMAGES)
    const overflowImages = selectableImages.slice(Math.max(0, MAX_REVIEW_IMAGES - images.length))

    setImages(nextImages)
    overflowImages.forEach((image) => URL.revokeObjectURL(image.url))
    setLocalError(
      selectableImages.length === 0 && files.length > 0
        ? '10MB 이하의 이미지 파일만 첨부할 수 있어요.'
        : nextImages.length < images.length + selectableImages.length
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

    setLocalError(null)
    allowNavigationRef.current = true
    onSubmit({
      rating,
      content: normalizedContent,
      ...(images.length > 0 ? { images: images.map((image) => image.file) } : {}),
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
          {isEditing && existingReviewImages.length > 0 ? (
            <div className="map-review-existing-photos" aria-label="기존 리뷰 사진">
              {existingReviewImages.map((image) => (
                <span className="map-review-existing-photo" key={`${image.id ?? image.url}-${image.sortOrder}`}>
                  <img alt="기존 리뷰 사진" src={image.url} />
                </span>
              ))}
            </div>
          ) : null}
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
              disabled={images.length >= MAX_REVIEW_IMAGES}
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              사진 추가
              <span className="map-review-photo-count">
                {images.length}/{MAX_REVIEW_IMAGES}
              </span>
            </button>
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

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { Toast } from '@aniwhere/tds-mobile'
import { API_BASE_URL } from '../../shared/api/client'
import {
  createShop,
  createShopWithImages,
  getShop,
  updateShop,
  updateShopWithImages,
} from '../../shared/api/shops'
import type { Shop, ShopImage, ShopRequest, ShopStatus } from '../../shared/api/types'
import { AitButton, AitNavigation } from '../../shared/ui/ait'
import {
  clearAdminShopDraft,
  clearAdminShopSelectedLocation,
  clearPendingAdminShopFiles,
  readAdminShopDraft,
  readAdminShopSelectedLocation,
  readPendingAdminShopFileCount,
  readPendingAdminShopFiles,
  writeAdminShopDraft,
  writePendingAdminShopFiles,
} from './AdminShopDraftStore'

type ShopFormState = {
  name: string
  addressQuery: string
  address: string
  px: number | null
  py: number | null
  floor: string
  regionId: number | null
  status: ShopStatus
  sellsIchibanKuji: boolean
  visitTip: string
}

type PendingPreviewItem = {
  id: string
  name: string
  url: string
  isCover: boolean
}

type EditableImageItem = {
  id: string
  name: string
  url: string
  file?: File
  imageId?: number
}

type ShopFieldErrors = {
  name?: string
  location?: string
}

type SelectableImageFileResult = {
  files: File[]
  invalidTypeCount: number
  oversizedCount: number
  overflowCount: number
}

const EMPTY_SHOP_FORM: ShopFormState = {
  name: '',
  addressQuery: '',
  address: '',
  px: null,
  py: null,
  floor: '',
  regionId: null,
  status: 'UNVERIFIED',
  sellsIchibanKuji: false,
  visitTip: '',
}

const MAX_SHOP_IMAGE_FILES = 7
const MAX_SHOP_IMAGE_FILE_SIZE_BYTES = 12 * 1024 * 1024
const SHOP_TOAST_VISIBLE_MS = 3000
const LEGACY_SHOP_IMAGE_PATH_PREFIX = '/img/shop/'

function validateShopForm(form: ShopFormState): ShopFieldErrors {
  const errors: ShopFieldErrors = {}

  if (!form.name.trim()) {
    errors.name = '매장명을 입력해주세요.'
  }

  if (!form.address.trim() || form.px == null || form.py == null) {
    errors.location = '주소 검색으로 위치를 선택해주세요.'
  } else if (!Number.isFinite(form.px) || !Number.isFinite(form.py)) {
    errors.location = '선택한 위치를 다시 확인해주세요.'
  }

  return errors
}

function buildShopRequest(form: ShopFormState): ShopRequest {
  const errors = validateShopForm(form)
  const firstError = errors.name ?? errors.location

  if (firstError) {
    throw new Error(firstError)
  }
  if (form.px == null || form.py == null) {
    throw new Error('주소 검색으로 위치를 선택해주세요.')
  }

  return {
    name: form.name.trim(),
    address: form.address.trim(),
    px: form.px,
    py: form.py,
    floor: form.floor.trim() || null,
    regionId: form.regionId,
    status: form.status,
    sellsIchibanKuji: form.sellsIchibanKuji,
    visitTip: form.visitTip.trim() || null,
  }
}

function buildShopFormFromShop(shop: Shop): ShopFormState {
  return {
    name: shop.name,
    addressQuery: shop.address,
    address: shop.address,
    px: shop.px,
    py: shop.py,
    floor: shop.floor ?? '',
    regionId: shop.regionId,
    status: shop.status,
    sellsIchibanKuji: !!shop.sellsIchibanKuji,
    visitTip: shop.visitTip ?? '',
  }
}

function getSortedShopImages(images: ShopImage[]) {
  return [...images].sort((a, b) => {
    if (a.role !== b.role) {
      return a.role === 'PRIMARY' ? -1 : 1
    }

    return a.sortOrder - b.sortOrder
  })
}

function buildShopImageDisplayUrl(url: string) {
  try {
    const parsed = new URL(url)

    if (parsed.hostname === 'aniwhere.link' && parsed.pathname.startsWith(LEGACY_SHOP_IMAGE_PATH_PREFIX)) {
      const imageKey = parsed.pathname.slice(LEGACY_SHOP_IMAGE_PATH_PREFIX.length)
      return `${API_BASE_URL}/api/v1/shop-images/${imageKey}`
    }
  } catch {
    return url
  }

  return url
}

function buildEditableImageItems(shop: Shop): EditableImageItem[] {
  return getSortedShopImages(shop.images).map((image) => ({
    id: `existing-${image.id}`,
    name: image.role === 'PRIMARY' ? '대표사진' : `매장 사진 ${image.sortOrder}`,
    url: buildShopImageDisplayUrl(image.url),
    imageId: image.id,
  }))
}

function filterSelectableImageFiles(files: File[], availableSlots: number): SelectableImageFileResult {
  const validFiles: File[] = []
  let invalidTypeCount = 0
  let oversizedCount = 0

  files.forEach((file) => {
    const isSupportedImageFile = file.type.toLowerCase().startsWith('image/')
    const isAllowedImageSize = file.size <= MAX_SHOP_IMAGE_FILE_SIZE_BYTES

    if (!isSupportedImageFile) {
      invalidTypeCount += 1
      return
    }

    if (!isAllowedImageSize) {
      oversizedCount += 1
      return
    }

    validFiles.push(file)
  })

  const nextSlotCount = Math.max(0, availableSlots)

  return {
    files: validFiles.slice(0, nextSlotCount),
    invalidTypeCount,
    oversizedCount,
    overflowCount: Math.max(0, validFiles.length - nextSlotCount),
  }
}

function getImageSelectionNotice(selection: SelectableImageFileResult) {
  const messages: string[] = []

  if (selection.invalidTypeCount > 0) {
    messages.push('이미지 파일만 추가할 수 있어요.')
  }

  if (selection.oversizedCount > 0) {
    messages.push('12MB 이하 이미지로 다시 선택해주세요.')
  }

  if (selection.overflowCount > 0) {
    messages.push(`초과한 ${selection.overflowCount}장은 제외했어요.`)
  }

  return messages.join(' ')
}

function moveItemToFront<T>(items: T[], targetIndex: number): T[] {
  if (targetIndex <= 0 || targetIndex >= items.length) {
    return items
  }

  const nextItems = [...items]
  const target = nextItems[targetIndex]

  if (!target) {
    return items
  }

  nextItems.splice(targetIndex, 1)
  return [target, ...nextItems]
}

function createEditableImageItems(files: File[]): EditableImageItem[] {
  return files.map((file) => ({
    id: `new-${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
    name: file.name,
    url: URL.createObjectURL(file),
    file,
  }))
}

function getPendingPreviewUrls(files: File[]): PendingPreviewItem[] {
  return files.map((file, index) => ({
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    url: URL.createObjectURL(file),
    isCover: index === 0,
  }))
}

function getShopSaveErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '매장을 저장하지 못했어요.'

  if (message.includes('AwsCredentialsProviderChain') || message.includes('Unable to load credentials')) {
    return '사진을 저장하지 못했어요. 잠시 후 다시 시도해주세요.'
  }

  return message
}

function buildShopSavedNotice(shopName: string, isEditMode: boolean) {
  return `${shopName} 매장을 ${isEditMode ? '수정' : '등록'}했어요.`
}

function getImageExtension(contentType: string) {
  switch (contentType.toLowerCase()) {
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    default:
      return 'jpg'
  }
}

async function editableImageItemToFile(item: EditableImageItem, fallbackName: string) {
  if (item.file) {
    return item.file
  }

  const response = await fetch(item.url)

  if (!response.ok) {
    throw new Error('기존 사진을 불러오지 못했어요. 다시 시도해주세요.')
  }

  const contentType = response.headers.get('content-type')?.split(';')[0].trim() ?? ''
  if (!contentType.toLowerCase().startsWith('image/')) {
    throw new Error('기존 사진을 불러오지 못했어요. 다시 시도해주세요.')
  }

  const blob = await response.blob()
  const fileContentType = blob.type || contentType

  return new File([blob], `${fallbackName}.${getImageExtension(fileContentType)}`, { type: fileContentType })
}

async function buildUpdateImagePayload(originalShop: Shop, imageItems: EditableImageItem[]) {
  const originalImages = getSortedShopImages(originalShop.images)
  const originalCoverId = originalImages[0]?.id ?? null
  const originalGalleryIds = originalImages.slice(1).map((image) => image.id)
  const nextCover = imageItems[0]
  const nextGallery = imageItems.slice(1)
  const nextGalleryIds = nextGallery.map((item) => item.imageId ?? null)
  const coverChanged = !!nextCover && (nextCover.file || nextCover.imageId !== originalCoverId)
  const galleryChanged =
    nextGallery.length !== originalGalleryIds.length ||
    nextGalleryIds.some((imageId, index) => imageId !== originalGalleryIds[index])

  if (!coverChanged && !galleryChanged) {
    return null
  }

  return {
    coverImage: coverChanged ? await editableImageItemToFile(nextCover, 'primary') : null,
    replaceGallery: galleryChanged,
    existingGalleryImageIds: galleryChanged
      ? nextGallery.flatMap((item) => (item.imageId != null && !item.file ? [item.imageId] : []))
      : [],
    galleryImages: galleryChanged
      ? await Promise.all(
        nextGallery.flatMap((item, index) =>
          item.imageId != null && !item.file
            ? []
            : [editableImageItemToFile(item, `gallery-${index + 1}`)],
        ),
      )
      : [],
  }
}

export function AdminShopsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { shopId } = useParams()
  const parsedShopId = shopId ? Number(shopId) : null
  const editingShopId = parsedShopId != null && Number.isFinite(parsedShopId) ? parsedShopId : null
  const isEditMode = editingShopId != null
  const selectedLocationOnOpen = useMemo(() => readAdminShopSelectedLocation(), [])
  const [shopForm, setShopForm] = useState<ShopFormState>(() => {
    const draft = readAdminShopDraft() ?? EMPTY_SHOP_FORM

    if (!selectedLocationOnOpen) {
      return draft
    }

    return {
      ...draft,
      addressQuery: selectedLocationOnOpen.address,
      address: selectedLocationOnOpen.address,
      px: selectedLocationOnOpen.px,
      py: selectedLocationOnOpen.py,
      regionId: selectedLocationOnOpen.regionId,
    }
  })
  const [pendingFiles, setPendingFiles] = useState<File[]>(() => readPendingAdminShopFiles())
  const [editImageItems, setEditImageItems] = useState<EditableImageItem[]>([])
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(() => new Set())
  const [fieldErrors, setFieldErrors] = useState<ShopFieldErrors>({})
  const [notice, setNotice] = useState<string | null>(() => {
    if (!isEditMode && readPendingAdminShopFileCount() > 0 && pendingFiles.length === 0) {
      return '사진 선택이 초기화됐어요. 다시 선택해주세요.'
    }

    return null
  })
  const pendingPreviewItems = useMemo(() => getPendingPreviewUrls(pendingFiles), [pendingFiles])
  const closeNotice = useCallback(() => setNotice(null), [])
  const editShopQuery = useQuery({
    queryKey: ['shops', 'admin-shop-edit', editingShopId],
    queryFn: () => getShop(editingShopId as number),
    enabled: isEditMode,
  })
  const openLocationSearch = () => {
    setFieldErrors((current) => ({ ...current, location: undefined }))
    writeAdminShopDraft(shopForm)
    navigate('/admin/shops/location', { state: { fromAdminShopCreate: true } })
  }

  useEffect(() => {
    clearAdminShopSelectedLocation()
  }, [])

  useEffect(() => {
    if (isEditMode) {
      return
    }

    writeAdminShopDraft(shopForm)
  }, [isEditMode, shopForm])

  useEffect(() => {
    if (isEditMode) {
      return
    }

    writePendingAdminShopFiles(pendingFiles)
  }, [isEditMode, pendingFiles])

  useEffect(() => {
    if (!isEditMode || !editShopQuery.data) {
      return
    }

    const nextForm = buildShopFormFromShop(editShopQuery.data)

    if (!selectedLocationOnOpen) {
      // Hydrate the editable form once the async shop record is available.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShopForm(nextForm)
      setEditImageItems(buildEditableImageItems(editShopQuery.data))
      setFailedImageIds(new Set())
      return
    }

    // Hydrate the editable form with the location selected on the search page.
    setShopForm({
      ...nextForm,
      addressQuery: selectedLocationOnOpen.address,
      address: selectedLocationOnOpen.address,
      px: selectedLocationOnOpen.px,
      py: selectedLocationOnOpen.py,
      regionId: selectedLocationOnOpen.regionId,
    })
    setEditImageItems(buildEditableImageItems(editShopQuery.data))
    setFailedImageIds(new Set())
  }, [editShopQuery.data, isEditMode, selectedLocationOnOpen])

  useEffect(() => {
    return () => {
      pendingPreviewItems.forEach((item) => URL.revokeObjectURL(item.url))
    }
  }, [pendingPreviewItems])

  const resetForm = () => {
    setShopForm(EMPTY_SHOP_FORM)
    setPendingFiles([])
    setFieldErrors({})
    clearAdminShopDraft()
    clearPendingAdminShopFiles()
  }

  const updatePendingFiles = (files: File[]) => {
    const selection = filterSelectableImageFiles(files, MAX_SHOP_IMAGE_FILES)
    const selectionNotice = getImageSelectionNotice(selection)

    setPendingFiles(selection.files)

    if (selectionNotice) {
      setNotice(selectionNotice)
    }
  }

  const updateEditImageFiles = (files: File[]) => {
    if (files.length === 0) {
      return
    }

    setEditImageItems((current) => {
      const selection = filterSelectableImageFiles(files, MAX_SHOP_IMAGE_FILES - current.length)
      const selectionNotice = getImageSelectionNotice(selection)
      const nextItems = [...current, ...createEditableImageItems(selection.files)]

      if (selectionNotice) {
        setNotice(selectionNotice)
      }

      return nextItems
    })
  }

  const removePendingFile = (targetIndex: number) => {
    setPendingFiles((current) => current.filter((_, index) => index !== targetIndex))
  }

  const setPendingFileAsCover = (targetIndex: number) => {
    setPendingFiles((current) => moveItemToFront(current, targetIndex))
  }

  const setEditImageItemAsCover = (targetIndex: number) => {
    setEditImageItems((current) => moveItemToFront(current, targetIndex))
  }

  const removeEditImageItem = (targetIndex: number) => {
    setEditImageItems((current) => {
      if (current.length <= 1) {
        setNotice('대표사진은 1장 이상 필요해요.')
        return current
      }

      const target = current[targetIndex]
      if (target?.file) {
        URL.revokeObjectURL(target.url)
      }

      return current.filter((_, index) => index !== targetIndex)
    })
  }

  const saveShopMutation = useMutation({
    mutationFn: async () => {
      const payload = buildShopRequest(shopForm)
      if (isEditMode) {
        if (editImageItems.length === 0 && (editShopQuery.data?.images.length ?? 0) > 0) {
          throw new Error('대표사진은 1장 이상 필요해요.')
        }

        const imagePayload = editShopQuery.data
          ? await buildUpdateImagePayload(editShopQuery.data, editImageItems)
          : null

        return imagePayload
          ? updateShopWithImages(editingShopId, payload, imagePayload)
          : updateShop(editingShopId, payload)
      }

      return pendingFiles.length > 0 ? createShopWithImages(payload, pendingFiles) : createShop(payload)
    },
    onSuccess: async (savedShop) => {
      await queryClient.invalidateQueries({ queryKey: ['shops'] })
      if (!isEditMode) {
        resetForm()
      }
      clearAdminShopSelectedLocation()
      navigate('/admin/shops', {
        replace: true,
        state: { notice: buildShopSavedNotice(savedShop.name, isEditMode) },
      })
    },
    onError: (error) => {
      setNotice(getShopSaveErrorMessage(error))
    },
  })

  return (
    <main className="app-shell admin-shell admin-shop-crud-shell">
      <AitNavigation className="route-navigation" showBack title={isEditMode ? '매장 수정' : '매장 등록'} showLogo={false} />

      <section className="admin-shop-crud-layout">
        {editShopQuery.isLoading ? <p className="admin-shop-manage-state">매장 정보를 불러오고 있어요.</p> : null}
        {editShopQuery.isError ? (
          <p className="admin-shop-manage-state error-text">{(editShopQuery.error as Error).message}</p>
        ) : null}

        <form
          className="admin-shop-editor"
          onSubmit={(event) => {
            event.preventDefault()
            const errors = validateShopForm(shopForm)

            setFieldErrors(errors)

            if (Object.keys(errors).length > 0) {
              setNotice('필수 항목을 확인해주세요.')
              return
            }

            saveShopMutation.mutate()
          }}
        >
          <section className="admin-shop-editor-section">
            <div className="admin-shop-photo-strip">
              {isEditMode ? (
                <>
                  <label className="admin-shop-photo-add">
                    <input
                      accept="image/*"
                      multiple
                      type="file"
                      onChange={(event) => {
                        updateEditImageFiles(Array.from(event.target.files ?? []))
                        event.currentTarget.value = ''
                      }}
                    />
                    <span aria-hidden="true" className="admin-shop-camera-icon" />
                    <strong>
                      {editImageItems.length}/{MAX_SHOP_IMAGE_FILES}
                    </strong>
                  </label>

                  {editImageItems.map((photo, index) => (
                    <article className="admin-shop-photo-card admin-shop-photo-card-pending" key={photo.id}>
                      {failedImageIds.has(photo.id) ? (
                        <small className="admin-shop-photo-error">사진 확인 필요</small>
                      ) : (
                        <img
                          alt={photo.name}
                          src={photo.url}
                          onError={() => setFailedImageIds((current) => new Set(current).add(photo.id))}
                        />
                      )}
                      <button
                        aria-label={`${photo.name} 사진 제거`}
                        className="admin-shop-photo-remove"
                        type="button"
                        onClick={() => removeEditImageItem(index)}
                      >
                        ×
                      </button>
                      {index === 0 ? (
                        <span className="admin-shop-photo-cover-badge">대표</span>
                      ) : (
                        <button
                          aria-label={`${photo.name} 대표사진으로 설정`}
                          className="admin-shop-photo-cover-action"
                          type="button"
                          onClick={() => setEditImageItemAsCover(index)}
                        >
                          대표 지정
                        </button>
                      )}
                    </article>
                  ))}
                </>
              ) : (
                <>
                  <label className="admin-shop-photo-add">
                    <input
                      accept="image/*"
                      multiple
                      type="file"
                      onChange={(event) => {
                        updatePendingFiles(Array.from(event.target.files ?? []))
                        event.currentTarget.value = ''
                      }}
                    />
                    <span aria-hidden="true" className="admin-shop-camera-icon" />
                    <strong>
                      {pendingFiles.length}/{MAX_SHOP_IMAGE_FILES}
                    </strong>
                  </label>

                  {pendingPreviewItems.map((photo, index) => (
                    <article className="admin-shop-photo-card admin-shop-photo-card-pending" key={photo.id}>
                      <img alt={photo.name} src={photo.url} />
                      <button
                        aria-label={`${photo.name} 사진 제거`}
                        className="admin-shop-photo-remove"
                        type="button"
                        onClick={() => removePendingFile(index)}
                      >
                        ×
                      </button>
                      {photo.isCover ? (
                        <span className="admin-shop-photo-cover-badge">대표</span>
                      ) : (
                        <button
                          aria-label={`${photo.name} 대표사진으로 설정`}
                          className="admin-shop-photo-cover-action"
                          type="button"
                          onClick={() => setPendingFileAsCover(index)}
                        >
                          대표 지정
                        </button>
                      )}
                    </article>
                  ))}
                </>
              )}
            </div>
          </section>

          <section className="admin-shop-editor-section">
            <label className="admin-shop-field admin-shop-field-wide">
              <span className="admin-shop-field-label">
                매장명 <span className="admin-shop-required" aria-label="필수">*</span>
              </span>
              <input
                aria-invalid={!!fieldErrors.name}
                aria-required="true"
                className="text-input"
                placeholder="예: 애니메이트 홍대"
                value={shopForm.name}
                onChange={(event) => {
                  setFieldErrors((current) => ({ ...current, name: undefined }))
                  setShopForm((current) => ({ ...current, name: event.target.value }))
                }}
              />
              {fieldErrors.name ? <small className="admin-shop-field-error">{fieldErrors.name}</small> : null}
            </label>

            <div className="admin-shop-field admin-shop-field-wide">
              <span className="admin-shop-field-label">
                위치 <span className="admin-shop-required" aria-label="필수">*</span>
              </span>
              {shopForm.address ? (
                <div
                  aria-invalid={!!fieldErrors.location}
                  aria-required="true"
                  className="admin-shop-location-card selected"
                >
                  <span className="admin-shop-location-card-row">
                    <span className="admin-shop-location-value">{shopForm.address}</span>
                    <button
                      className="admin-shop-location-change"
                      type="button"
                      onClick={openLocationSearch}
                    >
                      변경
                    </button>
                  </span>
                </div>
              ) : (
                <button
                  aria-invalid={!!fieldErrors.location}
                  aria-required="true"
                  className="admin-shop-location-card"
                  type="button"
                  onClick={openLocationSearch}
                >
                  <span className="admin-shop-location-value">위치 추가</span>
                </button>
              )}
              {fieldErrors.location ? <small className="admin-shop-field-error">{fieldErrors.location}</small> : null}
            </div>

            <label className="admin-shop-field admin-shop-field-wide">
              <span>층수</span>
              <input
                className="text-input"
                placeholder="예: 2F"
                value={shopForm.floor}
                onChange={(event) => setShopForm((current) => ({ ...current, floor: event.target.value }))}
              />
            </label>

            <label className="admin-shop-field admin-shop-field-wide">
              <span>상태</span>
              <select
                className="text-input admin-select"
                value={shopForm.status}
                onChange={(event) =>
                  setShopForm((current) => ({ ...current, status: event.target.value as ShopStatus }))
                }
              >
                <option value="UNVERIFIED">검증 필요</option>
                <option value="ACTIVE">운영 중</option>
                <option value="CLOSED">영업 종료</option>
              </select>
            </label>

            <label className="admin-shop-toggle">
              <input
                checked={shopForm.sellsIchibanKuji}
                type="checkbox"
                onChange={(event) =>
                  setShopForm((current) => ({ ...current, sellsIchibanKuji: event.target.checked }))
                }
              />
              <span>
                <strong>이치방쿠지 취급 매장</strong>
                <small>상세 화면에 방문 참고 정보로 보여요.</small>
              </span>
            </label>

            <label className="admin-shop-field admin-shop-field-wide admin-shop-textarea-field">
              <span>방문 팁</span>
              <textarea
                className="text-input text-area"
                placeholder="입구, 예약, 재고 확인 팁처럼 방문 전에 알면 좋은 내용을 적어주세요."
                rows={5}
                value={shopForm.visitTip}
                onChange={(event) => setShopForm((current) => ({ ...current, visitTip: event.target.value }))}
              />
            </label>
          </section>

          <div className="admin-shop-actions">
            <AitButton display="full" disabled={saveShopMutation.isPending || editShopQuery.isLoading} type="submit">
              {saveShopMutation.isPending ? '저장 중...' : isEditMode ? '수정하기' : '등록하기'}
            </AitButton>
          </div>
        </form>
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

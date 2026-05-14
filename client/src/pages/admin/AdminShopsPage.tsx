import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
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
const SHOP_TOAST_VISIBLE_MS = 2800
const SHOP_PHOTO_SEARCH_URL = 'https://search.naver.com/search.naver'

function validateShopForm(form: ShopFormState): ShopFieldErrors {
  const errors: ShopFieldErrors = {}

  if (!form.name.trim()) {
    errors.name = '매장명은 필수입니다.'
  }

  if (!form.address.trim() || form.px == null || form.py == null) {
    errors.location = '주소 검색으로 위치를 선택해주세요.'
  } else if (!Number.isFinite(form.px) || !Number.isFinite(form.py)) {
    errors.location = '선택한 위치 좌표가 올바르지 않습니다.'
  }

  return errors
}

function buildShopRequest(form: ShopFormState): ShopRequest {
  const errors = validateShopForm(form)
  const firstError = errors.name ?? errors.location

  if (firstError) {
    throw new Error(firstError)
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

function buildPhotoCandidateSearchUrl(form: ShopFormState) {
  const query = [form.name, form.address].map((value) => value.trim()).filter(Boolean).join(' ')

  if (!query) {
    return null
  }

  const params = new URLSearchParams({
    where: 'image',
    query,
  })

  return `${SHOP_PHOTO_SEARCH_URL}?${params.toString()}`
}

function getSortedShopImages(images: ShopImage[]) {
  return [...images].sort((a, b) => {
    if (a.role !== b.role) {
      return a.role === 'PRIMARY' ? -1 : 1
    }

    return a.sortOrder - b.sortOrder
  })
}

function buildEditableImageItems(shop: Shop): EditableImageItem[] {
  return getSortedShopImages(shop.images).map((image) => ({
    id: `existing-${image.id}`,
    name: image.role === 'PRIMARY' ? '대표사진' : `매장 사진 ${image.sortOrder}`,
    url: image.url,
    imageId: image.id,
  }))
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

function isNoticeError(message: string) {
  return (
    message.includes('실패') ||
    message.includes('입력') ||
    message.includes('확정') ||
    message.includes('인증') ||
    message.includes('필수')
  )
}

function getShopSaveErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '매장 저장에 실패했습니다.'

  if (message.includes('AwsCredentialsProviderChain') || message.includes('Unable to load credentials')) {
    return '이미지 저장소 인증 정보가 없어 사진을 저장하지 못했습니다. 서버 S3 설정을 확인해주세요.'
  }

  return message
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
    throw new Error('기존 사진을 불러오지 못했습니다. 다시 시도해주세요.')
  }

  const blob = await response.blob()
  const contentType = blob.type || 'image/jpeg'

  return new File([blob], `${fallbackName}.${getImageExtension(contentType)}`, { type: contentType })
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
    galleryImages: galleryChanged
      ? await Promise.all(nextGallery.map((item, index) => editableImageItemToFile(item, `gallery-${index + 1}`)))
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
  const [isReadingClipboardImage, setIsReadingClipboardImage] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<ShopFieldErrors>({})
  const [notice, setNotice] = useState<string | null>(null)
  const pendingPreviewItems = useMemo(() => getPendingPreviewUrls(pendingFiles), [pendingFiles])
  const photoCandidateSearchUrl = useMemo(() => buildPhotoCandidateSearchUrl(shopForm), [shopForm])
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
      setShopForm(nextForm)
      setEditImageItems(buildEditableImageItems(editShopQuery.data))
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
  }, [editShopQuery.data, isEditMode, selectedLocationOnOpen])

  useEffect(() => {
    return () => {
      pendingPreviewItems.forEach((item) => URL.revokeObjectURL(item.url))
    }
  }, [pendingPreviewItems])

  useEffect(() => {
    if (!notice) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setNotice(null), SHOP_TOAST_VISIBLE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [notice])

  const resetForm = () => {
    setShopForm(EMPTY_SHOP_FORM)
    setPendingFiles([])
    setFieldErrors({})
    clearAdminShopDraft()
    clearPendingAdminShopFiles()
  }

  const updatePendingFiles = (files: File[]) => {
    const nextFiles = files.slice(0, MAX_SHOP_IMAGE_FILES)

    setPendingFiles(nextFiles)

    if (files.length > MAX_SHOP_IMAGE_FILES) {
      setNotice('사진은 대표 1장과 갤러리 6장까지 등록할 수 있습니다.')
    }
  }

  const updateEditImageFiles = (files: File[]) => {
    if (files.length === 0) {
      return
    }

    setEditImageItems((current) => {
      const nextFiles = files.slice(0, Math.max(0, MAX_SHOP_IMAGE_FILES - current.length))
      const nextItems = [...current, ...createEditableImageItems(nextFiles)]

      if (files.length > nextFiles.length) {
        setNotice('사진은 대표 1장과 갤러리 6장까지 등록할 수 있습니다.')
      }

      return nextItems
    })
  }

  const openPhotoCandidateSearch = () => {
    if (!photoCandidateSearchUrl) {
      setNotice('매장명 또는 주소를 먼저 입력해주세요.')
      return
    }

    window.open(photoCandidateSearchUrl, '_blank', 'noopener,noreferrer')
  }

  const readClipboardImage = async () => {
    if (editImageItems.length >= MAX_SHOP_IMAGE_FILES) {
      setNotice('사진은 대표 1장과 갤러리 6장까지 등록할 수 있습니다.')
      return
    }

    if (!navigator.clipboard?.read) {
      setNotice('이 브라우저에서는 클립보드 사진 추가를 지원하지 않습니다.')
      return
    }

    setIsReadingClipboardImage(true)

    try {
      const clipboardItems = await navigator.clipboard.read()

      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.toLowerCase().startsWith('image/'))

        if (!imageType) {
          continue
        }

        const blob = await item.getType(imageType)
        const file = new File([blob], `clipboard-shop-photo.${getImageExtension(imageType)}`, { type: imageType })

        updateEditImageFiles([file])
        setNotice('클립보드 사진을 추가했습니다. 저장하면 매장 사진으로 등록됩니다.')
        return
      }

      setNotice('클립보드에 복사된 이미지가 없습니다.')
    } catch {
      setNotice('클립보드 사진을 불러오지 못했습니다. 이미지를 복사한 뒤 다시 시도해주세요.')
    } finally {
      setIsReadingClipboardImage(false)
    }
  }

  const removePendingFile = (targetIndex: number) => {
    setPendingFiles((current) => current.filter((_, index) => index !== targetIndex))
  }

  const removeEditImageItem = (targetIndex: number) => {
    setEditImageItems((current) => {
      if (current.length <= 1) {
        setNotice('대표사진은 최소 1장 유지해주세요.')
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
          throw new Error('대표사진은 최소 1장 유지해주세요.')
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['shops'] })
      if (!isEditMode) {
        resetForm()
      }
      clearAdminShopSelectedLocation()
      navigate('/admin/shops', {
        replace: true,
        state: { notice: isEditMode ? '매장을 수정했습니다.' : '새 매장을 등록했습니다.' },
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
        {editShopQuery.isLoading ? <p className="admin-shop-manage-state">매장 정보를 불러오는 중입니다.</p> : null}
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
                      onChange={(event) => updateEditImageFiles(Array.from(event.target.files ?? []))}
                    />
                    <span aria-hidden="true" className="admin-shop-camera-icon" />
                    <strong>
                      {editImageItems.length}/{MAX_SHOP_IMAGE_FILES}
                    </strong>
                  </label>

                  {editImageItems.map((photo, index) => (
                    <article className="admin-shop-photo-card admin-shop-photo-card-pending" key={photo.id}>
                      <img alt={photo.name} src={photo.url} />
                      <button
                        aria-label={`${photo.name} 사진 제거`}
                        className="admin-shop-photo-remove"
                        type="button"
                        onClick={() => removeEditImageItem(index)}
                      >
                        ×
                      </button>
                      {index === 0 ? <span>대표사진</span> : null}
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
                      onChange={(event) => updatePendingFiles(Array.from(event.target.files ?? []))}
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
                      {photo.isCover ? <span>대표사진</span> : null}
                    </article>
                  ))}
                </>
              )}
            </div>
            {isEditMode ? (
              <div className="admin-shop-photo-candidate-actions">
                <button
                  className="admin-shop-photo-candidate-load"
                  type="button"
                  onClick={openPhotoCandidateSearch}
                >
                  사진 후보 찾기
                </button>
                <button
                  className="admin-shop-photo-candidate-clipboard"
                  disabled={isReadingClipboardImage}
                  type="button"
                  onClick={readClipboardImage}
                >
                  {isReadingClipboardImage ? '추가 중' : '클립보드 사진 추가'}
                </button>
              </div>
            ) : null}
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
                <small>상세 화면에서 방문 판단 정보로 노출됩니다.</small>
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

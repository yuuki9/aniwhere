import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, ListRow, SearchField, Toast } from '@aniwhere/tds-mobile'
import { API_BASE_URL } from '../../shared/api/client'
import { getCategories } from '../../shared/api/categories'
import {
  createShop,
  createShopWithImages,
  getShop,
  getShopFacets,
  updateShop,
  updateShopWithImages,
} from '../../shared/api/shops'
import type {
  CategoryListItem,
  FacetWorkTypeItem,
  Shop,
  ShopImage,
  ShopRequest,
  ShopStatus,
  WorkCatalogItem,
  WorkType,
} from '../../shared/api/types'
import { getWorks } from '../../shared/api/works'
import { AppTopNavigation } from '../../shared/ui/AppTopNavigation'
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
  categoryIds: number[]
  workIds: number[]
  status: ShopStatus
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
  categoryIds: [],
  workIds: [],
  status: 'UNVERIFIED',
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
    categoryIds: form.categoryIds,
    workIds: form.workIds,
    status: form.status,
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
    categoryIds: shop.categoryIds ?? shop.categories.map((category) => category.id),
    workIds: shop.workIds ?? shop.works.map((work) => work.id),
    status: shop.status,
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

function toggleSelectedId(selectedIds: number[], targetId: number) {
  return selectedIds.includes(targetId)
    ? selectedIds.filter((selectedId) => selectedId !== targetId)
    : [...selectedIds, targetId]
}

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? '').trim().toLocaleLowerCase()
}

function compactSearchText(value: string) {
  return value.replace(/\s+/g, '')
}

function hasKoreanText(value: string) {
  return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(value)
}

function getWorkSearchFields(work: WorkCatalogItem) {
  return [work.name, work.koreanTitle, work.titleNative, ...(work.genres ?? [])].filter((field) => hasKoreanText(field ?? ''))
}

function getHighlightedWorkNameParts(name: string, query: string) {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return [{ text: name, highlighted: false }]
  }

  const normalizedName = normalizeSearchText(name)
  const startIndex = normalizedName.indexOf(normalizedQuery)

  if (startIndex >= 0) {
    return [
      { text: name.slice(0, startIndex), highlighted: false },
      { text: name.slice(startIndex, startIndex + normalizedQuery.length), highlighted: true },
      { text: name.slice(startIndex + normalizedQuery.length), highlighted: false },
    ].filter((part) => part.text.length > 0)
  }

  const compactName = compactSearchText(normalizedName)
  const compactQuery = compactSearchText(normalizedQuery)
  if (compactQuery.length > 0 && compactName.includes(compactQuery)) {
    return [{ text: name, highlighted: true }]
  }

  return [{ text: name, highlighted: false }]
}

function getMatchingWorkOptions(
  options: WorkCatalogItem[],
  query: string,
  selectedIds: number[],
  workTypeFilter?: WorkType,
) {
  const normalizedQuery = normalizeSearchText(query)
  const compactQuery = compactSearchText(normalizedQuery)

  if (!normalizedQuery || !hasKoreanText(normalizedQuery)) {
    return []
  }

  return options
    .filter((work) => workTypeFilter == null || work.type === workTypeFilter)
    .filter((work) => {
      const searchableFields = getWorkSearchFields(work)
        .map(normalizeSearchText)
        .filter(Boolean)

      const aliases = searchableFields.flatMap((field) => [field, compactSearchText(field)])

      return aliases.some((alias) => alias.includes(normalizedQuery) || alias.includes(compactQuery))
    })
    .sort((a, b) => Number(selectedIds.includes(b.id)) - Number(selectedIds.includes(a.id)))
    .slice(0, 8)
}

function CatalogSelectionSection({
  emptyLabel,
  isError,
  isLoading,
  onToggle,
  options,
  selectedIds,
  title,
}: {
  emptyLabel: string
  isError: boolean
  isLoading: boolean
  onToggle: (id: number) => void
  options: Array<CategoryListItem | WorkCatalogItem>
  selectedIds: number[]
  title: string
}) {
  return (
    <section className="admin-shop-catalog-group" aria-label={title}>
      <div className="admin-shop-catalog-head">
        <strong>{title}</strong>
        <small>{selectedIds.length}개 선택</small>
      </div>

      {isLoading ? <small className="meta-text">{title} 목록을 불러오고 있습니다.</small> : null}
      {isError ? <small className="error-text">{title} 목록을 불러오지 못했습니다.</small> : null}
      {!isLoading && !isError && options.length === 0 ? <small className="meta-text">{emptyLabel}</small> : null}

      {options.length > 0 ? (
        <div className="admin-shop-catalog-options">
          {options.map((option) => {
            const selected = selectedIds.includes(option.id)
            const count = 'count' in option ? option.count : null

            return (
              <label className="admin-shop-catalog-option" data-selected={selected} key={option.id}>
                <input checked={selected} type="checkbox" onChange={() => onToggle(option.id)} />
                <span className="admin-shop-catalog-check" aria-hidden="true" />
                <span>{option.name}</span>
                {count != null ? <small>{count}</small> : null}
              </label>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

function WorkCatalogSearchSelectionSection({
  emptyLabel,
  isError,
  isLoading,
  onToggle,
  options,
  query,
  selectedIds,
  title,
  workTypeFilter,
  workTypes,
  onQueryChange,
  onWorkTypeFilterChange,
}: {
  emptyLabel: string
  isError: boolean
  isLoading: boolean
  onToggle: (id: number) => void
  options: WorkCatalogItem[]
  query: string
  selectedIds: number[]
  title: string
  workTypeFilter?: WorkType
  workTypes: FacetWorkTypeItem[]
  onQueryChange: (query: string) => void
  onWorkTypeFilterChange: (workType?: WorkType) => void
}) {
  const matchingOptions = getMatchingWorkOptions(options, query, selectedIds, workTypeFilter)
  const selectedOptions = options.filter((option) => selectedIds.includes(option.id))
  const normalizedQuery = normalizeSearchText(query)
  const hasSearchableQuery = hasKoreanText(normalizedQuery)

  return (
    <section className="admin-shop-catalog-group admin-shop-work-search-shell" aria-label={title}>
      <div className="admin-shop-catalog-head">
        <strong>{title}</strong>
        <small>{selectedIds.length}개 선택</small>
      </div>

      {workTypes.length > 0 ? (
        <div className="admin-shop-work-type-filter" aria-label="작품 유형 필터">
          {workTypes.map((workType) => {
            const selected = workTypeFilter === workType.value

            return (
              <button
                className="admin-shop-work-type-chip"
                data-selected={selected}
                key={workType.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onWorkTypeFilterChange(selected ? undefined : workType.value)}
              >
                {workType.label}
              </button>
            )
          })}
        </div>
      ) : null}

      {selectedOptions.length > 0 ? (
        <div className="admin-shop-selected-work-list" aria-label="선택된 작품">
          {selectedOptions.map((work) => (
            <button
              aria-label={`${work.name} 선택 해제`}
              className="admin-shop-selected-work-chip"
              key={work.id}
              type="button"
              onClick={() => onToggle(work.id)}
            >
              <span>{work.name}</span>
              <span aria-hidden="true">x</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="admin-shop-work-search-combobox">
        <SearchField
          className="admin-shop-work-search-field"
          placeholder="작품 이름으로 검색"
          style={{ padding: 0 }}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onDeleteClick={() => onQueryChange('')}
        />

        {!isLoading && !isError && options.length > 0 && hasSearchableQuery ? (
          <div className="admin-shop-work-suggestion-panel">
            {matchingOptions.length === 0 ? (
              <small className="meta-text">검색어와 비슷한 작품이 없어요.</small>
            ) : (
              <ul className="admin-shop-work-suggestion-list" aria-label="작품 검색 결과">
                {matchingOptions.map((work) => {
                  const selected = selectedIds.includes(work.id)

                  return (
                    <ListRow
                      className="admin-shop-work-suggestion-row"
                      contents={
                        <button className="admin-shop-work-suggestion-button" type="button" onClick={() => onToggle(work.id)}>
                          <strong>
                            {getHighlightedWorkNameParts(work.name, query).map((part, index) =>
                              part.highlighted ? (
                                <mark className="admin-shop-work-suggestion-highlight" key={`${work.id}-highlight-${index}`}>
                                  {part.text}
                                </mark>
                              ) : (
                                <span key={`${work.id}-text-${index}`}>{part.text}</span>
                              )
                            )}
                          </strong>
                        </button>
                      }
                      data-selected={selected ? 'true' : undefined}
                      key={work.id}
                      right={
                        selected ? (
                          <Badge className="admin-shop-work-suggestion-selected-badge" color="blue" size="small" variant="weak">
                            선택됨
                          </Badge>
                        ) : null
                      }
                      verticalPadding="small"
                    />
                  )
                })}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      {isLoading ? <small className="meta-text">{title} 목록을 불러오고 있습니다.</small> : null}
      {isError ? <small className="error-text">{title} 목록을 불러오지 못했습니다.</small> : null}
      {!isLoading && !isError && options.length === 0 ? <small className="meta-text">{emptyLabel}</small> : null}
    </section>
  )
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
  const [workSearchQuery, setWorkSearchQuery] = useState('')
  const [workTypeFilter, setWorkTypeFilter] = useState<WorkType | undefined>(undefined)
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
  const categoriesQuery = useQuery({
    queryKey: ['categories', 'admin-shop-form'],
    queryFn: getCategories,
    refetchOnMount: 'always',
  })
  const shopFacetQuery = useQuery({
    queryKey: ['shops', 'facets', 'admin-shop-work-types'],
    queryFn: () => getShopFacets({ includeWorkTypes: true }),
    refetchOnMount: 'always',
  })
  const worksQuery = useQuery({
    queryKey: ['works', 'admin-shop-form'],
    queryFn: () => getWorks(),
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

  const toggleCategory = (categoryId: number) => {
    setShopForm((current) => ({
      ...current,
      categoryIds: toggleSelectedId(current.categoryIds, categoryId),
    }))
  }

  const toggleWork = (workId: number) => {
    setShopForm((current) => ({
      ...current,
      workIds: toggleSelectedId(current.workIds, workId),
    }))
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
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      await queryClient.invalidateQueries({ queryKey: ['shops', 'facets'] })
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
      <AppTopNavigation className="route-navigation" showBack title={isEditMode ? '매장 수정' : '매장 등록'} showLogo={false} />

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
          <div className="admin-shop-editor-heading">
            <h1>{isEditMode ? '매장 수정' : '매장 등록'}</h1>
          </div>

          <section className="admin-shop-editor-section admin-shop-photo-section">
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

          <section className="admin-shop-editor-section admin-shop-catalog-section">
            <CatalogSelectionSection
              emptyLabel="등록된 카테고리가 없습니다."
              isError={categoriesQuery.isError}
              isLoading={categoriesQuery.isLoading}
              options={categoriesQuery.data ?? []}
              selectedIds={shopForm.categoryIds}
              title="카테고리"
              onToggle={toggleCategory}
            />
            <WorkCatalogSearchSelectionSection
              emptyLabel="등록된 작품이 없습니다."
              isError={worksQuery.isError}
              isLoading={worksQuery.isLoading}
              options={worksQuery.data ?? []}
              query={workSearchQuery}
              selectedIds={shopForm.workIds}
              title="취급 작품"
              workTypeFilter={workTypeFilter}
              workTypes={shopFacetQuery.data?.workTypes ?? []}
              onQueryChange={setWorkSearchQuery}
              onToggle={toggleWork}
              onWorkTypeFilterChange={setWorkTypeFilter}
            />
          </section>

          <div className="admin-shop-actions">
            <Button
              className="admin-shop-submit-button"
              display="block"
              disabled={saveShopMutation.isPending || editShopQuery.isLoading}
              type="submit"
            >
              {saveShopMutation.isPending ? '저장 중...' : isEditMode ? '수정하기' : '등록하기'}
            </Button>
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

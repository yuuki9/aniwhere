export type ApiResponse<T> = {
  success: boolean
  data?: T | null
  code?: string
  message?: string
}

export type SortObject = {
  direction?: string
  nullHandling?: string
  ascending?: boolean
  property?: string
  ignoreCase?: boolean
}

export type PageableObject = {
  offset?: number
  sort?: SortObject[]
  paged?: boolean
  pageNumber?: number
  pageSize?: number
  unpaged?: boolean
}

export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
  sort?: SortObject[]
  pageable?: PageableObject
}

export type ShopStatus = 'ACTIVE' | 'CLOSED' | 'UNVERIFIED'
export type ShopLinkType = 'BLOG' | 'INSTA' | 'X' | 'PLACE' | 'HOMEPAGE'

export type ShopLink = {
  id: number
  type: ShopLinkType
  url: string
}

export type ShopImageRole = 'PRIMARY' | 'GALLERY'

export type ShopImage = {
  id: number
  url: string
  role: ShopImageRole
  sortOrder: number
}

export type WorkType = 'ANIMATION' | 'GAME'

export type WorkSummary = {
  id: number
  name: string
  coverUrl: string | null
}

export type WorkCatalogItem = WorkSummary & {
  type: WorkType
  anilistId: number | null
  titleRomaji: string | null
  titleEnglish: string | null
  titleNative: string | null
  koreanTitle: string | null
  genres: string[] | null
  tmdbLogoUrl: string | null
  popularity: number | null
  anilistSyncedAt: string | null
}

export type RegionListItem = {
  id: number
  city: string | null
  name: string
  count: number
}

export type CategoryListItem = {
  id: number
  name: string
  count: number
}

export type CategorySummary = {
  id: number
  name: string
}

export type Shop = {
  id: number
  name: string
  address: string
  px: number
  py: number
  floor: string | null
  regionId: number | null
  regionName: string | null
  categoryIds?: number[]
  workIds?: number[]
  status: ShopStatus
  visitTip: string | null
  categories: CategorySummary[]
  works: WorkSummary[]
  links: ShopLink[]
  images: ShopImage[]
  description: string | null
  createdAt: string
  updatedAt: string
}

type FacetBaseItem = {
  id: number
  name: string
  selected: boolean
  disabled: boolean
  count: number
}

export type FacetRegionItem = FacetBaseItem

export type FacetCategoryItem = FacetBaseItem

export type FacetWorkItem = FacetBaseItem & {
  coverUrl: string | null
}

export type FacetStatusItem = {
  value: ShopStatus
  label: string
  selected: boolean
  disabled: boolean
  count: number
}

export type ShopFacetResponse = {
  regions: FacetRegionItem[]
  categories: FacetCategoryItem[]
  works: FacetWorkItem[]
  statuses: FacetStatusItem[]
}

export type ShopRequest = {
  name: string
  address: string
  px: number
  py: number
  floor?: string | null
  regionId?: number | null
  categoryIds: number[]
  workIds: number[]
  status: ShopStatus
  visitTip?: string | null
}

export type AdminShopPhoto = {
  id: string
  shopId: number
  name: string
  dataUrl: string
  createdAt: string
}

export type PointGrantStatus = 'QUEUED' | 'SENT' | 'FAILED'

export type PointGrantRequest = {
  id: string
  recipientLabel: string
  recipientUserKey: string
  amount: number
  reason: string
  promotionCode: string
  status: PointGrantStatus
  channel: 'SERVER_QUEUE' | 'SDK_SELF_TEST'
  resultMessage: string | null
  createdAt: string
}

export type CreatePointGrantRequest = {
  recipientLabel: string
  recipientUserKey: string
  amount: number
  reason: string
  promotionCode: string
}

export type MapAssistantRecommendation = {
  shopId: number
  reason: string
}

export type MapAssistantReply = {
  summary: string
  recommendations: MapAssistantRecommendation[]
}

export type Post = {
  id: number
  title: string
  content: string
  authorUserId: number
  authorNickname: string
  viewCount: number
  likeCount: number
  createdAt: string
  updatedAt: string
}

export type Comment = {
  id: number
  postId: number
  content: string
  authorUserId: number
  authorNickname: string
  createdAt: string
}

export type ShopSearchParams = {
  page?: number
  size?: number
  sort?: string[]
  regionId?: number
  category?: string
  categoryIds?: number[]
  keyword?: string
  workKeyword?: string
  workId?: number
  status?: ShopStatus
}

export type ShopFacetParams = {
  keyword?: string
  regionIds?: number[]
  categoryIds?: number[]
  workIds?: number[]
  status?: ShopStatus
  swLat?: number
  swLng?: number
  neLat?: number
  neLng?: number
  type?: WorkType
}

export type PagingParams = {
  page?: number
  size?: number
  sort?: string[]
}

export type CreatePostPayload = {
  title: string
  content: string
  authorNickname: string
}

export type UpdatePostPayload = {
  title: string
  content: string
}

export type CreateCommentPayload = {
  content: string
  authorNickname: string
}

export type TossLoginPayload = {
  authorizationCode: string
  referrer: string
}

export type RefreshAuthPayload = {
  refreshToken: string
}

export type LoginResult = {
  accessToken: string
  refreshToken: string
  expiresIn: number
  role: string
  isNewUser: boolean
}

export type RefreshResult = {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export type UserSummary = {
  id: number
  userKey: number
  nickname: string | null
  status: string
  lastLoginAt: string | null
  createdAt: string
}

export type NicknameAvailabilityResult = {
  nickname: string
  available: boolean
}

export type UpdateNicknamePayload = {
  nickname: string
}

export type Unit = Record<string, never>

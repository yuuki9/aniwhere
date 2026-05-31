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
  averageRating: number | null
  reviewCount: number
  createdAt: string
  updatedAt: string
}

type FacetBaseItem = {
  id: number
  name: string
}

export type FacetRegionItem = FacetBaseItem

export type FacetCategoryItem = FacetBaseItem

export type FacetWorkTypeItem = {
  value: WorkType
  label: string
}

export type ShopFacetResponse = {
  regions: FacetRegionItem[]
  categories: FacetCategoryItem[]
  workTypes: FacetWorkTypeItem[]
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

export type ShopReviewStatus = 'VISIBLE' | 'HIDDEN' | 'DELETED'
export type ShopReviewSort = 'NEWEST' | 'OLDEST' | 'RATING_HIGH' | 'RATING_LOW'
export type UserAppRole = 'ADMIN' | 'USER'

export type ShopReviewImage = {
  id: number | null
  url: string
  sortOrder: number
}

export type ShopReview = {
  id: number
  shopId: number
  authorUserId: number
  authorNickname: string
  authorEmojiIconFilename: string | null
  rating: number
  content: string
  status: ShopReviewStatus
  images: ShopReviewImage[]
  likeCount: number
  likedByMe: boolean
  createdAt: string
  updatedAt: string | null
}

export type ShopSearchParams = {
  page?: number
  size?: number
  sort?: string[]
  regionIds?: number[]
  categoryIds?: number[]
  keyword?: string
  workKeyword?: string
  workIds?: number[]
  workType?: WorkType
  status?: ShopStatus
}

export type ShopFacetParams = {
  includeRegions?: boolean
  includeCategories?: boolean
  includeWorkTypes?: boolean
}

export type PagingParams = {
  page?: number
  size?: number
  sort?: string[]
}

export type ShopReviewListParams = Omit<PagingParams, 'sort'> & {
  sort?: ShopReviewSort
}

export type CreateShopReviewPayload = {
  rating: number
  content: string
  images?: File[]
}

export type UpdateShopReviewPayload = {
  rating?: number
  content?: string
  images?: File[]
}

export type UpdateUserRolePayload = {
  role: UserAppRole
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
  role: string
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

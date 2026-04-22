export type ApiResponse<T> = {
  success: boolean
  data: T
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

export type Shop = {
  id: number
  name: string
  address: string
  px: number
  py: number
  floor: string | null
  regionId: number | null
  regionName: string | null
  status: ShopStatus
  sellsIchibanKuji: boolean | null
  visitTip: string | null
  categories: string[]
  works: string[]
  links: ShopLink[]
  description: string | null
  createdAt: string
  updatedAt: string
}

export type ShopRequest = {
  name: string
  address: string
  px: number
  py: number
  floor?: string | null
  regionId?: number | null
  status: ShopStatus
  sellsIchibanKuji?: boolean | null
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
  authorNickname: string
  viewCount: number
  createdAt: string
  updatedAt: string
}

export type Comment = {
  id: number
  postId: number
  content: string
  authorNickname: string
  createdAt: string
}

export type ShopSearchParams = {
  page?: number
  size?: number
  sort?: string[]
  regionId?: number
  category?: string
  keyword?: string
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

export type UpdatePostPayload = CreatePostPayload

export type CreateCommentPayload = {
  content: string
  authorNickname: string
}

export type Unit = Record<string, never>

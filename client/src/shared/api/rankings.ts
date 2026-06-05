import { request, toQueryString } from './client'
import type {
  KeywordRankingItem,
  MixedEntityRankingItem,
  RankingQueryParams,
  RankingResponse,
  ShopRankingItem,
  WorkRankingItem,
} from './types'

function rankingQuery(params: RankingQueryParams = {}) {
  return toQueryString({
    window: params.window,
    limit: params.limit,
  })
}

export function getMixedEntityRankings(params?: RankingQueryParams) {
  return request<RankingResponse<MixedEntityRankingItem>>(`/api/v1/rankings/search/entities${rankingQuery(params)}`, {
    authToken: null,
  })
}

export function getWorkRankings(params?: RankingQueryParams) {
  return request<RankingResponse<WorkRankingItem>>(`/api/v1/rankings/works${rankingQuery(params)}`, {
    authToken: null,
  })
}

export function getShopRankings(params?: RankingQueryParams) {
  return request<RankingResponse<ShopRankingItem>>(`/api/v1/rankings/shops${rankingQuery(params)}`, {
    authToken: null,
  })
}

export function getKeywordRankings(params?: RankingQueryParams) {
  return request<RankingResponse<KeywordRankingItem>>(`/api/v1/rankings/search/keywords${rankingQuery(params)}`, {
    authToken: null,
  })
}

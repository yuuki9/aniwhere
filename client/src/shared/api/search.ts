import { request, toQueryString } from './client'
import type { SearchAutocompleteResponse, SearchAutocompleteScope } from './types'

type SearchAutocompleteParams = {
  q: string
  scope: SearchAutocompleteScope
  limit?: number
}

export function getSearchAutocomplete(params: SearchAutocompleteParams) {
  const query = toQueryString({
    q: params.q,
    scope: params.scope,
    limit: params.limit,
  })

  return request<SearchAutocompleteResponse>(`/api/v1/search/autocomplete${query}`)
}

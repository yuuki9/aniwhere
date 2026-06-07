export type HomeCtaCard = {
  id: 'map' | 'favorites' | 'reviews'
  headlineLines: [string, string]
  href: string | null
  enabled: boolean
  imageAlt: string
}

const EXPLORE_LIST_ENTRY_PARAM = 'entry'
const EXPLORE_INITIAL_LIST_ENTRY_VALUE = 'list'

function buildInitialExploreListHref(params: Record<string, string>) {
  const next = new URLSearchParams(params)

  next.set(EXPLORE_LIST_ENTRY_PARAM, EXPLORE_INITIAL_LIST_ENTRY_VALUE)
  next.set('returnTo', '/home')

  return `/explore?${next.toString()}`
}

export function buildRecentViewedShopHref(shopId: number) {
  const next = new URLSearchParams({
    view: 'list',
    entry: EXPLORE_INITIAL_LIST_ENTRY_VALUE,
    returnTo: '/home',
    shopId: String(shopId),
    sheet: 'expanded',
  })

  return `/explore?${next.toString()}`
}

export function buildHomeCtaCards(): HomeCtaCard[] {
  return [
    {
      id: 'map',
      headlineLines: ['가까운 매장', '지도에서 보기'],
      href: '/explore?view=map',
      enabled: true,
      imageAlt: '지도 핀과 매장 일러스트를 보여주는 Aniwhere 안내 이미지',
    },
    {
      id: 'favorites',
      headlineLines: ['관심 많은 매장', '먼저 둘러보기'],
      href: buildInitialExploreListHref({ view: 'list', sort: 'FAVORITE_COUNT_DESC' }),
      enabled: true,
      imageAlt: '하트와 매장 카드를 보여주는 Aniwhere 안내 이미지',
    },
    {
      id: 'reviews',
      headlineLines: ['리뷰 많은 매장', '믿고 찾아보기'],
      href: buildInitialExploreListHref({ view: 'list', sort: 'REVIEW_COUNT_DESC' }),
      enabled: true,
      imageAlt: '말풍선과 별점 리뷰 카드를 보여주는 Aniwhere 안내 이미지',
    },
  ]
}

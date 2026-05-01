import type { Shop } from '../shared/api/types.ts'

export type HomeShopSummary = {
  id: number
  name: string
  href: string
  meta: string
  freshness: string
  detail: string
}

export type HomeQuickMenu = {
  id: 'stores' | 'reviews' | 'report'
  label: string
  href: string
  icon: 'pin' | 'review' | 'report'
}

export type HomeIssueCard = {
  id: string
  keyword: string
  eyebrow: string
  title: string
  description: string
  displayedStoreCount: number
  remainingStoreCount: number
  href: string
  image: null
  imageStatus: 'not_licensed'
  tone: 'blue' | 'green' | 'amber'
  visual: 'shelf' | 'capsule' | 'ticket'
  stores: HomeShopSummary[]
}

export const buildExploreDetailHref = (shopId: number) => `/explore?shopId=${shopId}`

export const buildSearchHref = (keyword: string) => `/search?keyword=${encodeURIComponent(keyword)}&page=0`

export const buildHomeQuickMenus = (): HomeQuickMenu[] => [
  {
    id: 'stores',
    label: '매장찾기',
    href: '/explore',
    icon: 'pin',
  },
  {
    id: 'reviews',
    label: '방문후기',
    href: '/community',
    icon: 'review',
  },
  {
    id: 'report',
    label: '제보하기',
    href: '/community',
    icon: 'report',
  },
]

const getUpdatedDate = (value: string) => {
  return value.slice(0, 10)
}

const getUpdatedTime = (value: string) => {
  const numericValue = Number(value)
  const timestamp = Number.isFinite(numericValue) ? numericValue : Date.parse(value)

  return Number.isFinite(timestamp) ? timestamp : 0
}

const getShopDetail = (shop: Shop) => {
  return [shop.address, shop.floor].filter(Boolean).join(' · ')
}

const getShopMeta = (shop: Shop) => {
  return [shop.regionName, shop.categories[0], shop.sellsIchibanKuji ? '이치방쿠지' : undefined].filter(Boolean).join(' · ')
}

export const buildShopSummary = (shop: Shop): HomeShopSummary => ({
  id: shop.id,
  name: shop.name,
  href: buildExploreDetailHref(shop.id),
  meta: getShopMeta(shop),
  freshness: `${getUpdatedDate(shop.updatedAt)} 업데이트`,
  detail: getShopDetail(shop),
})

const getTopWorks = (shops: Shop[]) => {
  const counts = new Map<string, number>()

  for (const shop of shops) {
    const uniqueWorks = new Set(shop.works.map((work) => work.trim()).filter(Boolean))

    for (const normalized of uniqueWorks) {
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
    .map(([keyword, count]) => ({ keyword, count }))
}

const selectWorkStores = (shops: Shop[], keyword: string, limit = 3) => {
  return shops
    .filter((shop) => shop.works.some((work) => work.trim() === keyword))
    .sort((a, b) => getUpdatedTime(b.updatedAt) - getUpdatedTime(a.updatedAt))
    .slice(0, limit)
    .map(buildShopSummary)
}

export const buildHomeIssueCards = (shops: Shop[]): HomeIssueCard[] => {
  const issueKeywords = getTopWorks(shops)
  const tones: HomeIssueCard['tone'][] = ['blue', 'green', 'amber']
  const visuals: HomeIssueCard['visual'][] = ['shelf', 'capsule', 'ticket']

  return issueKeywords.map(({ keyword, count }, index) => {
    const stores = selectWorkStores(shops, keyword)

    return {
      id: `work-${keyword}`,
      keyword,
      eyebrow: '작품 키워드',
      title: keyword,
      description: `등록 매장 ${count}곳`,
      displayedStoreCount: stores.length,
      remainingStoreCount: Math.max(0, count - stores.length),
      href: buildSearchHref(keyword),
      image: null,
      imageStatus: 'not_licensed',
      tone: tones[index % tones.length],
      visual: visuals[index % visuals.length],
      stores,
    }
  })
}

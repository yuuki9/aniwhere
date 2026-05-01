import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildHomeIssueCards,
  buildHomeQuickMenus,
  buildShopSummary,
} from '../src/pages/homeViewModel.ts'
import type { Shop } from '../src/shared/api/types.ts'
import { formatDateTime } from '../src/shared/lib/format.ts'

const baseShop: Shop = {
  id: 1,
  name: '애니굿즈샵',
  address: '서울시 마포구',
  px: 127,
  py: 37,
  floor: null,
  regionId: 12,
  regionName: '홍대',
  status: 'ACTIVE',
  sellsIchibanKuji: false,
  visitTip: null,
  categories: ['굿즈샵'],
  works: ['하이큐'],
  links: [{ id: 1, type: 'PLACE', url: 'https://example.com' }],
  description: null,
  createdAt: '2026-04-29T00:00:00.000Z',
  updatedAt: '2026-04-30T00:00:00.000Z',
}

test('buildShopSummary centralizes home shop display copy', () => {
  const summary = buildShopSummary(baseShop)

  assert.deepEqual(summary, {
    id: 1,
    name: '애니굿즈샵',
    href: '/explore?shopId=1',
    meta: '홍대 · 굿즈샵',
    freshness: `${formatDateTime(baseShop.updatedAt)} 업데이트`,
    detail: '서울시 마포구',
  })
})

test('buildShopSummary falls back without duplicating formatting rules', () => {
  const summary = buildShopSummary({
    ...baseShop,
    id: 2,
    name: '제보 매장',
    regionName: null,
    regionId: null,
    categories: [],
    works: [],
    links: [],
    status: 'UNVERIFIED',
    sellsIchibanKuji: true,
    address: '서울시 중구',
    floor: '2층',
    updatedAt: '2026-05-01T00:00:00.000Z',
  })

  assert.equal(summary.meta, '이치방쿠지')
  assert.equal(summary.detail, '서울시 중구 · 2층')
})

test('buildShopSummary does not invent labels when API fields are missing', () => {
  const summary = buildShopSummary({
    ...baseShop,
    id: 7,
    regionName: null,
    regionId: null,
    categories: [],
    works: [],
    sellsIchibanKuji: false,
    address: '',
    floor: null,
  })

  assert.equal(summary.meta, '')
  assert.equal(summary.detail, '')
})

test('buildHomeQuickMenus keeps search terms out of home shortcuts', () => {
  const menus = buildHomeQuickMenus()

  assert.deepEqual(
    menus.map((menu) => menu.id),
    ['stores', 'reviews', 'report'],
  )
  assert.equal(menus[0].href, '/explore')
  assert.equal(menus.some((menu) => menu.href.startsWith('/search')), false)
})

test('buildHomeIssueCards derives topic cards from shop works', () => {
  const cards = buildHomeIssueCards([
    baseShop,
    { ...baseShop, id: 2, works: ['하이큐'], updatedAt: '2026-05-01T00:00:00.000Z' },
    { ...baseShop, id: 3, works: ['하이큐'], updatedAt: '2026-05-02T00:00:00.000Z' },
    { ...baseShop, id: 4, works: ['장송의 프리렌'], updatedAt: '2026-05-03T00:00:00.000Z' },
    { ...baseShop, id: 5, works: ['주술회전'], updatedAt: '2026-05-04T00:00:00.000Z' },
    { ...baseShop, id: 6, works: ['나의 히어로 아카데미아'], updatedAt: '2026-05-05T00:00:00.000Z' },
  ])

  assert.equal(cards[0].keyword, '하이큐')
  assert.equal(cards[0].href, '/search?keyword=%ED%95%98%EC%9D%B4%ED%81%90&page=0')
  assert.equal(cards[0].eyebrow, '작품 키워드')
  assert.equal(cards[0].title, '하이큐')
  assert.equal(cards[0].description, '등록 매장 3곳')
  assert.equal(cards[0].displayedStoreCount, 3)
  assert.equal(cards[0].remainingStoreCount, 0)
  assert.equal(cards[0].image, null)
  assert.equal(cards[0].imageStatus, 'not_licensed')
  assert.equal(cards[0].stores.length, 3)
  assert.deepEqual(
    cards[0].stores.map((store) => store.href),
    ['/explore?shopId=3', '/explore?shopId=2', '/explore?shopId=1'],
  )
  assert.equal(cards[0].stores[0].name, '애니굿즈샵')
  assert.equal(cards[0].stores[0].meta, '홍대 · 굿즈샵')
  assert.equal(cards[0].stores[0].detail, '서울시 마포구')
  assert.ok(['shelf', 'capsule', 'ticket'].includes(cards[0].visual))
  assert.deepEqual(
    cards.map((card) => card.keyword),
    ['하이큐', '나의 히어로 아카데미아', '장송의 프리렌', '주술회전'],
  )
})

test('buildHomeIssueCards exposes remaining store count for discover link', () => {
  const cards = buildHomeIssueCards([
    baseShop,
    { ...baseShop, id: 2, works: ['하이큐'], updatedAt: '2026-05-01T00:00:00.000Z' },
    { ...baseShop, id: 3, works: ['하이큐'], updatedAt: '2026-05-02T00:00:00.000Z' },
    { ...baseShop, id: 4, works: ['하이큐'], updatedAt: '2026-05-03T00:00:00.000Z' },
    { ...baseShop, id: 5, works: ['하이큐'], updatedAt: '2026-05-04T00:00:00.000Z' },
  ])

  assert.equal(cards[0].description, '등록 매장 5곳')
  assert.equal(cards[0].displayedStoreCount, 3)
  assert.equal(cards[0].remainingStoreCount, 2)
  assert.equal(cards[0].href, '/search?keyword=%ED%95%98%EC%9D%B4%ED%81%90&page=0')
})

test('buildHomeIssueCards counts duplicate works in the same shop once', () => {
  const cards = buildHomeIssueCards([
    { ...baseShop, id: 1, works: ['하이큐', '하이큐'], updatedAt: '2026-05-01T00:00:00.000Z' },
    { ...baseShop, id: 2, works: ['하이큐'], updatedAt: '2026-05-02T00:00:00.000Z' },
  ])

  assert.equal(cards[0].keyword, '하이큐')
  assert.equal(cards[0].description, '등록 매장 2곳')
  assert.equal(cards[0].displayedStoreCount, 2)
  assert.equal(cards[0].remainingStoreCount, 0)
})

test('buildHomeIssueCards returns no fallback works when API works are empty', () => {
  const cards = buildHomeIssueCards([{ ...baseShop, works: [] }])

  assert.deepEqual(cards, [])
})

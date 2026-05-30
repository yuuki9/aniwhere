import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildAppliedShopFilterChips,
  countShopFilters,
  getShopSortLabel,
  parseShopFilters,
  removeAppliedShopFilterChip,
  toShopSearchParams,
  writeShopFilters,
} from '../src/shared/lib/shopFilters.ts'
import { shopFacetQueryKey } from '../src/shared/lib/shopFacetQuery.ts'

test('parseShopFilters keeps only valid Swagger-backed shop filters', () => {
  const filters = parseShopFilters(
    new URLSearchParams(
      'regionId=12&regionIds=13&regionIds=x&regionIds=14&categoryIds=1&categoryIds=x&categoryIds=2&workId=9&status=ACTIVE&sort=REVIEW_COUNT_DESC&page=3',
    ),
  )

  assert.deepEqual(filters, {
    regionIds: [12, 13, 14],
    categoryIds: [1, 2],
    workId: 9,
    workType: undefined,
    status: 'ACTIVE',
    sort: 'REVIEW_COUNT_DESC',
  })
})

test('writeShopFilters rewrites filter params and removes paging without dropping search context', () => {
  const params = writeShopFilters(new URLSearchParams('keyword=홍대&page=4&categoryIds=1&status=CLOSED'), {
    regionIds: [8, 9],
    categoryIds: [3, 5],
    workId: undefined,
    workType: 'ANIMATION',
    status: 'UNVERIFIED',
    sort: 'FAVORITE_COUNT_DESC',
  })

  assert.equal(
    params.toString(),
    'keyword=%ED%99%8D%EB%8C%80&regionIds=8&regionIds=9&categoryIds=3&categoryIds=5&workType=ANIMATION&status=UNVERIFIED&sort=FAVORITE_COUNT_DESC',
  )
})

test('shop filters map to the current shop search API parameter shape', () => {
  const filters = {
    regionIds: [8, 9],
    categoryIds: [3, 5],
    workId: 13,
    workType: 'GAME' as const,
    status: 'ACTIVE' as const,
    sort: 'REVIEW_COUNT_DESC' as const,
  }

  assert.deepEqual(toShopSearchParams(filters), {
    regionIds: [8, 9],
    categoryIds: [3, 5],
    workIds: [13],
    workType: 'GAME',
    status: 'ACTIVE',
    sort: 'REVIEW_COUNT_DESC',
  })
  assert.equal(countShopFilters(filters), 8)
})

test('shop filter count matches the number of active facet chips', () => {
  assert.equal(
    countShopFilters({
      regionIds: [8, 9],
      categoryIds: [3],
      workId: undefined,
      workType: 'ANIMATION',
      status: undefined,
      sort: 'FAVORITE_COUNT_DESC',
    }),
    5,
  )
})

test('shop filters send single selected regions through the multi-select shop search API', () => {
  const filters = {
    regionIds: [8],
    categoryIds: [],
    workId: undefined,
    workType: undefined,
    status: undefined,
  }

  assert.deepEqual(toShopSearchParams(filters), {
    regionIds: [8],
    categoryIds: undefined,
    workIds: undefined,
    workType: undefined,
    status: undefined,
  })
})

test('applied shop filter chips expose visible labels and removable facet targets', () => {
  const chips = buildAppliedShopFilterChips(
    {
      regionIds: [8, 9],
      categoryIds: [3],
      workId: undefined,
      status: 'ACTIVE',
    },
    {
      regions: [
        { id: 8, name: 'Hongdae' },
        { id: 9, name: 'Gangnam' },
      ],
      categories: [{ id: 3, name: 'Lifestyle' }],
      workTypes: [],
    },
  )

  assert.deepEqual(
    chips.map((chip) => ({ key: chip.key, label: chip.label, removeLabel: chip.removeLabel })),
    [
      { key: 'region:8', label: 'Hongdae', removeLabel: 'Remove Hongdae filter' },
      { key: 'region:9', label: 'Gangnam', removeLabel: 'Remove Gangnam filter' },
      { key: 'category:3', label: 'Lifestyle', removeLabel: 'Remove Lifestyle filter' },
    ],
  )
})

test('work type filters use Swagger facet labels and remain removable', () => {
  const chips = buildAppliedShopFilterChips(
    {
      regionIds: [],
      categoryIds: [],
      workId: undefined,
      workType: 'GAME',
      status: undefined,
    },
    {
      regions: [],
      categories: [],
      workTypes: [{ value: 'GAME', label: 'Game' }],
      sorts: [],
    },
  )

  assert.deepEqual(chips.map((chip) => ({ key: chip.key, label: chip.label, removeLabel: chip.removeLabel })), [
    { key: 'workType:GAME', label: 'Game', removeLabel: 'Remove Game filter' },
  ])

  assert.deepEqual(
    removeAppliedShopFilterChip(
      { regionIds: [], categoryIds: [], workId: undefined, workType: 'GAME', status: undefined },
      { facet: 'workType', value: 'GAME' },
    ),
    {
      regionIds: [],
      categoryIds: [],
      workId: undefined,
      workType: undefined,
      status: undefined,
    },
  )
})

test('shop sort labels match home CTA naming', () => {
  assert.equal(getShopSortLabel('FAVORITE_COUNT_DESC'), '관심 많은순')
  assert.equal(getShopSortLabel('REVIEW_COUNT_DESC'), '리뷰 많은순')
  assert.equal(getShopSortLabel('NEWEST'), '최신순')

  const chips = buildAppliedShopFilterChips(
    {
      regionIds: [],
      categoryIds: [],
      workId: undefined,
      sort: 'FAVORITE_COUNT_DESC',
    },
    {
      regions: [],
      categories: [],
      workTypes: [],
      sorts: [{ value: 'FAVORITE_COUNT_DESC', label: '찜 많은순' }],
    },
  )

  assert.deepEqual(chips.map((chip) => chip.label), ['관심 많은순'])
})

test('applied shop filter chips do not duplicate quick chip status filters', () => {
  const chips = buildAppliedShopFilterChips({
    regionIds: [],
    categoryIds: [],
    workId: undefined,
    status: 'ACTIVE',
  })

  assert.deepEqual(chips, [])
})

test('applied shop filter chips remove one facet without clearing unrelated filters', () => {
  const filters = {
    regionIds: [8, 9],
    categoryIds: [3, 5],
    workId: undefined,
    status: 'ACTIVE' as const,
  }

  assert.deepEqual(removeAppliedShopFilterChip(filters, { facet: 'region', value: 8 }), {
    regionIds: [9],
    categoryIds: [3, 5],
    workId: undefined,
    status: 'ACTIVE',
  })

  assert.deepEqual(removeAppliedShopFilterChip(filters, { facet: 'status', value: 'ACTIVE' }), {
    regionIds: [8, 9],
    categoryIds: [3, 5],
    workId: undefined,
    status: undefined,
  })
})

test('shopFacetQueryKey separates category and sort facet payloads', () => {
  assert.deepEqual(shopFacetQueryKey({ includeCategories: true, includeSorts: true }), [
    'shops',
    'facets',
    {
      includeCategories: true,
      includeSorts: true,
    },
  ])
})

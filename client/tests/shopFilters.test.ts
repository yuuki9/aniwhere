import test from 'node:test'
import assert from 'node:assert/strict'
import {
  countShopFilters,
  parseShopFilters,
  toShopFacetParams,
  toShopSearchParams,
  writeShopFilters,
} from '../src/shared/lib/shopFilters.ts'

test('parseShopFilters keeps only valid Swagger-backed shop filters', () => {
  const filters = parseShopFilters(
    new URLSearchParams(
      'regionId=12&regionId=13&categoryIds=1&categoryIds=x&categoryIds=2&workId=9&status=ACTIVE&page=3',
    ),
  )

  assert.deepEqual(filters, {
    regionId: 12,
    categoryIds: [1, 2],
    workId: 9,
    status: 'ACTIVE',
  })
})

test('writeShopFilters rewrites filter params and resets paging without dropping search context', () => {
  const params = writeShopFilters(new URLSearchParams('keyword=홍대&page=4&categoryIds=1&status=CLOSED'), {
    regionId: 8,
    categoryIds: [3, 5],
    workId: undefined,
    status: 'UNVERIFIED',
  })

  assert.equal(params.toString(), 'keyword=%ED%99%8D%EB%8C%80&regionId=8&categoryIds=3&categoryIds=5&status=UNVERIFIED&page=0')
})

test('shop filters map to shop search and facet API parameter shapes', () => {
  const filters = {
    regionId: 8,
    categoryIds: [3, 5],
    workId: 13,
    status: 'ACTIVE' as const,
  }

  assert.deepEqual(toShopSearchParams(filters), {
    regionId: 8,
    categoryIds: [3, 5],
    workId: 13,
    status: 'ACTIVE',
  })
  assert.deepEqual(toShopFacetParams(filters, { keyword: '피규어' }), {
    keyword: '피규어',
    regionIds: [8],
    categoryIds: [3, 5],
    workIds: [13],
    status: 'ACTIVE',
  })
  assert.equal(countShopFilters(filters), 4)
})

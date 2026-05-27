import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildAppliedShopFilterChips,
  countShopFilters,
  parseShopFilters,
  removeAppliedShopFilterChip,
  toShopSearchParams,
  writeShopFilters,
} from '../src/shared/lib/shopFilters.ts'

test('parseShopFilters keeps only valid Swagger-backed shop filters', () => {
  const filters = parseShopFilters(
    new URLSearchParams(
      'regionId=12&regionIds=13&regionIds=x&regionIds=14&categoryIds=1&categoryIds=x&categoryIds=2&workId=9&status=ACTIVE&page=3',
    ),
  )

  assert.deepEqual(filters, {
    regionIds: [12, 13, 14],
    categoryIds: [1, 2],
    workId: 9,
    status: 'ACTIVE',
  })
})

test('writeShopFilters rewrites filter params and removes paging without dropping search context', () => {
  const params = writeShopFilters(new URLSearchParams('keyword=홍대&page=4&categoryIds=1&status=CLOSED'), {
    regionIds: [8, 9],
    categoryIds: [3, 5],
    workId: undefined,
    status: 'UNVERIFIED',
  })

  assert.equal(
    params.toString(),
    'keyword=%ED%99%8D%EB%8C%80&regionIds=8&regionIds=9&categoryIds=3&categoryIds=5&status=UNVERIFIED',
  )
})

test('shop filters map to the current shop search API parameter shape', () => {
  const filters = {
    regionIds: [8, 9],
    categoryIds: [3, 5],
    workId: 13,
    status: 'ACTIVE' as const,
  }

  assert.deepEqual(toShopSearchParams(filters), {
    regionIds: [8, 9],
    categoryIds: [3, 5],
    workIds: [13],
    status: 'ACTIVE',
  })
  assert.equal(countShopFilters(filters), 4)
})

test('shop filters send single selected regions through the multi-select shop search API', () => {
  const filters = {
    regionIds: [8],
    categoryIds: [],
    workId: undefined,
    status: undefined,
  }

  assert.deepEqual(toShopSearchParams(filters), {
    regionIds: [8],
    categoryIds: undefined,
    workIds: undefined,
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

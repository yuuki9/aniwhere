import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = (path: string) => fs.readFileSync(new URL(path, import.meta.url), 'utf8')
const apiTypesSource = () => source('../src/shared/api/types.ts')
const shopsApiSource = () => source('../src/shared/api/shops.ts')
const worksApiSource = () => source('../src/shared/api/works.ts')
const communityApiSource = () => source('../src/shared/api/community.ts')
const authApiSource = () => source('../src/shared/api/auth.ts')
const usersApiSource = () => source('../src/shared/api/users.ts')
const apiClientSource = () => source('../src/shared/api/client.ts')
const backendContractSource = () => source('../../docs/backend-api-contract.md')

test('client API types expose the current Swagger response models', () => {
  const types = apiTypesSource()

  assert.match(types, /code\?: string/)
  assert.match(types, /export type ShopFacetResponse = \{/)
  assert.match(types, /export type FacetWorkTypeItem = \{/)
  assert.match(types, /workTypes: FacetWorkTypeItem\[\]/)
  assert.match(types, /regionIds\?: number\[\]/)
  assert.match(types, /workIds\?: number\[\]/)
  assert.match(types, /includeRegions\?: boolean/)
  assert.match(types, /authorUserId: number/)
  assert.match(types, /likeCount: number/)
  assert.match(types, /export type LoginResult = \{/)
  assert.match(types, /isNewUser: boolean/)
  assert.match(types, /export type UserSummary = \{/)
  assert.match(types, /export type NicknameAvailabilityResult = \{/)
  assert.match(types, /export type UpdatePostPayload = \{\s*title: string\s*content: string\s*\}/)
})

test('client API functions cover Swagger paths added for facets, favorites, auth, and users', () => {
  const shops = shopsApiSource()
  const works = worksApiSource()
  const community = communityApiSource()
  const auth = authApiSource()
  const users = usersApiSource()
  const client = apiClientSource()

  assert.match(shops, /regionIds:\s*params\.regionIds/)
  assert.match(shops, /categoryIds:\s*params\.categoryIds/)
  assert.match(shops, /workIds:\s*params\.workIds/)
  assert.match(shops, /export function getShopFacets/)
  assert.match(shops, /includeRegions:\s*params\.includeRegions/)
  assert.match(shops, /\/api\/v1\/shops\/facets/)
  assert.match(shops, /export function addFavoriteShop/)
  assert.match(shops, /method:\s*'POST'/)
  assert.match(shops, /export function removeFavoriteShop/)
  assert.match(shops, /method:\s*'DELETE'/)

  assert.match(works, /export function addFavoriteWork/)
  assert.match(works, /\/api\/v1\/works\/\$\{workId\}\/favorite/)
  assert.match(works, /export function removeFavoriteWork/)

  assert.match(community, /export function likePost/)
  assert.match(community, /\/api\/v1\/posts\/\$\{id\}\/likes/)
  assert.match(community, /export function unlikePost/)

  assert.match(auth, /export function tossLogin/)
  assert.match(auth, /\/api\/v1\/auth\/toss\/login/)
  assert.match(auth, /request<LoginResult>\('\/api\/v1\/auth\/toss\/login',\s*\{\s*method:\s*'POST'/s)
  assert.match(auth, /export function refreshAuth/)
  assert.match(auth, /export function logout/)

  assert.match(users, /export function getMyProfile/)
  assert.match(users, /export function checkNicknameAvailability/)
  assert.match(users, /export function updateMyNickname/)
  assert.match(users, /export function listUsers/)

  assert.match(client, /Authorization/)
  assert.match(client, /authToken/)
  assert.match(client, /getStoredAccessToken/)
  assert.match(client, /authToken === undefined \? getStoredAccessToken\(\) : authToken/)
  assert.doesNotMatch(client, /authToken \?\? getStoredAccessToken\(\)/)
})

test('backend API contract notes keep shop facets aligned with deployed Swagger', () => {
  const contract = backendContractSource()

  assert.match(contract, /GET \/api\/v1\/shops\/facets` provides search facet payload \(`regions`, `categories`, `workTypes`\)/)
  assert.match(contract, /accepts optional `includeRegions`, `includeCategories`, and `includeWorkTypes`/)
  assert.match(contract, /does not expose `keyword`, selected filter IDs, `status`, `type`, or map bounds/)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildNearbyExploreHref,
  NEARBY_MAX_RADIUS_KM,
  NEARBY_RADIUS_KM,
  readNearbyExploreParams,
} from '../src/pages/searchNearby.ts'

test('buildNearbyExploreHref passes current coordinates to explore without inventing shop data', () => {
  const href = buildNearbyExploreHref({
    latitude: 37.5665,
    longitude: 126.978,
  })

  assert.equal(href, `/explore?nearby=1&lat=37.5665&lng=126.978&radiusKm=${NEARBY_RADIUS_KM}`)
})

test('readNearbyExploreParams returns a valid nearby request from query params', () => {
  const params = readNearbyExploreParams(new URLSearchParams('nearby=1&lat=37.5665&lng=126.978&radiusKm=3'))

  assert.deepEqual(params, {
    location: {
      latitude: 37.5665,
      longitude: 126.978,
    },
    radiusKm: 3,
  })
})

test('readNearbyExploreParams ignores incomplete or disabled nearby requests', () => {
  assert.equal(readNearbyExploreParams(new URLSearchParams('lat=37.5665&lng=126.978')), null)
  assert.equal(readNearbyExploreParams(new URLSearchParams('nearby=1&lat=37.5665')), null)
  assert.equal(readNearbyExploreParams(new URLSearchParams('nearby=0&lat=37.5665&lng=126.978')), null)
})

test('readNearbyExploreParams rejects out-of-range coordinates and radius values', () => {
  assert.equal(readNearbyExploreParams(new URLSearchParams('nearby=1&lat=999&lng=126.978')), null)
  assert.equal(readNearbyExploreParams(new URLSearchParams('nearby=1&lat=37.5665&lng=999')), null)
  assert.equal(readNearbyExploreParams(new URLSearchParams('nearby=1&lat=37.5665&lng=126.978&radiusKm=0')), null)
  assert.equal(
    readNearbyExploreParams(new URLSearchParams(`nearby=1&lat=37.5665&lng=126.978&radiusKm=${NEARBY_MAX_RADIUS_KM + 1}`)),
    null,
  )
})

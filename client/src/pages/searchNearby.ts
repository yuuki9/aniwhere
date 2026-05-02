import type { UserLocation } from '../shared/lib/location'

export const NEARBY_RADIUS_KM = 5

type NearbyExploreParams = {
  location: UserLocation
  radiusKm: number
}

function readFiniteNumber(value: string | null) {
  if (value == null) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function buildNearbyExploreHref(location: UserLocation, radiusKm = NEARBY_RADIUS_KM) {
  const params = new URLSearchParams()
  params.set('nearby', '1')
  params.set('lat', String(location.latitude))
  params.set('lng', String(location.longitude))
  params.set('radiusKm', String(radiusKm))

  return `/explore?${params.toString()}`
}

export function readNearbyExploreParams(searchParams: URLSearchParams): NearbyExploreParams | null {
  if (searchParams.get('nearby') !== '1') {
    return null
  }

  const latitude = readFiniteNumber(searchParams.get('lat'))
  const longitude = readFiniteNumber(searchParams.get('lng'))
  const radiusKm = readFiniteNumber(searchParams.get('radiusKm')) ?? NEARBY_RADIUS_KM

  if (latitude == null || longitude == null || radiusKm <= 0) {
    return null
  }

  return {
    location: {
      latitude,
      longitude,
    },
    radiusKm,
  }
}

import type { UserLocation } from '../shared/lib/location'

export const NEARBY_RADIUS_KM = 5
export const NEARBY_MAX_RADIUS_KM = 20

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

function isValidLatitude(value: number | null): value is number {
  return value != null && value >= -90 && value <= 90
}

function isValidLongitude(value: number | null): value is number {
  return value != null && value >= -180 && value <= 180
}

function isValidRadiusKm(value: number) {
  return value > 0 && value <= NEARBY_MAX_RADIUS_KM
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

  if (!isValidLatitude(latitude) || !isValidLongitude(longitude) || !isValidRadiusKm(radiusKm)) {
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

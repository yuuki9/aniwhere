import { Accuracy, getCurrentLocation, getOperationalEnvironment } from '@apps-in-toss/web-framework'

export type UserLocation = {
  latitude: number
  longitude: number
}

export type LocationPermissionState =
  | 'idle'
  | 'loading'
  | 'granted'
  | 'denied'
  | 'unsupported'
  | 'error'

const EARTH_RADIUS_KM = 6371

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function isTossRuntime() {
  try {
    const environment = getOperationalEnvironment()
    return environment === 'toss' || environment === 'sandbox'
  } catch {
    return false
  }
}

async function requestTossLocation(): Promise<UserLocation> {
  const permission = await getCurrentLocation.getPermission()

  if (permission !== 'allowed') {
    const result = await getCurrentLocation.openPermissionDialog()
    if (result !== 'allowed') {
      throw new Error('위치 권한이 허용되지 않았습니다.')
    }
  }

  const location = await getCurrentLocation({
    accuracy: Accuracy.Balanced,
  })

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  }
}

export function calculateDistanceKm(from: UserLocation, to: UserLocation) {
  const dLat = toRadians(to.latitude - from.latitude)
  const dLng = toRadians(to.longitude - from.longitude)
  const startLat = toRadians(from.latitude)
  const endLat = toRadians(to.latitude)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(startLat) * Math.cos(endLat)

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistanceLabel(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`
  }

  return `${distanceKm.toFixed(1)}km`
}

export async function requestCurrentLocation(): Promise<UserLocation> {
  if (isTossRuntime()) {
    return requestTossLocation()
  }

  if (!navigator.geolocation) {
    throw new Error('현재 브라우저에서 위치 정보를 지원하지 않습니다.')
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      },
    )
  })
}

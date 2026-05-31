export type NaverDirectionTarget = {
  latitude: number
  longitude: number
  name: string
}

export type NaverDirectionOrigin = {
  latitude: number
  longitude: number
  name?: string
}

const NAVER_MAP_APP_NAME = 'aniwhere'

export function canBuildNaverWebDirectionUrl(target: NaverDirectionTarget | null | undefined) {
  return Boolean(
    target &&
      Number.isFinite(target.latitude) &&
      Number.isFinite(target.longitude) &&
      target.name.trim().length > 0,
  )
}

export function buildNaverWebDirectionUrl(target: NaverDirectionTarget, origin?: NaverDirectionOrigin | null) {
  const params = new URLSearchParams({
    menu: 'route',
    ename: target.name.trim(),
    ex: String(target.longitude),
    ey: String(target.latitude),
    pathType: '1',
    showMap: 'true',
  })

  if (origin && Number.isFinite(origin.latitude) && Number.isFinite(origin.longitude)) {
    params.set('sname', origin.name?.trim() || '현재 위치')
    params.set('sx', String(origin.longitude))
    params.set('sy', String(origin.latitude))
  }

  return `https://m.map.naver.com/route.nhn?${params.toString()}`
}

export function buildNaverAppDirectionUrl(target: NaverDirectionTarget, origin?: NaverDirectionOrigin | null) {
  const params = new URLSearchParams({
    dlat: String(target.latitude),
    dlng: String(target.longitude),
    dname: target.name.trim(),
    appname: NAVER_MAP_APP_NAME,
  })

  if (origin && Number.isFinite(origin.latitude) && Number.isFinite(origin.longitude)) {
    params.set('slat', String(origin.latitude))
    params.set('slng', String(origin.longitude))
    params.set('sname', origin.name?.trim() || '현재 위치')
  }

  return `nmap://route/public?${params.toString()}`
}

export function buildNaverMapSearchUrl(query: string) {
  return `https://m.map.naver.com/search2/search.naver?query=${encodeURIComponent(query)}`
}

export function buildNaverAppSearchUrl(query: string) {
  const params = new URLSearchParams({
    query,
    appname: NAVER_MAP_APP_NAME,
  })

  return `nmap://search?${params.toString()}`
}

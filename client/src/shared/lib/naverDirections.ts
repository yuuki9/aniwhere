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

export function buildNaverMapSearchUrl(query: string) {
  return `https://m.map.naver.com/search2/search.naver?query=${encodeURIComponent(query)}`
}

import { loadNaverMaps } from './naverMapLoader'

export type ShopLocationCandidate = {
  id: string
  address: string
  roadAddress: string
  jibunAddress: string
  px: number
  py: number
}

function toCandidate(item: naver.maps.Service.AddressItemV2, index: number): ShopLocationCandidate | null {
  const px = Number(item.x)
  const py = Number(item.y)
  const address = item.roadAddress || item.jibunAddress

  if (!address || !Number.isFinite(px) || !Number.isFinite(py)) {
    return null
  }

  return {
    id: `${item.x}:${item.y}:${index}`,
    address,
    roadAddress: item.roadAddress,
    jibunAddress: item.jibunAddress,
    px,
    py,
  }
}

export async function geocodeShopAddress(query: string): Promise<ShopLocationCandidate[]> {
  const maps = await loadNaverMaps()

  return new Promise((resolve, reject) => {
    maps.Service.geocode({ query, count: 5 }, (status, response) => {
      if (status !== maps.Service.Status.OK) {
        reject(new Error('네이버 지도 인증에 실패했습니다. 주소 검색용 백엔드 프록시 또는 허용 도메인 설정이 필요합니다.'))
        return
      }

      const candidates = response.v2.addresses
        .map((item, index) => toCandidate(item, index))
        .filter((item): item is ShopLocationCandidate => item != null)

      resolve(candidates)
    })
  })
}

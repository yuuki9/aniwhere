const NAVER_MAP_CALLBACK_NAME = '__aniwhereNaverMapReady'
const NAVER_MAP_SCRIPT_ID = 'aniwhere-naver-map-sdk'
const NAVER_MAP_READY_RETRY_LIMIT = 20
const NAVER_MAP_READY_RETRY_DELAY_MS = 50

type NaverMapNamespace = typeof naver.maps

declare global {
  interface Window {
    __aniwhereNaverMapReady?: () => void
    naver?: {
      maps?: NaverMapNamespace
    }
  }
}

let naverMapLoadPromise: Promise<NaverMapNamespace> | null = null

function getLoadedNaverMaps() {
  return window.naver?.maps?.Map ? window.naver.maps : null
}

export function loadNaverMaps() {
  const loadedMaps = getLoadedNaverMaps()

  if (loadedMaps) {
    return Promise.resolve(loadedMaps)
  }

  if (naverMapLoadPromise) {
    return naverMapLoadPromise
  }

  const keyId = import.meta.env.VITE_NAVER_MAP_NCP_KEY_ID?.trim()

  if (!keyId) {
    return Promise.reject(new Error('네이버 지도 키가 설정되지 않았습니다.'))
  }

  naverMapLoadPromise = new Promise<NaverMapNamespace>((resolve, reject) => {
    const existingScript = document.getElementById(NAVER_MAP_SCRIPT_ID) as HTMLScriptElement | null

    const rejectLoad = (error: Error) => {
      naverMapLoadPromise = null
      window[NAVER_MAP_CALLBACK_NAME] = undefined
      document.getElementById(NAVER_MAP_SCRIPT_ID)?.remove()
      reject(error)
    }

    const resolveWhenReady = (attempt = 0) => {
      const maps = getLoadedNaverMaps()

      if (maps) {
        window[NAVER_MAP_CALLBACK_NAME] = undefined
        resolve(maps)
        return
      }

      if (attempt >= NAVER_MAP_READY_RETRY_LIMIT) {
        rejectLoad(new Error('네이버 지도 SDK를 초기화하지 못했습니다.'))
        return
      }

      window.setTimeout(() => {
        resolveWhenReady(attempt + 1)
      }, NAVER_MAP_READY_RETRY_DELAY_MS)
    }

    window[NAVER_MAP_CALLBACK_NAME] = () => {
      resolveWhenReady()
    }

    if (existingScript) {
      existingScript.remove()
    }

    const script = document.createElement('script')
    script.id = NAVER_MAP_SCRIPT_ID
    script.async = true
    script.defer = true
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(
      keyId,
    )}&callback=${NAVER_MAP_CALLBACK_NAME}`
    script.onerror = () => {
      rejectLoad(new Error('네이버 지도 SDK를 불러오지 못했습니다.'))
    }

    document.head.appendChild(script)
  })

  return naverMapLoadPromise
}

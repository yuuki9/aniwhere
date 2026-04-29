const NAVER_MAP_CALLBACK_NAME = '__aniwhereNaverMapReady'
const NAVER_MAP_SCRIPT_ID = 'aniwhere-naver-map-sdk'
const NAVER_MAP_READY_RETRY_LIMIT = 20
const NAVER_MAP_READY_RETRY_DELAY_MS = 50
const NAVER_MAP_WATCHDOG_TIMEOUT_MS = 10000

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
    let readyRetryTimer: number | null = null
    let watchdogTimer: number | null = null
    let settled = false

    const clearLoadTimers = () => {
      if (readyRetryTimer != null) {
        window.clearTimeout(readyRetryTimer)
        readyRetryTimer = null
      }

      if (watchdogTimer != null) {
        window.clearTimeout(watchdogTimer)
        watchdogTimer = null
      }
    }

    const cleanupLoad = (removeScript = false) => {
      clearLoadTimers()
      window[NAVER_MAP_CALLBACK_NAME] = undefined

      if (removeScript) {
        document.getElementById(NAVER_MAP_SCRIPT_ID)?.remove()
      }
    }

    const rejectLoad = (error: Error) => {
      if (settled) {
        return
      }

      settled = true
      naverMapLoadPromise = null
      cleanupLoad(true)
      reject(error)
    }

    const resolveLoad = (maps: NaverMapNamespace) => {
      if (settled) {
        return
      }

      settled = true
      cleanupLoad()
      resolve(maps)
    }

    const resolveWhenReady = (attempt = 0) => {
      const maps = getLoadedNaverMaps()

      if (maps) {
        resolveLoad(maps)
        return
      }

      if (attempt >= NAVER_MAP_READY_RETRY_LIMIT) {
        rejectLoad(new Error('네이버 지도 SDK를 초기화하지 못했습니다.'))
        return
      }

      readyRetryTimer = window.setTimeout(() => {
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

    watchdogTimer = window.setTimeout(() => {
      rejectLoad(new Error('네이버 지도 SDK 응답이 지연되고 있습니다.'))
    }, NAVER_MAP_WATCHDOG_TIMEOUT_MS)

    document.head.appendChild(script)
  })

  return naverMapLoadPromise
}

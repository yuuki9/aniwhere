import type {
  AdminShopPhoto,
  CreatePointGrantRequest,
  PointGrantRequest,
  PointGrantStatus,
} from './types'

const SHOP_PHOTOS_STORAGE_KEY = 'aniwhere.admin.shop-photos.v1'
const POINT_GRANTS_STORAGE_KEY = 'aniwhere.admin.point-grants.v1'
const ADMIN_UPLOAD_ENDPOINT = import.meta.env.VITE_ADMIN_UPLOAD_ENDPOINT
const ADMIN_POINT_ENDPOINT = import.meta.env.VITE_ADMIN_POINT_ENDPOINT

type ShopPhotoMap = Record<string, AdminShopPhoto[]>

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('이미지 미리보기를 만들지 못했습니다.'))
    }

    reader.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'))
    reader.readAsDataURL(file)
  })
}

function normalizePointGrant(payload: Partial<PointGrantRequest>, fallback: PointGrantRequest): PointGrantRequest {
  return {
    ...fallback,
    ...payload,
    status: (payload.status as PointGrantStatus | undefined) ?? fallback.status,
    channel: payload.channel ?? fallback.channel,
    resultMessage: payload.resultMessage ?? fallback.resultMessage,
  }
}

export async function getShopPhotos(shopId: number) {
  const photoMap = readStorage<ShopPhotoMap>(SHOP_PHOTOS_STORAGE_KEY, {})
  return photoMap[String(shopId)] ?? []
}

export async function uploadShopPhotos(shopId: number, files: File[]) {
  if (files.length === 0) {
    return getShopPhotos(shopId)
  }

  if (ADMIN_UPLOAD_ENDPOINT) {
    const formData = new FormData()
    formData.set('shopId', String(shopId))
    files.forEach((file) => {
      formData.append('files', file)
    })

    const response = await fetch(ADMIN_UPLOAD_ENDPOINT, {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      const payload = (await response.json()) as { photos?: AdminShopPhoto[] }
      if (payload.photos) {
        const currentMap = readStorage<ShopPhotoMap>(SHOP_PHOTOS_STORAGE_KEY, {})
        currentMap[String(shopId)] = payload.photos
        writeStorage(SHOP_PHOTOS_STORAGE_KEY, currentMap)
        return payload.photos
      }
    }
  }

  const nextPhotos = await Promise.all(
    files.map(async (file) => ({
      id: createId('photo'),
      shopId,
      name: file.name,
      dataUrl: await fileToDataUrl(file),
      createdAt: new Date().toISOString(),
    })),
  )

  const photoMap = readStorage<ShopPhotoMap>(SHOP_PHOTOS_STORAGE_KEY, {})
  const merged = [...nextPhotos, ...(photoMap[String(shopId)] ?? [])].slice(0, 12)
  photoMap[String(shopId)] = merged
  writeStorage(SHOP_PHOTOS_STORAGE_KEY, photoMap)
  return merged
}

export async function removeShopPhoto(shopId: number, photoId: string) {
  const photoMap = readStorage<ShopPhotoMap>(SHOP_PHOTOS_STORAGE_KEY, {})
  const next = (photoMap[String(shopId)] ?? []).filter((photo) => photo.id !== photoId)
  photoMap[String(shopId)] = next
  writeStorage(SHOP_PHOTOS_STORAGE_KEY, photoMap)
  return next
}

export async function listPointGrantRequests() {
  const grants = readStorage<PointGrantRequest[]>(POINT_GRANTS_STORAGE_KEY, [])
  return [...grants].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function queuePointGrantRequest(payload: CreatePointGrantRequest) {
  const fallback: PointGrantRequest = {
    id: createId('grant'),
    recipientLabel: payload.recipientLabel,
    recipientUserKey: payload.recipientUserKey,
    amount: payload.amount,
    reason: payload.reason,
    promotionCode: payload.promotionCode,
    status: 'QUEUED',
    channel: 'SERVER_QUEUE',
    resultMessage: '백엔드 포인트 지급 API 연결 전까지 관리자 대기열에 저장됩니다.',
    createdAt: new Date().toISOString(),
  }

  if (ADMIN_POINT_ENDPOINT) {
    try {
      const response = await fetch(ADMIN_POINT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = response.ok ? await response.json() : null
      const normalized = normalizePointGrant(result, {
        ...fallback,
        status: response.ok ? 'SENT' : 'FAILED',
        resultMessage: response.ok ? '관리자 포인트 지급 API로 전송되었습니다.' : '관리자 포인트 지급 API 호출에 실패했습니다.',
      })

      const grants = readStorage<PointGrantRequest[]>(POINT_GRANTS_STORAGE_KEY, [])
      writeStorage(POINT_GRANTS_STORAGE_KEY, [normalized, ...grants])
      return normalized
    } catch {
      // Fall through to local queue persistence.
    }
  }

  const grants = readStorage<PointGrantRequest[]>(POINT_GRANTS_STORAGE_KEY, [])
  writeStorage(POINT_GRANTS_STORAGE_KEY, [fallback, ...grants])
  return fallback
}

export async function recordSdkPointGrant(result: {
  amount: number
  promotionCode: string
  recipientLabel: string
  recipientUserKey: string
  resultMessage: string
  status: PointGrantStatus
}) {
  const nextGrant: PointGrantRequest = {
    id: createId('sdk-grant'),
    recipientLabel: result.recipientLabel,
    recipientUserKey: result.recipientUserKey,
    amount: result.amount,
    reason: '현재 기기 SDK 테스트 지급',
    promotionCode: result.promotionCode,
    status: result.status,
    channel: 'SDK_SELF_TEST',
    resultMessage: result.resultMessage,
    createdAt: new Date().toISOString(),
  }

  const grants = readStorage<PointGrantRequest[]>(POINT_GRANTS_STORAGE_KEY, [])
  writeStorage(POINT_GRANTS_STORAGE_KEY, [nextGrant, ...grants])
  return nextGrant
}

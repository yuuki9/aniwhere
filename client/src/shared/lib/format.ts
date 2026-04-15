import type { ShopStatus } from '../api/types'

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatDateTime(value: string) {
  return dateFormatter.format(new Date(value))
}

export function formatRelativeUpdated(value: string) {
  const target = new Date(value).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - target)
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) {
    return `${Math.max(1, minutes)}분 전 업데이트`
  }

  if (hours < 24) {
    return `${hours}시간 전 업데이트`
  }

  if (days < 30) {
    return `${days}일 전 업데이트`
  }

  return formatDateTime(value)
}

export function statusToLabel(status: ShopStatus) {
  if (status === 'ACTIVE') {
    return '운영 중'
  }
  if (status === 'CLOSED') {
    return '운영 종료'
  }
  return '확인 필요'
}

export function linkTypeToLabel(type: string) {
  switch (type) {
    case 'BLOG':
      return '블로그'
    case 'INSTA':
      return '인스타그램'
    case 'X':
      return 'X'
    case 'PLACE':
      return '플레이스'
    case 'HOMEPAGE':
      return '홈페이지'
    default:
      return type
  }
}

export function projectToMapPosition(shops: Array<{ px: number; py: number }>) {
  if (shops.length === 0) {
    return [] as Array<{ left: number; top: number }>
  }

  const minX = Math.min(...shops.map((shop) => shop.px))
  const maxX = Math.max(...shops.map((shop) => shop.px))
  const minY = Math.min(...shops.map((shop) => shop.py))
  const maxY = Math.max(...shops.map((shop) => shop.py))

  const xGap = maxX - minX || 1
  const yGap = maxY - minY || 1

  return shops.map((shop) => {
    const left = 10 + ((shop.px - minX) / xGap) * 80
    const top = 12 + ((maxY - shop.py) / yGap) * 76
    return { left, top }
  })
}

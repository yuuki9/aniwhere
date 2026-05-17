import type { Post, WorkCatalogItem } from '../shared/api/types'

export type HomeQuickMenu = {
  id: 'map' | 'reviews' | 'admin'
  label: string
  href: string
  icon: 'map' | 'review' | 'admin'
}

export type HomeWorkPreviewItem = {
  id: number
  rank: number
  name: string
  subtitle: string | null
  coverUrl: string | null
  badgeLabel: string
}

export type HomeReviewPreviewItem = {
  id: number
  title: string
  excerpt: string
  authorNickname: string
  createdAt: string
}

export function buildHomeQuickMenus({ includeAdmin = false }: { includeAdmin?: boolean } = {}): HomeQuickMenu[] {
  const menus: HomeQuickMenu[] = [
    {
      id: 'map',
      label: '지도 보기',
      href: '/explore?view=map',
      icon: 'map',
    },
    {
      id: 'reviews',
      label: '방문 후기',
      href: '/community',
      icon: 'review',
    },
  ]

  if (includeAdmin) {
    menus.push({
      id: 'admin',
      label: '매장 관리',
      href: '/admin/shops',
      icon: 'admin',
    })
  }

  return menus
}

function pickWorkSubtitle(work: WorkCatalogItem) {
  const subtitle = work.koreanTitle ?? work.titleNative ?? work.titleRomaji ?? work.titleEnglish ?? null

  if (!subtitle || subtitle.trim() === work.name.trim()) {
    return null
  }

  return subtitle
}

export const buildHomeWorkPreviewItems = (works: WorkCatalogItem[]): HomeWorkPreviewItem[] =>
  works.slice(0, 20).map((work, index) => ({
    id: work.id,
    rank: index + 1,
    name: work.name,
    subtitle: pickWorkSubtitle(work),
    coverUrl: work.coverUrl,
    badgeLabel: '취급 매장 보기',
  }))

export const buildHomeReviewPreviewItems = (posts: Post[]): HomeReviewPreviewItem[] =>
  posts.slice(0, 2).map((post) => ({
    id: post.id,
    title: post.title,
    excerpt: post.content.trim().slice(0, 72),
    authorNickname: post.authorNickname,
    createdAt: post.createdAt,
  }))

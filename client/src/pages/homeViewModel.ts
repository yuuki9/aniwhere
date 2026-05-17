import type { Post, WorkCatalogItem } from '../shared/api/types'

export type HomeQuickMenu = {
  id: 'stores' | 'reviews'
  label: string
  href: string
  icon: 'pin' | 'review'
}

export type HomeWorkPreviewItem = {
  id: number
  name: string
  subtitle: string | null
  coverUrl: string | null
}

export type HomeReviewPreviewItem = {
  id: number
  title: string
  excerpt: string
  authorNickname: string
  createdAt: string
}

export const buildHomeQuickMenus = (): HomeQuickMenu[] => [
  {
    id: 'stores',
    label: '매장 찾기',
    href: '/explore',
    icon: 'pin',
  },
  {
    id: 'reviews',
    label: '방문 후기',
    href: '/community',
    icon: 'review',
  },
]

function pickWorkSubtitle(work: WorkCatalogItem) {
  const subtitle = work.koreanTitle ?? work.titleNative ?? work.titleRomaji ?? work.titleEnglish ?? null

  if (!subtitle || subtitle.trim() === work.name.trim()) {
    return null
  }

  return subtitle
}

export const buildHomeWorkPreviewItems = (works: WorkCatalogItem[]): HomeWorkPreviewItem[] =>
  works.slice(0, 12).map((work) => ({
    id: work.id,
    name: work.name,
    subtitle: pickWorkSubtitle(work),
    coverUrl: work.coverUrl,
  }))

export const buildHomeReviewPreviewItems = (posts: Post[]): HomeReviewPreviewItem[] =>
  posts.slice(0, 2).map((post) => ({
    id: post.id,
    title: post.title,
    excerpt: post.content.trim().slice(0, 72),
    authorNickname: post.authorNickname,
    createdAt: post.createdAt,
  }))

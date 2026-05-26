import type { Post, WorkCatalogItem } from '../shared/api/types'

export type HomeCtaCard = {
  id: 'map' | 'favorites' | 'reviews'
  headlineLines: [string, string]
  href: string | null
  enabled: boolean
  imageAlt: string
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

export function buildHomeCtaCards(): HomeCtaCard[] {
  return [
    {
      id: 'map',
      headlineLines: ['가까운 매장부터', '한눈에 보기'],
      href: '/explore?view=map',
      enabled: true,
      imageAlt: '지도핀과 매장 실루엣을 보여주는 Aniwhere 안내 이미지',
    },
    {
      id: 'favorites',
      headlineLines: ['많이 찜한 매장', '먼저 둘러보기'],
      href: null,
      enabled: false,
      imageAlt: '하트와 매장 카드를 보여주는 Aniwhere 안내 이미지',
    },
    {
      id: 'reviews',
      headlineLines: ['후기 많은 매장', '믿고 찾아보기'],
      href: null,
      enabled: false,
      imageAlt: '말풍선과 별점 리뷰 카드를 보여주는 Aniwhere 안내 이미지',
    },
  ]
}

function pickWorkSubtitle(work: WorkCatalogItem) {
  const subtitle = work.koreanTitle ?? work.titleNative ?? work.titleRomaji ?? work.titleEnglish ?? null

  if (!subtitle || subtitle.trim() === work.name.trim()) {
    return null
  }

  return subtitle
}

export const buildHomeWorkPreviewItems = (works: WorkCatalogItem[]): HomeWorkPreviewItem[] =>
  [...works]
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, 20)
    .map((work, index) => ({
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

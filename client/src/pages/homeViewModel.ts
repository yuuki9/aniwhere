export type HomeQuickMenu = {
  id: 'stores' | 'reviews' | 'report'
  label: string
  href: string
  icon: 'pin' | 'review' | 'report'
}

export const buildHomeQuickMenus = (): HomeQuickMenu[] => [
  {
    id: 'stores',
    label: '매장찾기',
    href: '/explore',
    icon: 'pin',
  },
  {
    id: 'reviews',
    label: '방문후기',
    href: '/community',
    icon: 'review',
  },
  {
    id: 'report',
    label: '제보하기',
    href: '/community',
    icon: 'report',
  },
]

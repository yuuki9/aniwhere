export type HomeQuickMenu = {
  id: 'stores' | 'reviews' | 'admin'
  label: string
  href: string
  icon: 'pin' | 'review' | 'admin'
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
  {
    id: 'admin',
    label: '매장 등록',
    href: '/admin/shops',
    icon: 'admin',
  },
]

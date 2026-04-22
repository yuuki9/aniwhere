export type AppNavigationItem = {
  key: 'discover' | 'explore' | 'community' | 'admin'
  to: string
  label: string
  showInTabBar?: boolean
  match: (pathname: string) => boolean
}

export const APP_NAV_ITEMS: AppNavigationItem[] = [
  {
    key: 'discover',
    to: '/discover',
    label: '홈',
    match: (pathname) => pathname === '/discover',
  },
  {
    key: 'explore',
    to: '/explore',
    label: '탐색',
    match: (pathname) => pathname.startsWith('/explore') || pathname.startsWith('/shops/'),
  },
  {
    key: 'community',
    to: '/community',
    label: '커뮤니티',
    match: (pathname) => pathname === '/community' || pathname.startsWith('/community/'),
  },
  {
    key: 'admin',
    to: '/admin',
    label: '관리',
    match: (pathname) => pathname.startsWith('/admin'),
  },
]

export const TAB_NAV_ITEMS = APP_NAV_ITEMS.filter((item) => item.showInTabBar)

export function isNavigationItemActive(pathname: string, item: AppNavigationItem) {
  return item.match(pathname)
}

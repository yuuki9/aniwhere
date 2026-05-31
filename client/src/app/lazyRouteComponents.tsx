import { lazy } from 'react'

export const AdminAccessGate = lazy(() =>
  import('../pages/admin/AdminAccessGate').then((module) => ({ default: module.AdminAccessGate }))
)
export const AdminHomePage = lazy(() =>
  import('../pages/admin/AdminHomePage').then((module) => ({ default: module.AdminHomePage }))
)
export const AdminShopManagePage = lazy(() =>
  import('../pages/admin/AdminShopManagePage').then((module) => ({ default: module.AdminShopManagePage }))
)
export const AdminShopLocationPage = lazy(() =>
  import('../pages/admin/AdminShopLocationPage').then((module) => ({ default: module.AdminShopLocationPage }))
)
export const AdminShopsPage = lazy(() =>
  import('../pages/admin/AdminShopsPage').then((module) => ({ default: module.AdminShopsPage }))
)
export const CommunityPage = lazy(() => import('../pages/CommunityPage').then((module) => ({ default: module.CommunityPage })))
export const ExplorePage = lazy(() => import('../pages/ExplorePage').then((module) => ({ default: module.ExplorePage })))
export const HomePage = lazy(() => import('../pages/HomePage').then((module) => ({ default: module.HomePage })))
export const IntroPage = lazy(() => import('../pages/IntroPage').then((module) => ({ default: module.IntroPage })))
export const PostDetailPage = lazy(() => import('../pages/PostDetailPage').then((module) => ({ default: module.PostDetailPage })))
export const SearchPage = lazy(() => import('../pages/SearchPage').then((module) => ({ default: module.SearchPage })))
export const ShopRouteRedirect = lazy(() => import('./ShopRouteRedirect').then((module) => ({ default: module.ShopRouteRedirect })))

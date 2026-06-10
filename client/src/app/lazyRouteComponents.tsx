import { lazy } from 'react'

export const AdminAccessGate = lazy(() =>
  import('../pages/admin/AdminAccessGate').then((module) => ({ default: module.AdminAccessGate }))
)
export const AdminHomePage = lazy(() =>
  import('../pages/admin/AdminHomePage').then((module) => ({ default: module.AdminHomePage }))
)
export const AdminReviewModerationPage = lazy(() =>
  import('../pages/admin/AdminReviewModerationPage').then((module) => ({ default: module.AdminReviewModerationPage }))
)
export const AdminUsersPage = lazy(() =>
  import('../pages/admin/AdminUsersPage').then((module) => ({ default: module.AdminUsersPage }))
)
export const AdminPointsPage = lazy(() =>
  import('../pages/admin/AdminPointsPage').then((module) => ({ default: module.AdminPointsPage }))
)
export const AdminAccountPage = lazy(() =>
  import('../pages/admin/AdminAccountPage').then((module) => ({ default: module.AdminAccountPage }))
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
export const ExplorePage = lazy(() => import('../pages/ExplorePage').then((module) => ({ default: module.ExplorePage })))
export const HomePage = lazy(() => import('../pages/HomePage').then((module) => ({ default: module.HomePage })))
export const IntroPage = lazy(() => import('../pages/IntroPage').then((module) => ({ default: module.IntroPage })))
export const MyPage = lazy(() => import('../pages/MyPage').then((module) => ({ default: module.MyPage })))
export const SearchPage = lazy(() => import('../pages/SearchPage').then((module) => ({ default: module.SearchPage })))
export const ShopRouteRedirect = lazy(() => import('./ShopRouteRedirect').then((module) => ({ default: module.ShopRouteRedirect })))

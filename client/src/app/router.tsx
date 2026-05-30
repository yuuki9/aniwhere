import { Suspense, type ReactNode } from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '../shared/ui/MainLayout'
import {
  AdminAccessGate,
  AdminHomePage,
  AdminShopLocationPage,
  AdminShopManagePage,
  AdminShopsPage,
  CommunityPage,
  ExplorePage,
  HomePage,
  IntroPage,
  PostDetailPage,
  SearchPage,
  ShopRouteRedirect,
} from './lazyRouteComponents'

function routeElement(element: ReactNode) {
  return <Suspense fallback={null}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: routeElement(<IntroPage />),
  },
  {
    path: '/intro',
    element: routeElement(<IntroPage />),
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: 'discover',
        element: <Navigate replace to="/home" />,
      },
      {
        path: 'home',
        element: routeElement(<HomePage />),
      },
      {
        path: 'shops',
        element: <Navigate replace to="/explore" />,
      },
      {
        path: 'explore',
        element: routeElement(<ExplorePage />),
      },
      {
        path: 'community',
        element: routeElement(<CommunityPage />),
      },
    ],
  },
  {
    path: '/shops/:shopId',
    element: routeElement(<ShopRouteRedirect />),
  },
  {
    path: '/shop/detail',
    element: <Navigate replace to="/explore" />,
  },
  {
    path: '/shop/detail/:shopId',
    element: routeElement(<ShopRouteRedirect />),
  },
  {
    path: '/search',
    element: routeElement(<SearchPage />),
  },
  {
    path: '/community/:postId',
    element: routeElement(<PostDetailPage />),
  },
  {
    path: '/admin',
    element: routeElement(<AdminAccessGate />),
    children: [
      {
        index: true,
        element: routeElement(<AdminHomePage />),
      },
      {
        path: 'shops',
        element: routeElement(<AdminShopManagePage />),
      },
      {
        path: 'shops/new',
        element: routeElement(<AdminShopsPage />),
      },
      {
        path: 'shops/:shopId/edit',
        element: routeElement(<AdminShopsPage />),
      },
      {
        path: 'shops/location',
        element: routeElement(<AdminShopLocationPage />),
      },
    ],
  },
  {
    path: '/reports/new',
    element: <Navigate replace to="/community" />,
  },
])

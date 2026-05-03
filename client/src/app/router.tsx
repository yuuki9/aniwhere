import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AdminAccessGate } from '../pages/admin/AdminAccessGate'
import { AdminHomePage } from '../pages/admin/AdminHomePage'
import { AdminRewardsPage } from '../pages/admin/AdminRewardsPage'
import { AdminShopsPage } from '../pages/admin/AdminShopsPage'
import { CommunityPage } from '../pages/CommunityPage'
import { ExplorePage } from '../pages/ExplorePage'
import { HomePage } from '../pages/HomePage'
import { IntroPage } from '../pages/IntroPage'
import { PostDetailPage } from '../pages/PostDetailPage'
import { SearchPage } from '../pages/SearchPage'
import { MainLayout } from '../shared/ui/MainLayout'
import { ShopRouteRedirect } from './ShopRouteRedirect'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <IntroPage />,
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
        element: <HomePage />,
      },
      {
        path: 'shops',
        element: <Navigate replace to="/explore" />,
      },
      {
        path: 'explore',
        element: <ExplorePage />,
      },
      {
        path: 'community',
        element: <CommunityPage />,
      },
    ],
  },
  {
    path: '/shops/:shopId',
    element: <ShopRouteRedirect />,
  },
  {
    path: '/search',
    element: <SearchPage />,
  },
  {
    path: '/community/:postId',
    element: <PostDetailPage />,
  },
  {
    path: '/admin',
    element: <AdminAccessGate />,
    children: [
      {
        index: true,
        element: <AdminHomePage />,
      },
      {
        path: 'shops',
        element: <AdminShopsPage />,
      },
      {
        path: 'rewards',
        element: <AdminRewardsPage />,
      },
    ],
  },
  {
    path: '/reports/new',
    element: <Navigate replace to="/community" />,
  },
])

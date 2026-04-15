import { Navigate, createBrowserRouter } from 'react-router-dom'
import { CommunityPage } from '../pages/CommunityPage'
import { ExplorePage } from '../pages/ExplorePage'
import { HomePage } from '../pages/HomePage'
import { IntroPage } from '../pages/IntroPage'
import { PostDetailPage } from '../pages/PostDetailPage'
import { SearchPage } from '../pages/SearchPage'
import { ShopPage } from '../pages/ShopPage'
import { MainLayout } from '../shared/ui/MainLayout'

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
    element: <ShopPage />,
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
    path: '/reports/new',
    element: <Navigate replace to="/community" />,
  },
])

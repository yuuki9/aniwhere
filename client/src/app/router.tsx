import { Navigate, createBrowserRouter } from 'react-router-dom'
import { CommunityPage } from '../pages/CommunityPage'
import { HomePage } from '../pages/HomePage'
import { PostDetailPage } from '../pages/PostDetailPage'
import { ShopPage } from '../pages/ShopPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate replace to="/shops" />,
  },
  {
    path: '/shops',
    element: <HomePage />,
  },
  {
    path: '/shops/:shopId',
    element: <ShopPage />,
  },
  {
    path: '/community',
    element: <CommunityPage />,
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

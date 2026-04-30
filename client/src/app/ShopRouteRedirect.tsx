import { Navigate, useParams } from 'react-router-dom'

export function ShopRouteRedirect() {
  const { shopId } = useParams()
  const parsedShopId = Number(shopId)

  if (!Number.isFinite(parsedShopId) || parsedShopId <= 0) {
    return <Navigate replace to="/explore" />
  }

  return <Navigate replace to={`/explore?shopId=${parsedShopId}`} />
}

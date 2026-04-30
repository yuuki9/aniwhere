import { Navigate, useParams } from 'react-router-dom'

export function ShopRouteRedirect() {
  const { shopId } = useParams()

  if (!shopId || !/^[1-9]\d*$/.test(shopId)) {
    return <Navigate replace to="/explore" />
  }

  const parsedShopId = Number(shopId)

  if (!Number.isSafeInteger(parsedShopId)) {
    return <Navigate replace to="/explore" />
  }

  return <Navigate replace to={`/explore?shopId=${parsedShopId}`} />
}

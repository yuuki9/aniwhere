import { Outlet, useLocation } from 'react-router-dom'
import { AppTopNavigation } from './AppTopNavigation'

export function MainLayout() {
  const location = useLocation()
  const isMapRoute = location.pathname === '/explore' || location.pathname.startsWith('/explore/')
  const hasRouteOwnedNavigation = isMapRoute || location.pathname === '/my'

  return (
    <div className={`route-shell ${isMapRoute ? 'route-shell-map' : ''}`}>
      <div className={`route-content ${isMapRoute ? 'route-content-map' : ''}`}>
        {!hasRouteOwnedNavigation ? <AppTopNavigation className="route-navigation" /> : null}
        <Outlet />
      </div>
    </div>
  )
}

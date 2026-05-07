import { Outlet, useLocation } from 'react-router-dom'
import { AitNavigation } from './ait'

export function MainLayout() {
  const location = useLocation()
  const isMapRoute = location.pathname === '/explore' || location.pathname.startsWith('/explore/')

  return (
    <div className={`route-shell ${isMapRoute ? 'route-shell-map' : ''}`}>
      <div className={`route-content ${isMapRoute ? 'route-content-map' : ''}`}>
        {!isMapRoute ? <AitNavigation className="route-navigation" /> : null}
        <Outlet />
      </div>
    </div>
  )
}

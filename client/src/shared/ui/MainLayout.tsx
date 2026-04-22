import { Outlet, useLocation } from 'react-router-dom'

export function MainLayout() {
  const location = useLocation()
  const isMapRoute = location.pathname.startsWith('/explore')

  return (
    <div className={`route-shell ${isMapRoute ? 'route-shell-map' : ''}`}>
      <div className={`route-content ${isMapRoute ? 'route-content-map' : ''}`}>
        <Outlet />
      </div>
    </div>
  )
}

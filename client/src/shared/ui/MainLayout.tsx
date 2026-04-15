import { Outlet } from 'react-router-dom'
import { FloatingTabBar } from './FloatingTabBar'

export function MainLayout() {
  return (
    <div className="route-shell">
      <div className="route-content">
        <Outlet />
      </div>
      <FloatingTabBar />
    </div>
  )
}

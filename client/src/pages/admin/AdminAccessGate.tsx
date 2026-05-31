import { Navigate, Outlet } from 'react-router-dom'
import { isAdminRole, readAuthSession } from '../../shared/lib/authSession'

export function AdminAccessGate() {
  if (!isAdminRole(readAuthSession()?.role)) {
    return <Navigate replace to="/home" />
  }

  return <Outlet />
}

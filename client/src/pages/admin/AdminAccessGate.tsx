import { Navigate, Outlet } from 'react-router-dom'
import { isAdminRole, readAuthSession } from '../../shared/lib/authSession'

export function AdminAccessGate() {
  const canEnterAdmin = import.meta.env.DEV || isAdminRole(readAuthSession()?.role)

  if (!canEnterAdmin) {
    return <Navigate replace to="/home" />
  }

  return <Outlet />
}

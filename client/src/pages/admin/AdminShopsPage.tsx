import { AdminPage } from '../AdminPage'
import { useAdminOutlet } from './adminOutlet'

export function AdminShopsPage() {
  const { lockAdmin } = useAdminOutlet()

  return <AdminPage initialSection="shops" skipUnlock onLock={lockAdmin} />
}

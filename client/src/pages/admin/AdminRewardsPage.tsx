import { AdminPage } from '../AdminPage'
import { useAdminOutlet } from './adminOutlet'

export function AdminRewardsPage() {
  const { lockAdmin } = useAdminOutlet()

  return <AdminPage initialSection="points" scope="rewards" skipUnlock onLock={lockAdmin} />
}

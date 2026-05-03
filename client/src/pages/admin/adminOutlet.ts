import { useOutletContext } from 'react-router-dom'

export type AdminOutletContext = {
  lockAdmin: () => void
}

export function useAdminOutlet() {
  return useOutletContext<AdminOutletContext>()
}

import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = (path: string) => fs.readFileSync(new URL(path, import.meta.url), 'utf8')
const routerSource = () => source('../src/app/router.tsx')
const adminGateSource = () => source('../src/pages/admin/AdminAccessGate.tsx')
const adminHomeSource = () => source('../src/pages/admin/AdminHomePage.tsx')
const adminShopsSource = () => source('../src/pages/admin/AdminShopsPage.tsx')
const adminRewardsSource = () => source('../src/pages/admin/AdminRewardsPage.tsx')
const adminOutletSource = () => source('../src/pages/admin/adminOutlet.ts')
const adminPageSource = () => source('../src/pages/AdminPage.tsx')
const appCssSource = () => source('../src/App.css')

test('admin routes are split under a shared access gate', () => {
  const router = routerSource()
  const gate = adminGateSource()
  const outlet = adminOutletSource()

  assert.match(router, /path:\s*'\/admin'/)
  assert.match(router, /element:\s*<AdminAccessGate \/>/)
  assert.match(router, /index:\s*true[\s\S]*<AdminHomePage \/>/)
  assert.match(router, /path:\s*'shops'[\s\S]*<AdminShopsPage \/>/)
  assert.match(router, /path:\s*'rewards'[\s\S]*<AdminRewardsPage \/>/)
  assert.match(gate, /<Outlet context=\{\{ lockAdmin \}\} \/>/)
  assert.match(gate, /unlockAdminSession/)
  assert.match(gate, /unlockAdminPreview/)
  assert.match(outlet, /useOutletContext<AdminOutletContext>/)
})

test('admin hub focuses on shop management and point rewards only', () => {
  const home = adminHomeSource()
  const styles = appCssSource()

  assert.match(home, /to="\/admin\/shops"/)
  assert.match(home, /to="\/admin\/rewards"/)
  assert.doesNotMatch(home, /사장님|셀프|사업자|제보/)
  assert.match(styles, /\.admin-hub-grid/)
  assert.match(styles, /\.admin-hub-card/)
})

test('admin subroutes reuse the current admin console by initial section before deeper extraction', () => {
  const shops = adminShopsSource()
  const rewards = adminRewardsSource()
  const adminPage = adminPageSource()

  assert.match(shops, /<AdminPage initialSection="shops" skipUnlock \/>/)
  assert.match(rewards, /<AdminPage initialSection="points" skipUnlock \/>/)
  assert.match(adminPage, /type AdminPageProps/)
  assert.match(adminPage, /initialSection\?: AdminMobileSection/)
  assert.match(adminPage, /skipUnlock\?: boolean/)
  assert.match(adminPage, /useState\(skipUnlock \|\| isAdminUnlocked\(\)\)/)
})

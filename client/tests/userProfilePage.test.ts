import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = (path: string) => fs.readFileSync(new URL(path, import.meta.url), 'utf8')
const routerSource = () => source('../src/app/router.tsx')
const lazyRouteComponentsSource = () => source('../src/app/lazyRouteComponents.tsx')
const homeSource = () => source('../src/pages/HomePage.tsx')
const myPageSource = () => source('../src/pages/MyPage.tsx')
const mainLayoutSource = () => source('../src/shared/ui/MainLayout.tsx')
const appCssSource = () => source('../src/App.css')
const usersApiSource = () => source('../src/shared/api/users.ts')
const shopReviewsApiSource = () => source('../src/shared/api/shopReviews.ts')

test('general users can open their profile from home without admin role', () => {
  const router = routerSource()
  const lazyRoutes = lazyRouteComponentsSource()
  const home = homeSource()
  const mainLayout = mainLayoutSource()
  const styles = appCssSource()

  assert.match(router, /path:\s*'my'[\s\S]*routeElement\(<MyPage \/>/)
  assert.match(lazyRoutes, /export const MyPage = lazy/)
  assert.match(home, /HomeProfileEntry/)
  assert.match(home, /to="\/my"/)
  assert.doesNotMatch(home, /isAdminRole\(readAuthSession\(\)\?\.role\)[\s\S]{0,240}<HomeProfileEntry/)
  assert.match(mainLayout, /location\.pathname === '\/my'/)
  assert.match(mainLayout, /hasRouteOwnedNavigation/)
  assert.match(styles, /\.home-profile-entry-section/)
  assert.match(styles, /\.home-profile-entry-card/)
})

test('my page uses current user swagger endpoints and hides raw session tokens', () => {
  const myPage = myPageSource()
  const styles = appCssSource()
  const usersApi = usersApiSource()
  const shopReviewsApi = shopReviewsApiSource()

  assert.match(usersApi, /export function getMyProfile/)
  assert.match(usersApi, /\/api\/v1\/users\/me/)
  assert.match(usersApi, /export function listMyFavoriteShops/)
  assert.match(usersApi, /\/api\/v1\/users\/me\/favorite-shops/)
  assert.match(shopReviewsApi, /export function listMyReviews/)
  assert.match(shopReviewsApi, /\/api\/v1\/users\/me\/reviews/)

  assert.match(myPage, /getMyProfile/)
  assert.match(myPage, /listMyFavoriteShops/)
  assert.match(myPage, /listMyReviews/)
  assert.match(myPage, /readAuthSession/)
  assert.match(myPage, /className="my-profile-hero"/)
  assert.match(myPage, /className="my-profile-avatar"/)
  assert.match(myPage, /className="my-profile-summary-grid"/)
  assert.match(myPage, /className="my-profile-session-card"/)
  assert.match(myPage, /최근 리뷰/)
  assert.match(myPage, /관심 매장/)
  assert.match(myPage, /세션 상태/)
  assert.doesNotMatch(myPage, /\{session\?\.accessToken\}/)
  assert.doesNotMatch(myPage, /\{session\?\.refreshToken\}/)

  assert.match(styles, /\.my-profile-shell/)
  assert.match(styles, /\.my-profile-hero/)
  assert.match(styles, /\.my-profile-summary-grid/)
  assert.match(styles, /\.my-profile-session-card/)
})

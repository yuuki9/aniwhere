import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import * as homeViewModel from '../src/pages/homeViewModel.ts'

const appCssSource = () => fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

test('homeViewModel keeps home shortcuts as the only runtime builder', () => {
  assert.deepEqual(Object.keys(homeViewModel).sort(), [
    'buildHomeQuickMenus',
    'buildHomeReviewPreviewItems',
    'buildHomeWorkPreviewItems',
  ])
})

test('buildHomeQuickMenus keeps aggregate search terms out of home shortcuts', () => {
  const menus = homeViewModel.buildHomeQuickMenus()

  assert.deepEqual(
    menus.map((menu) => menu.id),
    ['stores', 'reviews'],
  )
  assert.equal(menus[0].href, '/explore')
  assert.deepEqual(
    menus.map((menu) => menu.label),
    ['매장 찾기', '방문 후기'],
  )
  assert.equal(menus.some((menu) => menu.href.startsWith('/search')), false)
  assert.equal(menus.some((menu) => menu.href.startsWith('/admin')), false)
})

test('home quick menu centers the two user-facing shortcuts', () => {
  const styles = appCssSource()

  assert.match(
    styles,
    /\.home-quick-menu\[data-menu-count='2'\]\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(74px, 96px\)\);[\s\S]*justify-content:\s*center;/,
  )
})

test('HomePage uses static user-facing pending cards without live region attributes', () => {
  const source = fs.readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')

  assert.doesNotMatch(source, /AitTop/)
  assert.match(source, /useQuery/)
  assert.match(source, /getWorks/)
  assert.match(source, /getPosts/)
  assert.match(source, /HomeSearchEntry/)
  assert.match(source, /HomeQuickMenuSection/)
  assert.match(source, /작품, 매장명, 지역으로 검색/)
  assert.match(source, /작품으로 매장 찾기/)
  assert.match(source, /최근 방문 후기/)
  assert.match(source, /home-work-carousel/)
  assert.match(source, /home-work-more-card/)
  assert.match(source, />\s*\.\.\.\s*</)
  assert.match(source, /to=\{`\/explore\?workId=\$\{work.id\}&view=list`\}/)
  assert.match(source, /to="\/explore\?view=list"/)
  assert.match(source, /state=\{\{ returnTo: '\/home' \}\}/)
  assert.match(source, /to=\{`\/community\/\$\{post.id\}`\}/)
  assert.doesNotMatch(source, /<em/)
  assert.doesNotMatch(source, /관리자/)
  assert.doesNotMatch(source, /제보/)
  assert.doesNotMatch(source, /API/)
  assert.doesNotMatch(source, /aria-live="polite"/)
  assert.doesNotMatch(source, /role="status"/)
})

test('buildHomeWorkPreviewItems removes duplicate title text and genre metadata', () => {
  const works = homeViewModel.buildHomeWorkPreviewItems([
    {
      id: 1,
      name: '원피스',
      koreanTitle: '원피스',
      titleNative: 'ワンピース',
      genres: ['Action', 'Adventure'],
      coverUrl: 'https://example.com/onepiece.jpg',
      popularity: 100,
    },
    {
      id: 2,
      name: '주술회전',
      titleRomaji: 'Jujutsu Kaisen',
      genres: null,
      coverUrl: null,
      popularity: null,
    },
  ])

  assert.deepEqual(works, [
    {
      id: 1,
      name: '원피스',
      subtitle: null,
      coverUrl: 'https://example.com/onepiece.jpg',
    },
    {
      id: 2,
      name: '주술회전',
      subtitle: 'Jujutsu Kaisen',
      coverUrl: null,
    },
  ])
})

test('buildHomeWorkPreviewItems keeps enough items for a horizontal carousel with a continuation affordance', () => {
  const works = homeViewModel.buildHomeWorkPreviewItems(
    Array.from({ length: 13 }, (_, index) => ({
      id: index + 1,
      name: `작품 ${index + 1}`,
      koreanTitle: null,
      titleNative: null,
      titleRomaji: null,
      titleEnglish: null,
      genres: null,
      coverUrl: null,
      popularity: 100 - index,
    })),
  )

  assert.equal(works.length, 12)
  assert.equal(works.at(-1)?.name, '작품 12')
})

test('home work carousel visually hints that more items continue horizontally', () => {
  const styles = appCssSource()

  assert.match(styles, /\.home-work-rail\s*\{[\s\S]*position:\s*relative;/)
  assert.match(styles, /\.home-work-rail::after\s*\{[\s\S]*linear-gradient\(90deg,\s*rgba\(255,\s*255,\s*255,\s*0\),\s*var\(--ait-color-gray-0\)\);/)
  assert.match(styles, /\.home-work-more-card\s*\{[\s\S]*flex:\s*0 0 76px;/)
  assert.match(styles, /\.home-work-more-dot\s*\{[\s\S]*border-radius:\s*var\(--ait-radius-full\);/)
  assert.match(styles, /\.home-work-copy strong\s*\{[\s\S]*font-size:\s*var\(--ait-font-size-label\);/)
})

test('buildHomeReviewPreviewItems keeps latest posts factual', () => {
  const posts = homeViewModel.buildHomeReviewPreviewItems([
    {
      id: 10,
      title: '홍대 매장 방문 후기',
      content: '굿즈 입고가 많았고 줄은 짧았어요. 다시 방문할 만했습니다.',
      authorNickname: '유키',
      viewCount: 7,
      createdAt: '2026-05-17T12:00:00',
      updatedAt: '2026-05-17T12:00:00',
    },
  ])

  assert.deepEqual(posts, [
    {
      id: 10,
      title: '홍대 매장 방문 후기',
      excerpt: '굿즈 입고가 많았고 줄은 짧았어요. 다시 방문할 만했습니다.',
      authorNickname: '유키',
      createdAt: '2026-05-17T12:00:00',
    },
  ])
})

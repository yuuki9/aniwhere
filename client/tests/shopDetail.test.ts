import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const shopPageSource = () => fs.readFileSync(new URL('../src/pages/ShopPage.tsx', import.meta.url), 'utf8')
const stylesSource = () =>
  [
    '../src/App.css',
    '../src/styles/explore-search.css',
  ]
    .map((path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8'))
    .join('\n')

const cssRuleBodies = (css: string, selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matches = css.matchAll(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, 'g'))

  return Array.from(matches, (match) => match[1])
}

test('ShopPage exposes a heart action wired to the Swagger favorite shop endpoint', () => {
  const source = shopPageSource()
  const styles = stylesSource()

  assert.match(source, /import \{ addFavoriteShop, getShop, removeFavoriteShop \} from '\.\.\/shared\/api\/shops'/)
  assert.match(source, /useMutation/)
  assert.match(source, /favoriteShopMutation/)
  assert.match(source, /mutationFn: \(\{ shopId, nextFavorite \}: \{ shopId: number; nextFavorite: boolean \}\)/)
  assert.match(source, /addFavoriteShop\(shopId\)/)
  assert.match(source, /removeFavoriteShop\(shopId\)/)
  assert.match(source, /setFavoriteState\(\{ shopId: variables\.shopId, isFavorite: nextFavorite \}\)/)
  assert.match(source, /favoriteShopMutation\.mutate\(\{ shopId: shop\.id, nextFavorite: !isFavoriteShop \}\)/)
  assert.match(source, /className="shop-detail-favorite-button"/)
  assert.match(source, /aria-pressed=\{isFavoriteShop\}/)
  assert.match(source, /관심 매장/)
  assert.match(source, /Toast/)
  assert.ok(cssRuleBodies(styles, '.shop-detail-favorite-button').some((rule) => /width:\s*44px;/.test(rule)))
  assert.ok(cssRuleBodies(styles, '.shop-detail-favorite-icon').some((rule) => /stroke:\s*currentcolor;/.test(rule)))
})

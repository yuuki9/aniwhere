import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const shopMapSource = () => fs.readFileSync(new URL('../src/shared/ui/ShopMap.tsx', import.meta.url), 'utf8')

test('ShopMap reports the visible map viewport for map-area search', () => {
  const source = shopMapSource()

  assert.match(source, /type MapViewport/)
  assert.match(source, /onViewportChange/)
  assert.match(source, /getBounds\(\)/)
  assert.match(source, /getCenter\(\)/)
  assert.match(source, /maps\.Event\.addListener\(map, 'idle'/)
})

test('ShopMap keeps the map and zoom controls mounted when a viewport search returns no shops', () => {
  const source = shopMapSource()

  assert.doesNotMatch(source, /validShops\.length === 0 && !userLocation[\s\S]*?return \(/)
  assert.match(source, /<div className="map-naver" ref=\{containerRef\} \/>/)
  assert.match(source, /className="map-zoom-control"/)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const shopMapSource = () => fs.readFileSync(new URL('../src/shared/ui/ShopMap.tsx', import.meta.url), 'utf8')
const appCssSource = () => fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

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

test('ShopMap defers marker regrouping until map idle instead of every zoom event', () => {
  const source = shopMapSource()

  assert.match(source, /const \[markerZoom, setMarkerZoom\] = useState\(INITIAL_ZOOM\)/)
  assert.match(source, /buildMarkerGroups\(validShops, markerZoom, activeShopId\)/)
  assert.match(source, /const nextViewport = readMapViewport\(map\)/)
  assert.match(source, /setMarkerZoom\(\(previousZoom\) => \(previousZoom === nextViewport\.zoom \? previousZoom : nextViewport\.zoom\)\)/)
  assert.match(source, /map\.getZoom\(\) \+ 2/)
  assert.doesNotMatch(source, /buildMarkerGroups\(validShops, currentZoom, activeShopId\)/)
  assert.doesNotMatch(source, /\}, \[activeShopId, currentZoom, mapInitialized, markerGroups\]\)/)
})

test('ShopMap publishes viewport changes only when the map moved meaningfully', () => {
  const source = shopMapSource()

  assert.match(source, /const VIEWPORT_COORDINATE_EPSILON = /)
  assert.match(source, /function shouldPublishViewportChange\(previous: MapViewport \| null, next: MapViewport\)/)
  assert.match(source, /const lastPublishedViewportRef = useRef<MapViewport \| null>\(null\)/)
  assert.match(source, /if \(shouldPublishViewportChange\(lastPublishedViewportRef\.current, nextViewport\)\) \{/)
  assert.match(source, /lastPublishedViewportRef\.current = nextViewport/)
  assert.match(source, /onViewportChangeRef\.current\?\.\(nextViewport\)/)
  assert.doesNotMatch(source, /onViewportChangeRef\.current\?\.\(readMapViewport\(map\)\)/)
})

test('ShopMap renders shop names as chip markers and keeps clusters as count chips', () => {
  const source = shopMapSource()
  const styles = appCssSource()

  assert.match(source, /const SHOP_MARKER_LABEL_MAX_LENGTH = /)
  assert.match(source, /function escapeMarkerLabel/)
  assert.match(source, /function getShopMarkerLabel\(shop: Shop\)/)
  assert.match(source, /function createShopMarkerIcon\(shop: Shop, isActive: boolean\)/)
  assert.match(source, /function createClusterMarkerIcon\(count: number\)/)
  assert.match(source, /class="map-naver-shop-chip/)
  assert.match(source, /class="map-naver-cluster-chip/)
  assert.match(source, /icon: createShopMarkerIcon\(group\.shop, isActive\)/)
  assert.match(source, /icon: createClusterMarkerIcon\(group\.shops\.length\)/)
  assert.doesNotMatch(source, /createMarkerIcon\(\s*`map-naver-marker/)
  assert.doesNotMatch(source, /createMarkerIcon\('map-naver-cluster-marker'/)

  assert.match(styles, /\.map-naver-shop-chip/)
  assert.match(styles, /\.map-naver-shop-chip-active/)
  assert.match(styles, /\.map-naver-cluster-chip/)
  assert.doesNotMatch(styles, /\.map-naver-cluster-marker\s*\{/)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('Toss banner ad IDs prefer test IDs on Apps in Toss console preview paths', () => {
  const source = fs.readFileSync(new URL('../src/shared/lib/tossAds.ts', import.meta.url), 'utf8')

  assert.match(source, /VITE_TOSS_AD_BANNER_GROUP_ID/)
  assert.match(source, /VITE_TOSS_AD_USE_TEST_IDS/)
  assert.match(source, /VITE_TOSS_AD_USE_LIVE_IDS/)
  assert.match(source, /VITE_TOSS_AD_USE_MOCK_BANNER/)
  assert.match(source, /mockAdBanner/)
  assert.match(source, /aniwhere-mock-ad-banner/)
  assert.match(source, /getAppsInTossOperationalEnvironment/)
  assert.match(source, /runtimeEnvironment === 'sandbox'/)
  assert.match(source, /private-apps\.tossmini\.com/)
  assert.match(source, /isAppsInTossConsolePreviewHost\(getCurrentHostname\(\)\)/)
  assert.match(source, /ait-ad-test-banner-id/)
  assert.match(source, /ait\.v2\.live\.c081b1ff483d4815/)
  assert.ok(source.indexOf("VITE_TOSS_AD_USE_TEST_IDS") < source.indexOf("VITE_TOSS_AD_USE_LIVE_IDS"))
  assert.ok(source.indexOf("VITE_TOSS_AD_USE_LIVE_IDS") < source.indexOf("runtimeEnvironment === 'sandbox'"))
  assert.ok(source.indexOf("runtimeEnvironment === 'sandbox'") < source.lastIndexOf('getConfiguredOrDefaultAdGroupId'))
})

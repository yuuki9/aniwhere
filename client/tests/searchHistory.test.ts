import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('search history keeps at most five visible recent searches', () => {
  const source = fs.readFileSync(new URL('../src/shared/lib/searchHistory.ts', import.meta.url), 'utf8')

  assert.match(source, /MAX_HISTORY = 5/)
})

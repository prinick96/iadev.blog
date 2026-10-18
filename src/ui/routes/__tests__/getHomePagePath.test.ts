import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getHomePagePath } from '@/ui/routes/getHomePagePath'

test('uses the home path for the first page without a numbered duplicate', () => {
  assert.equal(getHomePagePath(1), '/')
})

test('builds the second page path with a trailing slash', () => {
  assert.equal(getHomePagePath(2), '/page/2/')
})

test('builds paths for page numbers with multiple digits', () => {
  assert.equal(getHomePagePath(12), '/page/12/')
})

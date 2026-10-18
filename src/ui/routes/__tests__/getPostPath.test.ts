import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getPostPath } from '@/ui/routes/getPostPath'

test('builds a post path with a trailing slash', () => {
  assert.equal(getPostPath('un-articulo'), '/posts/un-articulo/')
})

test('preserves separators in identifiers with multiple segments', () => {
  assert.equal(getPostPath('archivo/un-articulo'), '/posts/archivo/un-articulo/')
})

test('encodes each segment without treating identifier characters as URL components', () => {
  assert.equal(getPostPath('opinión/IA sin criterio?#'), '/posts/opini%C3%B3n/IA%20sin%20criterio%3F%23/')
})

test('encodes percent signs instead of interpreting them as escape sequences', () => {
  assert.equal(getPostPath('100% automatizado'), '/posts/100%25%20automatizado/')
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getCategoryPath } from '@/ui/routes/getCategoryPath'

test('builds a category path with a trailing slash', () => {
  assert.equal(getCategoryPath('inteligencia-artificial'), '/categories/inteligencia-artificial/')
})

test('encodes identifiers without interpreting URL components', () => {
  assert.equal(getCategoryPath('opinión?#'), '/categories/opini%C3%B3n%3F%23/')
  assert.equal(getCategoryPath('100% IA'), '/categories/100%25%20IA/')
  assert.equal(getCategoryPath('nested/category'), '/categories/nested%2Fcategory/')
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getFooterNavigationState } from '@/ui/layouts/BaseLayout/components/Footer/utils/getFooterNavigationState'

test('marks only home as the current page at the root path', () => {
  assert.deepEqual(getFooterNavigationState('/'), {
    homeCurrent: 'page',
    categoriesCurrent: undefined,
    publishingGuideCurrent: undefined,
  })
})

test('preserves the home fallback for an empty pathname', () => {
  assert.deepEqual(getFooterNavigationState(''), {
    homeCurrent: 'page',
    categoriesCurrent: undefined,
    publishingGuideCurrent: undefined,
  })
})

test('marks the categories index as the current page with or without a trailing slash', () => {
  for (const pathname of ['/categories', '/categories/']) {
    assert.deepEqual(getFooterNavigationState(pathname), {
      homeCurrent: undefined,
      categoriesCurrent: 'page',
      publishingGuideCurrent: undefined,
    })
  }
})

test('marks category detail pages as the current location with or without a trailing slash', () => {
  for (const pathname of ['/categories/example', '/categories/example/', '/categories/example/nested/']) {
    assert.deepEqual(getFooterNavigationState(pathname), {
      homeCurrent: undefined,
      categoriesCurrent: 'location',
      publishingGuideCurrent: undefined,
    })
  }
})

test('marks only the publishing guide as the current page with or without a trailing slash', () => {
  for (const pathname of ['/guia-publicar', '/guia-publicar/']) {
    assert.deepEqual(getFooterNavigationState(pathname), {
      homeCurrent: undefined,
      categoriesCurrent: undefined,
      publishingGuideCurrent: 'page',
    })
  }
})

test('leaves all links inactive on unrelated pages including paginated home pages', () => {
  for (const pathname of ['/posts/example/', '/page/2/', '/404/', '/rss.xml']) {
    assert.deepEqual(getFooterNavigationState(pathname), {
      homeCurrent: undefined,
      categoriesCurrent: undefined,
      publishingGuideCurrent: undefined,
    })
  }
})

test('does not match routes that only share a navigation prefix', () => {
  for (const pathname of [
    '/categories-other/',
    '/categoriesexample/',
    '/guia-publicar-other/',
    '/guia-publicar/example/',
  ]) {
    assert.deepEqual(getFooterNavigationState(pathname), {
      homeCurrent: undefined,
      categoriesCurrent: undefined,
      publishingGuideCurrent: undefined,
    })
  }
})

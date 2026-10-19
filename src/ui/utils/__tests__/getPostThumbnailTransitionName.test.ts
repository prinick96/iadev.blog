import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getPostThumbnailTransitionName } from '@/ui/utils/getPostThumbnailTransitionName'

test('returns a stable CSS identifier for a post thumbnail', () => {
  assert.equal(getPostThumbnailTransitionName('example'), 'post-thumbnail-6578616d706c65')
  assert.equal(getPostThumbnailTransitionName('example'), getPostThumbnailTransitionName('example'))
})

test('encodes UTF-8 bytes as two-digit hexadecimal values', () => {
  assert.equal(getPostThumbnailTransitionName('á'), 'post-thumbnail-c3a1')
  assert.equal(getPostThumbnailTransitionName('\u0001A'), 'post-thumbnail-0141')
})

test('supports nested paths, punctuation and Unicode without invalid CSS characters', () => {
  for (const postId of ['guides/astro', '2026-post', 'a.b', 'a b', 'artículo', '記事', '🤖']) {
    assert.match(getPostThumbnailTransitionName(postId), /^post-thumbnail-[a-f0-9]+$/)
  }
})

test('keeps names distinct for post IDs that could collide after normalization', () => {
  const postIds = ['a/b', 'a-b', 'a_b', 'a.b', 'a b', 'article', 'Article', 'artículo', 'articulo', '🤖', '🚀']
  const names = postIds.map(getPostThumbnailTransitionName)

  assert.equal(new Set(names).size, postIds.length)
})

test('returns a valid identifier even for an empty ID', () => {
  assert.equal(getPostThumbnailTransitionName(''), 'post-thumbnail-')
})

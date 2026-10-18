import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ImageMetadata } from 'astro'
import { AUTHORS_ASSETS_PATH, POSTS_ASSETS_PATH } from '@/ui/constants/assets'
import { resolveImage } from '@/ui/utils/resolveImage'

test('returns the local SVG image metadata for an existing path', () => {
  const image: ImageMetadata = { src: '/_astro/thumbnail.svg', width: 192, height: 192, format: 'svg' }
  const path = `${POSTS_ASSETS_PATH}/first-post/thumbnail.svg`

  assert.equal(resolveImage({ [path]: image }, path), image)
})

test('returns the fixed fallback when the image path is missing', () => {
  const image: ImageMetadata = { src: '/_astro/thumbnail.svg', width: 192, height: 192, format: 'svg' }
  const images = { [`${POSTS_ASSETS_PATH}/first-post/thumbnail.svg`]: image }

  assert.equal(
    resolveImage(images, `${POSTS_ASSETS_PATH}/missing-post/thumbnail.svg`),
    'https://placehold.co/192x192/1f2127/8a8986.webp?text=vibras'
  )
})

test('returns the fixed fallback for an empty image map', () => {
  assert.equal(
    resolveImage({}, `${POSTS_ASSETS_PATH}/first-post/thumbnail.svg`),
    'https://placehold.co/192x192/1f2127/8a8986.webp?text=vibras'
  )
})

test('uses the requested square size for a missing image fallback', () => {
  assert.equal(
    resolveImage({}, `${AUTHORS_ASSETS_PATH}/guest/avatar.webp`, 96),
    'https://placehold.co/96x96/1f2127/8a8986.webp?text=vibras'
  )
})

test('preserves local image metadata when a fallback size is provided', () => {
  const image: ImageMetadata = { src: '/_astro/avatar.webp', width: 192, height: 192, format: 'webp' }
  const path = `${AUTHORS_ASSETS_PATH}/prinick/avatar.webp`

  assert.strictEqual(resolveImage({ [path]: image }, path, 96), image)
})

test('resolves exact paths containing nested post identifiers', () => {
  const image: ImageMetadata = { src: '/_astro/nested-thumbnail.svg', width: 192, height: 192, format: 'svg' }
  const postId = 'guides/astro/static-images'
  const path = `${POSTS_ASSETS_PATH}/${postId}/thumbnail.svg`

  assert.equal(resolveImage({ [path]: image }, path), image)
})

test('resolves author avatar paths with the same image map contract', () => {
  const image: ImageMetadata = { src: '/_astro/avatar.webp', width: 96, height: 96, format: 'webp' }
  const path = `${AUTHORS_ASSETS_PATH}/prinick/avatar.webp`

  assert.equal(resolveImage({ [path]: image }, path), image)
})

test('does not mutate the image map or its metadata for existing or missing paths', () => {
  const image: ImageMetadata = Object.freeze({
    src: '/_astro/thumbnail.svg',
    width: 192,
    height: 192,
    format: 'svg',
  })
  const path = `${POSTS_ASSETS_PATH}/first-post/thumbnail.svg`
  const images = Object.freeze({ [path]: image })
  const originalImages = structuredClone(images)

  resolveImage(images, path)
  resolveImage(images, `${POSTS_ASSETS_PATH}/missing-post/thumbnail.svg`)

  assert.deepEqual(images, originalImages)
  assert.equal(images[path], image)
})

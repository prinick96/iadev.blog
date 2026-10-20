import { beforeEach, expect, mock, test } from 'bun:test'
import assert from 'node:assert/strict'
import type { GetImageResult, ImageMetadata, ImageTransform } from 'astro'
import { AUTHORS_ASSETS_PATH } from '@/ui/constants/assets'

const formats: ImageMetadata['format'][] = ['jpg', 'jpeg', 'png', 'tiff', 'webp', 'gif', 'svg', 'avif']
const images: Record<string, ImageMetadata> = {}
for (const format of formats) {
  images[`${AUTHORS_ASSETS_PATH}/guest/avatar.${format}`] = Object.freeze({
    src: `/_astro/avatar.${format}`,
    width: 400,
    height: 400,
    format,
  })
}
Object.freeze(images)

const imageResult: GetImageResult = {
  src: '/_astro/optimized-avatar.png',
  srcSet: { values: [], attribute: '' },
  attributes: { width: 96, height: 96, alt: '', loading: 'lazy' },
  options: { src: '/_astro/avatar.png' },
  rawOptions: { src: '/_astro/avatar.png' },
}
const getImageMock = mock<(options: ImageTransform) => Promise<GetImageResult>>()

mock.module('astro:assets', () => ({ getImage: getImageMock }))
mock.module('@/ui/pages/Post/components/AuthorInfo/constants', () => ({ AUTHOR_IMAGES: images }))

const { getAuthorAvatar } = await import('@/ui/pages/Post/components/AuthorInfo/utils/getAuthorAvatar')

beforeEach(() => {
  getImageMock.mockReset()
  getImageMock.mockResolvedValue(imageResult)
})

test.each(formats)('optimizes a local %s avatar while preserving its source format', async (format) => {
  const original = structuredClone(images)

  const result = await getAuthorAvatar(`guest/avatar.${format}`)

  expect(result).toBe(imageResult)
  expect(getImageMock.mock.calls).toEqual([
    [
      {
        src: images[`${AUTHORS_ASSETS_PATH}/guest/avatar.${format}`],
        alt: '',
        width: 96,
        height: 96,
        format,
        loading: 'lazy',
      },
    ],
  ])
  expect(images).toEqual(original)
})

test.each([undefined, '', 'guest/missing.png'])(
  'uses the WebP fallback when the avatar is unavailable: %s',
  async (avatar) => {
    expect(await getAuthorAvatar(avatar)).toBe(imageResult)
    expect(getImageMock.mock.calls).toEqual([
      [
        {
          src: 'https://placehold.co/192x192/1f2127/8a8986.webp?text=vibras',
          alt: '',
          width: 96,
          height: 96,
          format: 'webp',
          loading: 'lazy',
        },
      ],
    ])
  }
)

test('propagates image optimization errors without replacing them', async () => {
  const error = new Error('No se pudo optimizar el avatar.')
  getImageMock.mockRejectedValue(error)

  await assert.rejects(getAuthorAvatar('guest/avatar.png'), (cause: unknown) => cause === error)
  expect(getImageMock).toHaveBeenCalledTimes(1)
})

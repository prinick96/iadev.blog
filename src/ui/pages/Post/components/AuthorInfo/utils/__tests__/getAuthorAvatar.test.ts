import { afterEach, beforeEach, expect, mock, spyOn, test } from 'bun:test'
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
let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>>

beforeEach(() => {
  fetchSpy = spyOn(globalThis, 'fetch')
  fetchSpy.mockRejectedValue(new Error('Avatar resolution must not make build-time requests'))
  getImageMock.mockReset()
  getImageMock.mockResolvedValue(imageResult)
})

afterEach(() => {
  fetchSpy.mockRestore()
})

test.each(formats)('optimizes a local %s avatar while preserving its source format', async (format) => {
  const original = structuredClone(images)

  const result = await getAuthorAvatar('guest', `guest/avatar.${format}`)

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
  expect(fetchSpy).not.toHaveBeenCalled()
})

test.each([undefined, '', 'guest/missing.png'])(
  'uses GitHub as the only fallback even for the default author: %s',
  async (avatar) => {
    expect(await getAuthorAvatar('default', avatar)).toBe(imageResult)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(getImageMock.mock.calls).toEqual([
      [
        {
          src: 'https://github.com/default.png?size=192',
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

test.each([undefined, '', 'guest/missing.png'])(
  'uses the GitHub avatar when the local image is unavailable: %s',
  async (avatar) => {
    expect(await getAuthorAvatar('guest', avatar)).toBe(imageResult)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(getImageMock.mock.calls).toEqual([
      [
        {
          src: 'https://github.com/guest.png?size=192',
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

test('preserves the local avatar of the default author without using GitHub', async () => {
  await getAuthorAvatar('default', 'guest/avatar.png')

  expect(getImageMock.mock.calls[0]?.[0].src).toBe(images[`${AUTHORS_ASSETS_PATH}/guest/avatar.png`])
})

test('propagates image optimization errors without replacing them', async () => {
  const error = new Error('No se pudo optimizar el avatar.')
  getImageMock.mockRejectedValue(error)

  await assert.rejects(getAuthorAvatar('guest', 'guest/avatar.png'), (cause: unknown) => cause === error)
  expect(getImageMock).toHaveBeenCalledTimes(1)
})

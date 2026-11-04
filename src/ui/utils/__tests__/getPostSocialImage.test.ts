import { describe, expect, test } from 'bun:test'
import type { ImageMetadata } from 'astro'
import { POSTS_ASSETS_PATH } from '@/ui/constants/assets'
import { getPostSocialImage } from '@/ui/utils/getPostSocialImage'

const image: ImageMetadata = { src: '/_astro/social.example.jpg', width: 1440, height: 720, format: 'jpg' }
const extensions: ImageMetadata['format'][] = ['jpg', 'jpeg', 'png', 'apng', 'tiff', 'webp', 'gif', 'svg', 'avif']

describe('getPostSocialImage', () => {
  test.each(extensions)('returns the original image metadata for social.%s', (extension) => {
    const original = { ...image, format: extension }
    const images = { [`${POSTS_ASSETS_PATH}/example/social.${extension}`]: original }

    expect(getPostSocialImage(images, 'example')).toBe(original)
  })

  test('returns undefined when there are no images', () => {
    expect(getPostSocialImage({}, 'example')).toBeUndefined()
  })

  test('does not use thumbnails, other basenames, other posts or child folders', () => {
    const images = {
      [`${POSTS_ASSETS_PATH}/example/thumbnail.svg`]: image,
      [`${POSTS_ASSETS_PATH}/example/social-preview.jpg`]: image,
      [`${POSTS_ASSETS_PATH}/example/Social.jpg`]: image,
      [`${POSTS_ASSETS_PATH}/example/social.jpg.backup`]: image,
      [`${POSTS_ASSETS_PATH}/example-other/social.jpg`]: image,
      [`${POSTS_ASSETS_PATH}/other/social.jpg`]: image,
      [`${POSTS_ASSETS_PATH}/example/child/social.jpg`]: image,
      [`${POSTS_ASSETS_PATH}/example/social.jpg/child.jpg`]: image,
    }

    expect(getPostSocialImage(images, 'example')).toBeUndefined()
  })

  test('resolves nested identifiers with spaces and Unicode without normalizing them', () => {
    const postId = 'series/opinión sobre IA'
    const images = { [`${POSTS_ASSETS_PATH}/${postId}/social.webp`]: image }

    expect(getPostSocialImage(images, postId)).toBe(image)
    expect(getPostSocialImage(images, 'opinión sobre IA')).toBeUndefined()
  })

  test('uses the file identifier rather than the public slug', () => {
    const images = { [`${POSTS_ASSETS_PATH}/original-file/social.jpg`]: image }

    expect(getPostSocialImage(images, 'original-file')).toBe(image)
    expect(getPostSocialImage(images, 'public-slug')).toBeUndefined()
  })

  test('fails with the post and conflicting paths when multiple social images exist', () => {
    const first = `${POSTS_ASSETS_PATH}/example/social.jpg`
    const second = `${POSTS_ASSETS_PATH}/example/social.png`
    const images = { [first]: image, [second]: { ...image, format: 'png' as const } }

    expect(() => getPostSocialImage(images, 'example')).toThrow(
      `El artículo "example" tiene varias imágenes sociales: ${first}, ${second}. ` +
        'Deja un único archivo social.* en la carpeta del artículo.'
    )
  })

  test('does not treat social images in parent or child directories as duplicates', () => {
    const images = {
      [`${POSTS_ASSETS_PATH}/example/social.jpg`]: image,
      [`${POSTS_ASSETS_PATH}/example/child/social.png`]: { ...image, format: 'png' as const },
    }

    expect(getPostSocialImage(images, 'example')).toBe(image)
    expect(getPostSocialImage(images, 'example/child')).toBe(images[`${POSTS_ASSETS_PATH}/example/child/social.png`])
  })

  test('does not mutate the image map or its metadata', () => {
    const images = { [`${POSTS_ASSETS_PATH}/example/social.jpg`]: { ...image } }
    const before = structuredClone(images)

    getPostSocialImage(images, 'example')

    expect(images).toStrictEqual(before)
  })
})

import type { ImageMetadata } from 'astro'

export const POST_THUMBNAIL_IMAGES = import.meta.glob<ImageMetadata>('/src/ui/assets/posts/**/thumbnail.webp', {
  eager: true,
  import: 'default',
})

export const POST_THUMBNAIL_IMAGE_OPTIONS = {
  alt: '',
  width: 192,
  height: 192,
  format: 'webp',
}

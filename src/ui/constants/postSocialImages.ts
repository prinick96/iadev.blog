import type { ImageMetadata } from 'astro'

export const POST_SOCIAL_IMAGES = import.meta.glob<ImageMetadata>(
  '/src/ui/assets/posts/**/social.{jpg,jpeg,png,apng,tiff,webp,gif,svg,avif}',
  {
    eager: true,
    import: 'default',
  }
)

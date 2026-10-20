import type { ImageMetadata } from 'astro'

export const AUTHOR_IMAGES = import.meta.glob<ImageMetadata>(
  '/src/ui/assets/authors/**/*.{jpg,jpeg,png,tiff,webp,gif,svg,avif}',
  {
    eager: true,
    import: 'default',
  }
)

import type { ImageMetadata } from 'astro'

export function resolveImage(
  images: Record<string, ImageMetadata>,
  path?: string,
  sizes = 192
): ImageMetadata | string {
  if (path && images[path]) {
    return images[path]
  }

  return `https://placehold.co/${sizes}x${sizes}/1f2127/8a8986.webp?text=vibras`
}

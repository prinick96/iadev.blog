import type { ImageMetadata } from 'astro'
import { POSTS_ASSETS_PATH } from '@/ui/constants/assets'

export function getPostSocialImage(
  images: Readonly<Record<string, ImageMetadata>>,
  postId: string
): ImageMetadata | undefined {
  const directory = `${POSTS_ASSETS_PATH}/${postId}`
  const matches = Object.entries(images).filter(([path]) => {
    const separator = path.lastIndexOf('/')

    return path.slice(0, separator) === directory && /^social\.[^./]+$/u.test(path.slice(separator + 1))
  })

  if (matches.length > 1) {
    throw new Error(
      `El artículo "${postId}" tiene varias imágenes sociales: ${matches.map(([path]) => path).join(', ')}. ` +
        'Deja un único archivo social.* en la carpeta del artículo.'
    )
  }

  return matches[0]?.[1]
}

import { getImage } from 'astro:assets'
import type { GetImageResult, ImageTransform } from 'astro'
import { AUTHORS_ASSETS_PATH } from '@/ui/constants/assets'
import { AUTHOR_IMAGES } from '@/ui/pages/Post/components/AuthorInfo/constants'
import { resolveImage } from '@/ui/utils/resolveImage'

export async function getAuthorAvatar(avatar?: string): Promise<GetImageResult> {
  const avatarPath = avatar ? `${AUTHORS_ASSETS_PATH}/${avatar}` : undefined
  const imageSource = resolveImage(AUTHOR_IMAGES, avatarPath)
  const imageOptions: ImageTransform = {
    src: imageSource,
    alt: '',
    width: 96,
    height: 96,
    format: 'webp',
    loading: 'lazy',
  }

  if (typeof imageSource !== 'string') {
    imageOptions.format = imageSource.format
  }

  return await getImage(imageOptions)
}

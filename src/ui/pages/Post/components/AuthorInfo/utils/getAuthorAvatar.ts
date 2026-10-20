import { getImage } from 'astro:assets'
import type { GetImageResult, ImageTransform } from 'astro'
import { GITHUB_URL } from '@/core/constants/github'
import { AUTHORS_ASSETS_PATH } from '@/ui/constants/assets'
import { AUTHOR_IMAGES } from '@/ui/pages/Post/components/AuthorInfo/constants'

export async function getAuthorAvatar(authorId: string, avatar?: string): Promise<GetImageResult> {
  const avatarPath = avatar ? `${AUTHORS_ASSETS_PATH}/${avatar}` : undefined
  const localImage = avatarPath ? AUTHOR_IMAGES[avatarPath] : undefined
  const imageSource = localImage ?? `${GITHUB_URL}/${encodeURIComponent(authorId)}.png?size=192`
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

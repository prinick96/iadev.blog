import type { APIContext } from 'astro'
import { getPostsService } from '@/core/logic/posts/services/index'
import regularFont from '@/ui/assets/fonts/ibm-plex-mono/ibm-plex-mono-latin-400-normal.woff2?inline'
import boldFont from '@/ui/assets/fonts/ibm-plex-mono/ibm-plex-mono-latin-700-normal.woff2?inline'
import regularExtendedFont from '@/ui/assets/fonts/ibm-plex-mono/ibm-plex-mono-latin-ext-400-normal.woff2?inline'
import boldExtendedFont from '@/ui/assets/fonts/ibm-plex-mono/ibm-plex-mono-latin-ext-700-normal.woff2?inline'
import { POSTS_ASSETS_PATH } from '@/ui/constants/assets'
import { POST_SOCIAL_IMAGES } from '@/ui/constants/postSocialImages'
import { POST_THUMBNAIL_SOURCES } from '@/ui/constants/postThumbnailSources'
import type { SocialImageFonts, SocialImageInput } from '@/ui/types/socialImage'
import { getPostSocialImage } from '@/ui/utils/getPostSocialImage'
import { renderSocialImage } from '@/ui/utils/renderSocialImage'

const fonts: SocialImageFonts = {
  regular: [regularFont, regularExtendedFont].map((font) => Buffer.from(font.slice(font.indexOf(',') + 1), 'base64')),
  bold: [boldFont, boldExtendedFont].map((font) => Buffer.from(font.slice(font.indexOf(',') + 1), 'base64')),
}

export const getStaticPaths = async () => {
  const posts = await getPostsService.execute()

  return posts
    .filter(({ id }) => !getPostSocialImage(POST_SOCIAL_IMAGES, id))
    .map(({ id, title }) => ({
      params: { image: `posts/${id}` },
      props: {
        title,
        thumbnail: POST_THUMBNAIL_SOURCES[`${POSTS_ASSETS_PATH}/${id}/thumbnail.svg`],
      },
    }))
}

export async function GET({ props }: APIContext<SocialImageInput>): Promise<Response> {
  const image = await renderSocialImage(props, fonts)

  return new Response(new Uint8Array(image), {
    headers: { 'Content-Type': 'image/png' },
  })
}

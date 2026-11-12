import rss from '@astrojs/rss'
import type { APIRoute } from 'astro'
import { getCategoriesService } from '@/core/logic/categories/services/index'
import { getPostSourcesService } from '@/core/logic/posts/services/index'
import { site } from '@/ui/config/site'
import { POST_SOCIAL_IMAGES } from '@/ui/constants/postSocialImages'
import { getRssOptions } from '@/ui/utils/getRssOptions'

export const GET: APIRoute = async () => {
  const [posts, categories] = await Promise.all([getPostSourcesService.execute(), getCategoriesService.execute()])

  return rss(getRssOptions({ posts, categories, images: POST_SOCIAL_IMAGES, site }))
}

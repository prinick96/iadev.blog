import rss from '@astrojs/rss'
import type { APIRoute } from 'astro'
import { getPostsService } from '@/core/logic/posts/services/index'
import { site } from '@/ui/config/site'
import { getPostPath } from '@/ui/routes/getPostPath'

export const GET: APIRoute = async () => {
  const posts = await getPostsService.execute()

  return rss({
    title: site.title,
    description: site.description,
    site: site.url,
    items: posts.map((post) => ({
      title: post.title,
      description: post.description,
      pubDate: post.published_at,
      link: getPostPath(post.id),
    })),
    customData: '<language>es</language>',
  })
}

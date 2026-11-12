import type { RSSOptions } from '@astrojs/rss'
import type { ImageMetadata } from 'astro'
import type { Category } from '@/core/logic/categories/domain/Category'
import type { PostSource } from '@/core/logic/posts/domain/PostSource'
import { getPostPath } from '@/ui/routes/getPostPath'
import { getSocialImagePath } from '@/ui/routes/getSocialImagePath'
import { paths } from '@/ui/routes/paths'
import { getPostSocialImage } from '@/ui/utils/getPostSocialImage'

type RssOptionsInput = {
  posts: readonly (PostSource & { rendered?: { html: string } })[]
  categories: readonly Category[]
  images: Readonly<Record<string, ImageMetadata>>
  site: { title: string; description: string; url: string }
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function getRssOptions({ posts, categories, images, site }: RssOptionsInput): RSSOptions {
  const feedUrl = new URL(paths.rss, site.url).href

  return {
    title: site.title,
    description: site.description,
    site: site.url,
    xmlns: {
      content: 'http://purl.org/rss/1.0/modules/content/',
      media: 'http://search.yahoo.com/mrss/',
      atom: 'http://www.w3.org/2005/Atom',
    },
    customData:
      '<language>es</language>' + `<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>`,
    items: posts
      .toSorted((a, b) => b.data.published_at.getTime() - a.data.published_at.getTime())
      .map((post) => {
        if (!post.rendered) {
          throw new Error(`Missing rendered HTML for post "${post.id}".`)
        }

        const imagePath = getPostSocialImage(images, post.id)?.src ?? getSocialImagePath(post.id)
        const imageUrl = new URL(imagePath, site.url).href

        return {
          title: post.data.title,
          description: post.data.description,
          pubDate: post.data.published_at,
          link: getPostPath(post.id),
          content: post.rendered.html,
          customData: `<media:content medium="image" url="${escapeXml(imageUrl)}"/>`,
          categories: categories
            .filter((category) => post.data.categories?.some((reference) => reference.id === category.id))
            .map((category) => category.name),
        }
      }),
  }
}

import { describe, expect, test } from 'bun:test'
import type { Author } from '@/core/logic/authors/domain/Author'
import type { Post } from '@/core/logic/posts/domain/Post'
import { site } from '@/ui/config/site'
import { getSeoMetadata } from '@/ui/layouts/BaseLayout/components/SeoMetadata/utils/getSeoMetadata'

const siteTitle = `${site.title} - ${site.subtitle}`
const fallbackImage = { src: '/_astro/iadev.example.png', width: 1280, height: 640 }
const post: Post = {
  id: 'example',
  title: 'Senior por suscripción',
  description: 'La experiencia ahora se factura por mes.',
  author_id: 'author-handle',
  category_ids: [],
  reading_time_minutes: 3,
  token_count: 1200,
  pinned: false,
  published_at: new Date('2026-10-18T00:00:00Z'),
}
const author: Author = { id: 'author-handle', name: 'An author', bio: 'Software Engineer' }

describe('getSeoMetadata', () => {
  test.each([undefined, ''])('uses the site title and fallback image when the title is %j', (title) => {
    const result = getSeoMetadata({ pathname: '/', title, description: site.description, fallbackImage })

    expect(result.pageTitle).toBe(siteTitle)
    expect(result.socialTitle).toBe(siteTitle)
    expect(result.canonical).toBe(new URL('/', site.url).href)
    expect(result.image).toEqual({
      url: new URL(fallbackImage.src, site.url).href,
      width: 1280,
      height: 640,
      alt: siteTitle,
    })
    expect(result.structuredData['@graph'].map((node) => node['@type'])).toEqual(['WebSite', 'WebPage'])
  })

  test('keeps the full page title separate from the shorter social title', () => {
    const result = getSeoMetadata({
      pathname: '/categories/',
      title: 'Categorías',
      description: 'Artículos por tema.',
      fallbackImage,
    })

    expect(result.pageTitle).toBe(`Categorías | ${site.title}`)
    expect(result.socialTitle).toBe('Categorías')
    expect(result.canonical).toBe(new URL('/categories/', site.url).href)
    expect(result.structuredData['@graph'][1]).toMatchObject({
      name: result.pageTitle,
      description: 'Artículos por tema.',
    })
  })

  test('uses the generated article image and connects it to the article structured data', () => {
    const result = getSeoMetadata({
      pathname: '/posts/example/',
      title: post.title,
      description: post.description,
      article: { post, author },
      fallbackImage,
    })

    expect(result.pageTitle).toBe(`${post.title} | ${site.title}`)
    expect(result.socialTitle).toBe(post.title)
    expect(result.image).toEqual({
      url: new URL('/social/posts/example.png', site.url).href,
      width: 1200,
      height: 630,
      alt: `${post.title} — ${site.title}`,
    })
    expect(result.structuredData['@graph'][2]).toMatchObject({
      '@type': 'BlogPosting',
      headline: post.title,
      url: result.canonical,
      image: { url: result.image.url, width: 1200, height: 630 },
    })
  })

  test('preserves encoded canonical paths', () => {
    const result = getSeoMetadata({
      pathname: '/posts/archivo/opini%C3%B3n/',
      description: post.description,
      fallbackImage,
    })

    expect(result.canonical).toBe(new URL('/posts/archivo/opini%C3%B3n/', site.url).href)
  })

  test('does not modify the article, author or fallback image', () => {
    const input = structuredClone({
      pathname: '/posts/example/',
      title: post.title,
      description: post.description,
      article: { post, author },
      fallbackImage,
    })
    const before = structuredClone(input)

    getSeoMetadata(input)

    expect(input).toStrictEqual(before)
  })
})

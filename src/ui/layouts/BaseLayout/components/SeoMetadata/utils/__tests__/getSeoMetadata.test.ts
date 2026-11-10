import { describe, expect, test } from 'bun:test'
import type { Author } from '@/core/logic/authors/domain/Author'
import type { Post } from '@/core/logic/posts/domain/Post'
import { site } from '@/ui/config/site'
import type { SocialImageOverride, SocialImageSource } from '@/ui/layouts/BaseLayout/components/SeoMetadata/types'
import { getSeoMetadata } from '@/ui/layouts/BaseLayout/components/SeoMetadata/utils/getSeoMetadata'

const siteTitle = `${site.title} - ${site.subtitle}`
const fallbackImage: SocialImageSource = { src: '/_astro/iadev.example.png', width: 1280, height: 640, format: 'png' }
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
      type: 'image/png',
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
      type: 'image/png',
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

  test('prefers the original article image with its actual size in all structured data', () => {
    const articleImage: SocialImageSource = {
      src: '/_astro/social.original.jpg',
      width: 1440,
      height: 720,
      format: 'jpg',
    }
    const result = getSeoMetadata({
      pathname: '/posts/public-slug/',
      title: post.title,
      description: post.description,
      article: { post, author },
      articleImage,
      fallbackImage,
    })
    const url = new URL(articleImage.src, site.url).href

    expect(result.image).toEqual({
      url,
      type: 'image/jpeg',
      width: 1440,
      height: 720,
      alt: `${post.title} — ${site.title}`,
    })
    expect(result.structuredData['@graph'][1]).toMatchObject({
      primaryImageOfPage: { url, width: 1440, height: 720 },
    })
    expect(result.structuredData['@graph'][2]).toMatchObject({
      image: { url, width: 1440, height: 720 },
    })
  })

  test.each<{ format: SocialImageSource['format']; type: string }>([
    { format: 'jpg', type: 'image/jpeg' },
    { format: 'jpeg', type: 'image/jpeg' },
    { format: 'png', type: 'image/png' },
    { format: 'apng', type: 'image/apng' },
    { format: 'tiff', type: 'image/tiff' },
    { format: 'webp', type: 'image/webp' },
    { format: 'gif', type: 'image/gif' },
    { format: 'svg', type: 'image/svg+xml' },
    { format: 'avif', type: 'image/avif' },
  ])('uses the correct MIME type for $format images', ({ format, type }) => {
    const articleImage = { src: `/_astro/social.example.${format}`, width: 1200, height: 630, format }
    const result = getSeoMetadata({
      pathname: '/posts/example/',
      description: post.description,
      article: { post, author },
      articleImage,
      fallbackImage,
    })

    expect(result.image.type).toBe(type)
    expect(result.image.url).toBe(new URL(articleImage.src, site.url).href)
  })

  test('keeps the site image for non-article pages even if an article image is supplied', () => {
    const result = getSeoMetadata({
      pathname: '/',
      description: site.description,
      articleImage: { src: '/_astro/social.example.webp', width: 1200, height: 630, format: 'webp' },
      fallbackImage,
    })

    expect(result.image.url).toBe(new URL(fallbackImage.src, site.url).href)
    expect(result.image.type).toBe('image/png')
  })

  test('uses a social image override instead of the fallback image', () => {
    const socialImage: SocialImageOverride = {
      image: { src: '/_astro/certificate.png', width: 1600, height: 900, format: 'png' },
      alt: 'Certificado de experiencia no facturada por suscripción.',
    }
    const result = getSeoMetadata({
      pathname: '/certificate/',
      title: 'Certificado',
      description: 'Experiencia certificada.',
      socialImage,
      fallbackImage,
    })
    const url = new URL(socialImage.image.src, site.url).href

    expect(result.image).toEqual({ url, type: 'image/png', width: 1600, height: 900, alt: socialImage.alt })
    expect(result.structuredData['@graph'][1]).toMatchObject({
      primaryImageOfPage: { url, width: 1600, height: 900, caption: socialImage.alt },
    })
  })

  test.each<SocialImageSource | undefined>([
    undefined,
    { src: '/_astro/article.original.jpg', width: 1440, height: 720, format: 'jpg' },
  ])('prefers the social image override over generated and original article images (%j)', (articleImage) => {
    const socialImage: SocialImageOverride = {
      image: { src: '/_astro/article.override.webp', width: 1800, height: 1200, format: 'webp' },
      alt: 'Imagen elegida para compartir el artículo.',
    }
    const result = getSeoMetadata({
      pathname: '/posts/example/',
      title: post.title,
      description: post.description,
      article: { post, author },
      articleImage,
      socialImage,
      fallbackImage,
    })
    const url = new URL(socialImage.image.src, site.url).href
    const expectedImage = { url, width: 1800, height: 1200, caption: socialImage.alt }

    expect(result.image).toEqual({ url, type: 'image/webp', width: 1800, height: 1200, alt: socialImage.alt })
    expect(result.structuredData['@graph'][1]).toMatchObject({ primaryImageOfPage: expectedImage })
    expect(result.structuredData['@graph'][2]).toMatchObject({ image: expectedImage })
  })

  test('preserves absolute override image URLs and an explicitly empty alt', () => {
    const socialImage: SocialImageOverride = {
      image: { src: 'https://images.example.com/certificate.png', width: 1600, height: 900, format: 'png' },
      alt: '',
    }
    const result = getSeoMetadata({
      pathname: '/certificate/',
      description: site.description,
      socialImage,
      fallbackImage,
    })

    expect(result.image).toEqual({
      url: socialImage.image.src,
      type: 'image/png',
      width: 1600,
      height: 900,
      alt: '',
    })
  })

  test('does not modify the social image override', () => {
    const socialImage: SocialImageOverride = {
      image: { src: '/_astro/certificate.webp', width: 1600, height: 900, format: 'webp' },
      alt: 'Certificado de experiencia.',
    }
    const before = structuredClone(socialImage)

    getSeoMetadata({ pathname: '/certificate/', description: site.description, socialImage, fallbackImage })

    expect(socialImage).toStrictEqual(before)
  })

  test('preserves encoded canonical paths', () => {
    const result = getSeoMetadata({
      pathname: '/posts/archivo/opini%C3%B3n/',
      description: post.description,
      fallbackImage,
    })

    expect(result.canonical).toBe(new URL('/posts/archivo/opini%C3%B3n/', site.url).href)
  })

  test('does not modify the article, author, original image or fallback image', () => {
    const input = structuredClone({
      pathname: '/posts/example/',
      title: post.title,
      description: post.description,
      article: { post, author },
      articleImage: { src: '/_astro/social.example.webp', width: 1200, height: 630, format: 'webp' as const },
      fallbackImage,
    })
    const before = structuredClone(input)

    getSeoMetadata(input)

    expect(input).toStrictEqual(before)
  })
})

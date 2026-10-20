import { describe, expect, test } from 'bun:test'
import { GITHUB_URL } from '@/core/constants/github'
import type { Author } from '@/core/logic/authors/domain/Author'
import type { Post } from '@/core/logic/posts/domain/Post'
import { site } from '@/ui/config/site'
import type { StructuredDataInput } from '@/ui/layouts/BaseLayout/components/SeoMetadata/types'
import { getStructuredData } from '@/ui/layouts/BaseLayout/components/SeoMetadata/utils/getStructuredData'

const siteUrl = new URL('/', site.url).href
const website = {
  '@type': 'WebSite',
  '@id': `${siteUrl}#website`,
  name: `${site.title} - ${site.subtitle}`,
  url: siteUrl,
  inLanguage: 'es',
}
const image = {
  url: 'https://images.example.com/social/portada.webp',
  width: 1200,
  height: 630,
  alt: 'Programación, café & suscripciones',
}
const imageObject = {
  '@type': 'ImageObject',
  url: 'https://images.example.com/social/portada.webp',
  width: 1200,
  height: 630,
  caption: 'Programación, café & suscripciones',
}
const post: Post = {
  id: 'senior-por-suscripcion',
  title: 'Senior por suscripción',
  description: 'La experiencia ahora se factura por mes.',
  author_id: 'author-handle',
  category_ids: ['ia'],
  reading_time_minutes: 3,
  token_count: 1200,
  published_at: new Date('2026-10-18T23:30:00-03:00'),
}
const author: Author = {
  id: 'author-handle',
  name: 'María García',
  bio: '<p>Escribe código y <strong>paga facturas</strong>.</p>',
  avatar: 'maria.webp',
}
const canonical = 'https://iadev.blog/posts/senior-por-suscripcion/'
const articleInput: StructuredDataInput = {
  canonical,
  title: 'Senior por suscripción | IADev',
  description: 'Descripción de la página del artículo.',
  image,
  article: { post, author },
}
const articlePage = {
  '@type': 'WebPage',
  '@id': `${canonical}#webpage`,
  url: canonical,
  name: 'Senior por suscripción | IADev',
  description: 'Descripción de la página del artículo.',
  isPartOf: { '@id': `${siteUrl}#website` },
  primaryImageOfPage: imageObject,
  mainEntity: { '@id': `${canonical}#article` },
}
const blogPosting = {
  '@type': 'BlogPosting',
  '@id': `${canonical}#article`,
  headline: 'Senior por suscripción',
  description: 'La experiencia ahora se factura por mes.',
  url: canonical,
  mainEntityOfPage: { '@id': `${canonical}#webpage` },
  image: imageObject,
  datePublished: '2026-10-19T02:30:00.000Z',
  author: {
    '@type': 'Person',
    name: 'María García',
    url: `${GITHUB_URL}/author-handle`,
  },
  inLanguage: 'es',
}

describe('getStructuredData', () => {
  test('returns the exact homepage graph with the root website URL and supplied image', () => {
    const input: StructuredDataInput = {
      canonical: siteUrl,
      title: 'IADev - Senior por Suscripción',
      description: 'Sátira sobre IA para programadores.',
      image,
    }

    expect(getStructuredData(input)).toStrictEqual({
      '@context': 'https://schema.org',
      '@graph': [
        website,
        {
          '@type': 'WebPage',
          '@id': `${siteUrl}#webpage`,
          url: siteUrl,
          name: 'IADev - Senior por Suscripción',
          description: 'Sátira sobre IA para programadores.',
          isPartOf: { '@id': `${siteUrl}#website` },
          primaryImageOfPage: imageObject,
        },
      ],
    })
  })

  test('returns the exact article graph with the real author and no modification date', () => {
    const result = getStructuredData(articleInput)

    expect(result).toStrictEqual({
      '@context': 'https://schema.org',
      '@graph': [website, articlePage, blogPosting],
    })
  })

  test('preserves the default author name without emitting an author URL', () => {
    const result = getStructuredData({
      ...articleInput,
      article: {
        post: { ...post, author_id: 'default' },
        author: { ...author, id: 'default' },
      },
    })

    expect(result).toStrictEqual({
      '@context': 'https://schema.org',
      '@graph': [
        website,
        articlePage,
        {
          ...blogPosting,
          author: { '@type': 'Person', name: author.name },
        },
      ],
    })
    expect(JSON.stringify(result)).not.toContain(`${GITHUB_URL}/default`)
  })

  test('includes the updated date in ISO format only when supplied', () => {
    const result = getStructuredData({
      ...articleInput,
      article: {
        post: { ...post, updated_at: new Date('2026-10-20T01:15:30+02:00') },
        author,
      },
    })

    const article = result['@graph'].find((node) => node['@type'] === 'BlogPosting')

    expect(article).toMatchObject({
      datePublished: '2026-10-19T02:30:00.000Z',
      dateModified: '2026-10-19T23:15:30.000Z',
    })
  })

  test('does not omit future publication dates or invent modification dates', () => {
    const result = getStructuredData({
      ...articleInput,
      article: {
        post: { ...post, published_at: new Date('2099-01-01T00:00:00Z') },
        author,
      },
    })

    const article = result['@graph'].find((node) => node['@type'] === 'BlogPosting')

    expect(article).toMatchObject({ datePublished: '2099-01-01T00:00:00.000Z' })
    expect(article).not.toHaveProperty('dateModified')
  })

  test('preserves the entire input including nested fields and dates', () => {
    const input = structuredClone({
      ...articleInput,
      article: { post: { ...post, updated_at: new Date('2026-10-20T00:00:00Z') }, author },
    })
    const before = structuredClone(input)

    getStructuredData(input)

    expect(input).toStrictEqual(before)
  })
})

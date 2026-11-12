import { describe, expect, test } from 'bun:test'
import { getRssString } from '@astrojs/rss'
import { POSTS_ASSETS_PATH } from '@/ui/constants/assets'
import { getRssOptions } from '@/ui/utils/getRssOptions'

const site = {
  title: 'IADev & programación',
  description: 'Sátira <sobre> IA',
  url: 'https://example.com',
}

const post = {
  id: 'example',
  body: 'This Markdown must not be used as HTML.',
  data: {
    title: 'IA & código',
    description: 'Un resumen <breve>.',
    author: { id: 'default' },
    published_at: new Date('2026-11-02T08:00:00Z'),
    categories: [{ id: 'programming' }],
  },
  rendered: { html: '<p>Contenido <strong>completo</strong> &amp; código.</p>' },
}

const categories = [
  { id: 'programming', name: 'Código & IA', description: 'Programación' },
  { id: 'unused', name: 'Sin artículos', description: 'No debe aparecer' },
]

describe('getRssOptions', () => {
  test('serializes the reference RSS structure with full HTML, media, categories and a self link', async () => {
    const options = getRssOptions({ posts: [post], categories, images: {}, site })
    const xml = await getRssString(options)

    expect(xml).toStartWith('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"')
    expect(xml).toContain('xmlns:content="http://purl.org/rss/1.0/modules/content/"')
    expect(xml).toContain('xmlns:media="http://search.yahoo.com/mrss/"')
    expect(xml).toContain('xmlns:atom="http://www.w3.org/2005/Atom"')
    expect(xml).toContain('<title>IADev &amp; programación</title><description>Sátira &lt;sobre&gt; IA</description>')
    expect(xml).toContain(
      '<link>https://example.com/</link><language>es</language>' +
        '<atom:link href="https://example.com/rss.xml" rel="self" type="application/rss+xml"/>'
    )
    expect(xml).toContain(
      '<item><title>IA &amp; código</title><link>https://example.com/posts/example/</link>' +
        '<guid isPermaLink="true">https://example.com/posts/example/</guid>' +
        '<description>Un resumen &lt;breve&gt;.</description><pubDate>Mon, 02 Nov 2026 08:00:00 GMT</pubDate>'
    )
    expect(xml).toContain(
      '<content:encoded>&lt;p&gt;Contenido &lt;strong&gt;completo&lt;/strong&gt; &amp;amp; código.&lt;/p&gt;</content:encoded>' +
        '<media:content medium="image" url="https://example.com/social/posts/example.png"/>' +
        '<category>Código &amp; IA</category></item>'
    )
    expect(xml).not.toContain(post.body)
    expect(xml).not.toContain('Sin artículos')
  })

  test('sorts by publication date without mutating sources or prioritizing pinned posts', () => {
    const older = { ...post, id: 'older', data: { ...post.data, pinned: true } }
    const future = { ...post, id: 'future', data: { ...post.data, published_at: new Date('2099-01-01') } }
    const posts = Object.freeze([older, future])
    const before = structuredClone(posts)

    const options = getRssOptions({ posts, categories, images: {}, site })

    expect(options.items).toMatchObject([{ link: '/posts/future/' }, { link: '/posts/older/' }])
    expect(posts).toEqual(before)
  })

  test('uses the existing social image and escapes query parameters in XML attributes', async () => {
    const images = {
      [`${POSTS_ASSETS_PATH}/example/social.png`]: {
        src: '/_astro/social.png?width=1200&height=630',
        width: 1200,
        height: 630,
        format: 'png' as const,
      },
    }
    const xml = await getRssString(getRssOptions({ posts: [post], categories, images, site }))

    expect(xml).toContain(
      '<media:content medium="image" url="https://example.com/_astro/social.png?width=1200&amp;height=630"/>'
    )
    expect(xml).not.toContain('/social/posts/example.png')
  })

  test('supports nested identifiers, custom site URLs, multiple categories and uncategorized posts', () => {
    const nested = {
      ...post,
      id: 'series/AI & code',
      data: { ...post.data, categories: [{ id: 'programming' }, { id: 'unused' }] },
    }
    const uncategorized = { ...post, data: { ...post.data, categories: undefined } }
    const options = getRssOptions({
      posts: [nested, uncategorized],
      categories,
      images: {},
      site: { ...site, url: 'https://preview.example.org' },
    })

    expect(options.customData).toContain('href="https://preview.example.org/rss.xml"')
    expect(options.items).toMatchObject([
      {
        link: '/posts/series/AI%20%26%20code/',
        customData:
          '<media:content medium="image" url="https://preview.example.org/social/posts/series/AI%20%26%20code.png"/>',
        categories: ['Código & IA', 'Sin artículos'],
      },
      { categories: [] },
    ])
  })

  test('keeps channel metadata and namespaces when the blog is empty', async () => {
    const xml = await getRssString(getRssOptions({ posts: [], categories: [], images: {}, site }))

    expect(xml).toContain('xmlns:content="http://purl.org/rss/1.0/modules/content/"')
    expect(xml).toContain('<language>es</language>')
    expect(xml).toContain('<atom:link href="https://example.com/rss.xml"')
    expect(xml).not.toContain('<item>')
  })

  test('fails explicitly if a post has no rendered HTML instead of publishing a summary-only entry', () => {
    const source = { ...post, rendered: undefined }

    expect(() => getRssOptions({ posts: [source], categories, images: {}, site })).toThrow(
      'Missing rendered HTML for post "example".'
    )
  })
})

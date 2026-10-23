import { describe, expect, test } from 'bun:test'
import { markdownToHtml } from 'satteri'
import { openLinksInNewTab } from '@/ui/plugins/openLinksInNewTab'

const options = {
  features: { rawHtml: true },
  hastPlugins: [openLinksInNewTab()],
}

describe('openLinksInNewTab', () => {
  test.each([
    'https://example.com/article',
    'http://example.com/article',
    '/posts/example/',
    './another-post.md',
    '#section',
    'mailto:author@example.com',
    'tel:+34123456789',
  ])('opens %s in a new tab with secure relationships', (href) => {
    const { html } = markdownToHtml(`[Read more](${href})`, options)

    expect(html).toContain(`href="${href}"`)
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  test.each([
    '[Read more][source]\n\n[source]: https://example.com/article',
    '<https://example.com/article>',
    '<a href="https://example.com/article">Read more</a>',
  ])('covers reference links, autolinks and embedded HTML: %s', (markdown) => {
    const { html } = markdownToHtml(markdown, options)

    expect(html).toContain('href="https://example.com/article"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  test('overrides explicit targets while preserving other attributes and safe relationships', () => {
    const { html } = markdownToHtml(
      '<a href="https://example.com" target="_self" rel="nofollow opener sponsored" title="More information">Read</a>',
      options
    )

    expect(html).toContain('target="_blank"')
    expect(html).not.toContain('target="_self"')
    expect(html).toContain('rel="nofollow sponsored noopener noreferrer"')
    expect(html).toContain('title="More information"')
  })

  test('does not duplicate secure relationships already present', () => {
    const { html } = markdownToHtml(
      '<a href="https://example.com" rel="noopener noreferrer nofollow noopener">Read</a>',
      options
    )

    expect(html).toContain('rel="noopener noreferrer nofollow"')
    expect(html).toContain('target="_blank"')
  })

  test('leaves named anchors without href unchanged', () => {
    const { html } = markdownToHtml('<a id="section">Section</a>', options)

    expect(html).toContain('id="section"')
    expect(html).not.toContain('target=')
    expect(html).not.toContain('rel=')
  })

  test('does not turn link syntax inside code into real links', () => {
    const { html } = markdownToHtml(
      '`[Read](https://example.com)`\n\n```html\n<a href="/example/">Read</a>\n```',
      options
    )

    expect(html).toContain('<code>')
    expect(html).toContain('<pre>')
    expect(html).not.toContain('target=')
    expect(html).not.toContain('rel=')
  })

  test('applies the same policy to footnote links and back references', () => {
    const { html } = markdownToHtml('A claim[^source].\n\n[^source]: A footnote.', options)
    const links = html.match(/<a\b[^>]*>/g) ?? []

    expect(links.length).toBeGreaterThanOrEqual(2)
    for (const link of links) {
      expect(link).toContain('target="_blank"')
      expect(link).toContain('rel="noopener noreferrer"')
    }
  })
})

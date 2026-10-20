import { describe, expect, test } from 'bun:test'
import { getPostShareLinks } from '@/ui/pages/Post/components/PostFooter/components/PostShare/utils/getPostShareLinks'

const postUrl = 'https://iadev.blog/posts/senior-por-suscripcion/?ref=a&lang=es#conclusión'
const postTitle = '¿Senior & «AI»? #100% + café'
const text = `${postTitle}\n${postUrl}`
const links = getPostShareLinks(postUrl, postTitle)

describe('getPostShareLinks', () => {
  test('provides fifteen distinct direct share destinations', () => {
    expect(Object.keys(links)).toHaveLength(15)
    expect(new Set(Object.values(links)).size).toBe(15)
  })

  test.each([
    ['whatsapp', 'https://wa.me/'],
    ['telegram', 'https://t.me/share/url'],
    ['viber', 'viber://forward'],
    ['line', 'https://social-plugins.line.me/lineit/share'],
    ['email', 'mailto:'],
    ['sms', 'sms:'],
    ['x', 'https://twitter.com/intent/tweet'],
    ['bluesky', 'https://bsky.app/intent/compose'],
    ['facebook', 'https://www.facebook.com/sharer/sharer.php'],
    ['linkedin', 'https://www.linkedin.com/sharing/share-offsite/'],
    ['threads', 'https://www.threads.net/intent/post'],
    ['reddit', 'https://www.reddit.com/submit'],
    ['pinterest', 'https://www.pinterest.com/pin/create/button/'],
    ['hackerNews', 'https://news.ycombinator.com/submitlink'],
    ['tumblr', 'https://www.tumblr.com/widgets/share/tool'],
  ] as const)('uses the direct endpoint for %s', (platform, endpoint) => {
    expect(links[platform].split('?')[0]).toBe(endpoint)
  })

  test.each([
    ['telegram', 'url'],
    ['line', 'url'],
    ['x', 'url'],
    ['facebook', 'u'],
    ['linkedin', 'url'],
    ['reddit', 'url'],
    ['pinterest', 'url'],
    ['hackerNews', 'u'],
    ['tumblr', 'canonicalUrl'],
  ] as const)('preserves the entire URL in %s without injecting query parameters', (platform, parameter) => {
    const params = new URL(links[platform]).searchParams

    expect(params.get(parameter)).toBe(postUrl)
    expect(params.has('lang')).toBe(false)
    expect(new URL(links[platform]).hash).toBe('')
  })

  test.each([
    ['telegram', 'text'],
    ['email', 'subject'],
    ['x', 'text'],
    ['reddit', 'title'],
    ['pinterest', 'description'],
    ['hackerNews', 't'],
    ['tumblr', 'title'],
  ] as const)('preserves accents and reserved characters in the %s title', (platform, parameter) => {
    expect(new URL(links[platform]).searchParams.get(parameter)).toBe(postTitle)
  })

  test.each([
    ['whatsapp', 'text'],
    ['viber', 'text'],
    ['email', 'body'],
    ['sms', 'body'],
    ['bluesky', 'text'],
    ['threads', 'text'],
  ] as const)('includes the title and exact URL in the %s message', (platform, parameter) => {
    expect(new URL(links[platform]).searchParams.get(parameter)).toBe(text)
  })

  test('shares Tumblr links as link posts', () => {
    expect(new URL(links.tumblr).searchParams.get('posttype')).toBe('link')
  })

  test('does not add a recipient to email or SMS', () => {
    expect(new URL(links.email).pathname).toBe('')
    expect(new URL(links.sms).pathname).toBe('')
  })

  test('does not double-encode an already escaped URL', () => {
    const escapedUrl = 'https://iadev.blog/posts/adi%C3%B3s/?q=hello%20world'
    const result = getPostShareLinks(escapedUrl, 'Adiós')

    expect(new URL(result.telegram).searchParams.get('url')).toBe(escapedUrl)
    expect(new URL(result.whatsapp).searchParams.get('text')).toBe(`Adiós\n${escapedUrl}`)
  })

  test('does not normalize or truncate long titles', () => {
    const longTitle = `  ${'El algoritmo necesita vacaciones. '.repeat(100)}  `
    const result = getPostShareLinks(postUrl, longTitle)

    expect(new URL(result.x).searchParams.get('text')).toBe(longTitle)
    expect(new URL(result.bluesky).searchParams.get('text')).toBe(`${longTitle}\n${postUrl}`)
  })
})

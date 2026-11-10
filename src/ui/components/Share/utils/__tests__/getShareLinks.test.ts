import { describe, expect, test } from 'bun:test'
import { getShareLinks } from '@/ui/components/Share/utils/getShareLinks'

const postUrl = 'https://iadev.blog/posts/senior-por-suscripcion/?ref=a&lang=es#conclusión'
const postTitle = '¿Senior & «AI»? #100% + café'
const text = `${postTitle}\n${postUrl}`
const links = getShareLinks(postUrl, postTitle)
const [
  x,
  bluesky,
  facebook,
  linkedin,
  threads,
  reddit,
  pinterest,
  hackerNews,
  tumblr,
  whatsapp,
  telegram,
  viber,
  line,
  email,
  sms,
] = links

describe('getShareLinks', () => {
  test('provides all fifteen destinations with their labels, groups and external behavior in stable display order', () => {
    expect(links.map(({ destination, label, group, external }) => ({ destination, label, group, external }))).toEqual([
      { destination: 'x', label: 'X', group: 'social', external: true },
      { destination: 'bluesky', label: 'Bluesky', group: 'social', external: true },
      { destination: 'facebook', label: 'Facebook', group: 'social', external: true },
      { destination: 'linkedin', label: 'LinkedIn', group: 'social', external: true },
      { destination: 'threads', label: 'Threads', group: 'social', external: true },
      { destination: 'reddit', label: 'Reddit', group: 'social', external: true },
      { destination: 'pinterest', label: 'Pinterest', group: 'social', external: true },
      { destination: 'hackerNews', label: 'Hacker News', group: 'social', external: true },
      { destination: 'tumblr', label: 'Tumblr', group: 'social', external: true },
      { destination: 'whatsapp', label: 'WhatsApp', group: 'messaging', external: true },
      { destination: 'telegram', label: 'Telegram', group: 'messaging', external: true },
      { destination: 'viber', label: 'Viber', group: 'messaging', external: false },
      { destination: 'line', label: 'LINE', group: 'messaging', external: true },
      { destination: 'email', label: 'Correo', group: 'messaging', external: false },
      { destination: 'sms', label: 'SMS', group: 'messaging', external: false },
    ])
    expect(links.filter(({ group }) => group === 'social')).toHaveLength(9)
    expect(links.filter(({ group }) => group === 'messaging')).toHaveLength(6)
    expect(new Set(links.map(({ destination }) => destination)).size).toBe(15)
    expect(new Set(links.map(({ href }) => href)).size).toBe(15)
  })

  test.each([
    { link: x, endpoint: 'https://twitter.com/intent/tweet' },
    { link: bluesky, endpoint: 'https://bsky.app/intent/compose' },
    { link: facebook, endpoint: 'https://www.facebook.com/sharer/sharer.php' },
    { link: linkedin, endpoint: 'https://www.linkedin.com/sharing/share-offsite/' },
    { link: threads, endpoint: 'https://www.threads.net/intent/post' },
    { link: reddit, endpoint: 'https://www.reddit.com/submit' },
    { link: pinterest, endpoint: 'https://www.pinterest.com/pin/create/button/' },
    { link: hackerNews, endpoint: 'https://news.ycombinator.com/submitlink' },
    { link: tumblr, endpoint: 'https://www.tumblr.com/widgets/share/tool' },
    { link: whatsapp, endpoint: 'https://wa.me/' },
    { link: telegram, endpoint: 'https://t.me/share/url' },
    { link: viber, endpoint: 'viber://forward' },
    { link: line, endpoint: 'https://social-plugins.line.me/lineit/share' },
    { link: email, endpoint: 'mailto:' },
    { link: sms, endpoint: 'sms:' },
  ])('uses the direct endpoint for $link.destination', ({ link, endpoint }) => {
    expect(link.href.split('?')[0]).toBe(endpoint)
  })

  test.each([
    { link: telegram, parameter: 'url' },
    { link: line, parameter: 'url' },
    { link: x, parameter: 'url' },
    { link: facebook, parameter: 'u' },
    { link: linkedin, parameter: 'url' },
    { link: reddit, parameter: 'url' },
    { link: pinterest, parameter: 'url' },
    { link: hackerNews, parameter: 'u' },
    { link: tumblr, parameter: 'canonicalUrl' },
  ])('preserves the entire URL in $link.destination without injecting query parameters', ({ link, parameter }) => {
    const url = new URL(link.href)

    expect(url.searchParams.get(parameter)).toBe(postUrl)
    expect(url.searchParams.has('lang')).toBe(false)
    expect(url.hash).toBe('')
  })

  test.each([
    { link: telegram, parameter: 'text' },
    { link: email, parameter: 'subject' },
    { link: x, parameter: 'text' },
    { link: reddit, parameter: 'title' },
    { link: pinterest, parameter: 'description' },
    { link: hackerNews, parameter: 't' },
    { link: tumblr, parameter: 'title' },
  ])('preserves accents and reserved characters in the $link.destination title', ({ link, parameter }) => {
    expect(new URL(link.href).searchParams.get(parameter)).toBe(postTitle)
  })

  test.each([
    { link: whatsapp, parameter: 'text' },
    { link: viber, parameter: 'text' },
    { link: email, parameter: 'body' },
    { link: sms, parameter: 'body' },
    { link: bluesky, parameter: 'text' },
    { link: threads, parameter: 'text' },
  ])('includes the title and exact URL in the $link.destination message', ({ link, parameter }) => {
    expect(new URL(link.href).searchParams.get(parameter)).toBe(text)
  })

  test('shares Tumblr links as link posts', () => {
    expect(new URL(tumblr.href).searchParams.get('posttype')).toBe('link')
  })

  test('does not add a recipient to email or SMS', () => {
    expect(new URL(email.href).pathname).toBe('')
    expect(new URL(sms.href).pathname).toBe('')
  })

  test('does not double-encode an already escaped URL', () => {
    const escapedUrl = 'https://iadev.blog/posts/adi%C3%B3s/?q=hello%20world'
    const result = getShareLinks(escapedUrl, 'Adiós')
    const whatsapp = result.find(({ destination }) => destination === 'whatsapp')
    const telegram = result.find(({ destination }) => destination === 'telegram')
    if (!whatsapp || !telegram) {
      throw new Error('Expected WhatsApp and Telegram share descriptors')
    }

    expect(new URL(telegram.href).searchParams.get('url')).toBe(escapedUrl)
    expect(new URL(whatsapp.href).searchParams.get('text')).toBe(`Adiós\n${escapedUrl}`)
  })

  test('does not normalize or truncate long titles', () => {
    const longTitle = `  ${'El algoritmo necesita vacaciones. '.repeat(100)}  `
    const [x, bluesky] = getShareLinks(postUrl, longTitle)

    expect(new URL(x.href).searchParams.get('text')).toBe(longTitle)
    expect(new URL(bluesky.href).searchParams.get('text')).toBe(`${longTitle}\n${postUrl}`)
  })

  test('preserves empty strings without substituting defaults or removing the message separator', () => {
    const [x, bluesky] = getShareLinks('', '')

    expect(new URL(x.href).searchParams.get('url')).toBe('')
    expect(new URL(x.href).searchParams.get('text')).toBe('')
    expect(new URL(bluesky.href).searchParams.get('text')).toBe('\n')
  })

  test('returns independent descriptors without changing earlier results on subsequent calls', () => {
    const first = getShareLinks(postUrl, postTitle)
    const snapshot = structuredClone(first)
    const updated = getShareLinks('https://iadev.blog/certificate/?name=Mar%C3%ADa', 'Un ascenso más')
    const repeated = getShareLinks(postUrl, postTitle)

    expect(first).toEqual(snapshot)
    expect(repeated).toEqual(snapshot)
    expect(updated).not.toEqual(first)
    expect(repeated).not.toBe(first)
    for (const [index, link] of first.entries()) {
      expect(updated[index]).not.toBe(link)
      expect(repeated[index]).not.toBe(link)
    }
  })
})

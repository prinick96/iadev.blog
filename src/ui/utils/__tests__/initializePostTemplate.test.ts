import { afterEach, expect, setSystemTime, test } from 'bun:test'
import { initializePostTemplate } from '@/ui/utils/initializePostTemplate'

const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
const baseUrl = 'https://github.com/prinick96/iadev.blog/new/main/src/content/posts?filename=mi-post.md'

class PostLinkMock {
  href = baseUrl
  listeners = new Map<string, () => void>()

  addEventListener(event: string, listener: () => void): void {
    this.listeners.set(event, listener)
  }
}

function setLinks(links: PostLinkMock[]): void {
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      querySelectorAll: (selector: string) => {
        expect(selector).toBe('a[data-new-post]')
        return links
      },
    },
  })
}

afterEach(() => {
  setSystemTime()
  if (originalDocument) {
    Object.defineProperty(globalThis, 'document', originalDocument)
  } else {
    Reflect.deleteProperty(globalThis, 'document')
  }
})

test('does nothing when no contribution links are present', () => {
  setLinks([])

  expect(() => initializePostTemplate()).not.toThrow()
})

test('initializes footer and article links independently with the same template', () => {
  const footerLink = new PostLinkMock()
  const articleLink = new PostLinkMock()
  setLinks([footerLink, articleLink])
  setSystemTime(new Date('2026-10-20T10:00:00Z'))
  initializePostTemplate()

  footerLink.listeners.get('click')?.()
  expect(articleLink.href).toBe(baseUrl)
  articleLink.listeners.get('click')?.()

  expect(footerLink.href).toBe(articleLink.href)
  expect(new URL(footerLink.href).searchParams.get('value')).toContain('author: default')
})

test.each(['click', 'auxclick', 'contextmenu'])('generates the date at %s time and refreshes it on reuse', (event) => {
  const link = new PostLinkMock()
  setLinks([link])
  setSystemTime(new Date('2026-10-20T10:00:00Z'))
  initializePostTemplate()
  expect(link.href).toBe(baseUrl)

  setSystemTime(new Date('2026-10-21T11:22:33Z'))
  link.listeners.get(event)?.()
  expect(new URL(link.href).searchParams.get('value')).toContain('published_at: 2026-10-21T11:22:33.000Z')

  setSystemTime(new Date('2026-10-22T12:00:00Z'))
  link.listeners.get(event)?.()
  const url = new URL(link.href)
  expect(url.searchParams.get('value')).toContain('published_at: 2026-10-22T12:00:00.000Z')
  expect(url.searchParams.get('filename')).toBe('mi-post.md')
  expect(url.searchParams.getAll('value')).toHaveLength(1)
})

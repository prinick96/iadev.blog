import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import type { ShareUpdateDetail } from '@/ui/components/Share/types'
import { getShareLinks } from '@/ui/components/Share/utils/getShareLinks'
import { initializeShare } from '@/ui/components/Share/utils/initializeShare'

const initialUrl = 'https://iadev.blog/posts/example/'
const initialTitle = 'El algoritmo pide vacaciones'
const updatedDetail: ShareUpdateDetail = {
  url: 'https://iadev.blog/certificate/?name=Mar%C3%ADa&level=senior#título',
  title: '¿Senior & «AI»? #100% + café <script>alert(1)</script>',
}

class AnchorMock {
  setHref = mock((_href: string) => {})

  constructor(
    readonly destination: string,
    private currentHref: string
  ) {}

  get href(): string {
    return this.currentHref
  }

  set href(value: string) {
    this.currentHref = value
    this.setHref(value)
  }
}

class ShareRootMock extends EventTarget {
  dataset: Record<string, string> = {}
  anchors = getShareLinks(initialUrl, initialTitle).map(({ destination, href }) => new AnchorMock(destination, href))
  querySelectorAll = mock((selector: string) =>
    this.anchors.filter((anchor) => selector === `a[data-share-destination="${anchor.destination}"]`)
  )
}

class DocumentMock extends EventTarget {
  roots: ShareRootMock[] = []
  querySelectorAll = mock((selector: string) => {
    expect(selector).toBe('[data-share][data-share-live]')
    return this.roots.filter((root) => 'shareLive' in root.dataset)
  })
}

const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
let page: DocumentMock
let root: ShareRootMock

beforeEach(() => {
  page = new DocumentMock()
  root = new ShareRootMock()
  root.dataset.shareLive = 'true'
  page.roots.push(root)
  Object.defineProperty(globalThis, 'document', { configurable: true, value: page })
})

afterEach(() => {
  if (originalDocument) {
    Object.defineProperty(globalThis, 'document', originalDocument)
  } else {
    Reflect.deleteProperty(globalThis, 'document')
  }
})

describe('initializeShare', () => {
  test('does nothing when no share roots exist', () => {
    page.roots = []

    expect(initializeShare).not.toThrow()
  })

  test('keeps initial links unchanged until an update is dispatched', () => {
    initializeShare()

    expect(root.dataset.shareReady).toBe('true')
    expect(root.querySelectorAll).not.toHaveBeenCalled()
    for (const { destination, href } of getShareLinks(initialUrl, initialTitle)) {
      expect(root.anchors.find((anchor) => anchor.destination === destination)?.href).toBe(href)
    }
  })

  test('updates all fifteen destinations using the same helper without changing the payload', () => {
    initializeShare()
    const detail = Object.freeze({ ...updatedDetail })

    root.dispatchEvent(new CustomEvent('share:update', { detail }))

    for (const { destination, href } of getShareLinks(detail.url, detail.title)) {
      expect(root.anchors.find((anchor) => anchor.destination === destination)?.href).toBe(href)
    }
    expect(root.anchors).toHaveLength(15)
    expect(detail).toEqual(updatedDetail)
    for (const anchor of root.anchors) {
      expect(anchor.setHref).toHaveBeenCalledTimes(1)
      expect(anchor.href).not.toContain('<script>')
    }
  })

  test('never initializes static roots or attaches their update listeners', () => {
    const staticRoot = new ShareRootMock()
    const addEventListener = mock(staticRoot.addEventListener.bind(staticRoot))
    staticRoot.addEventListener = addEventListener
    page.roots.push(staticRoot)
    initializeShare()

    staticRoot.dispatchEvent(new CustomEvent('share:update', { detail: updatedDetail }))

    expect(addEventListener).not.toHaveBeenCalled()
    expect(staticRoot.dataset.shareReady).toBeUndefined()
    expect(staticRoot.querySelectorAll).not.toHaveBeenCalled()
    for (const { destination, href } of getShareLinks(initialUrl, initialTitle)) {
      expect(staticRoot.anchors.find((anchor) => anchor.destination === destination)?.href).toBe(href)
    }
  })

  test('updates only the live instance receiving the event', () => {
    const secondRoot = new ShareRootMock()
    secondRoot.dataset.shareLive = ''
    page.roots.push(secondRoot)
    initializeShare()

    secondRoot.dispatchEvent(new CustomEvent('share:update', { detail: updatedDetail }))

    expect(root.querySelectorAll).not.toHaveBeenCalled()
    for (const { destination, href } of getShareLinks(updatedDetail.url, updatedDetail.title)) {
      expect(secondRoot.anchors.find((anchor) => anchor.destination === destination)?.href).toBe(href)
    }
    for (const anchor of root.anchors) {
      expect(anchor.setHref).not.toHaveBeenCalled()
    }
  })

  test('does not respond to events dispatched on the document', () => {
    initializeShare()

    page.dispatchEvent(new CustomEvent('share:update', { detail: updatedDetail }))

    expect(root.querySelectorAll).not.toHaveBeenCalled()
  })

  test('initializes each root only once', () => {
    const addEventListener = mock(root.addEventListener.bind(root))
    root.addEventListener = addEventListener
    initializeShare()
    initializeShare()

    root.dispatchEvent(new CustomEvent('share:update', { detail: updatedDetail }))

    expect(addEventListener).toHaveBeenCalledTimes(1)
    expect(addEventListener).toHaveBeenCalledWith('share:update', expect.any(Function))
    for (const anchor of root.anchors) {
      expect(anchor.setHref).toHaveBeenCalledTimes(1)
    }
  })

  test('uses the newest values on subsequent updates, including empty strings', () => {
    initializeShare()
    root.dispatchEvent(new CustomEvent('share:update', { detail: updatedDetail }))

    root.dispatchEvent(new CustomEvent('share:update', { detail: { url: '', title: '' } }))

    for (const { destination, href } of getShareLinks('', '')) {
      const anchor = root.anchors.find((anchor) => anchor.destination === destination)
      expect(anchor?.href).toBe(href)
      expect(anchor?.setHref).toHaveBeenCalledTimes(2)
    }
  })

  test('ignores unrelated custom events', () => {
    initializeShare()

    root.dispatchEvent(new CustomEvent('share:other', { detail: updatedDetail }))

    expect(root.querySelectorAll).not.toHaveBeenCalled()
  })

  test('handles missing destinations and updates every matching anchor without touching unknown destinations', () => {
    root.anchors = [
      new AnchorMock('telegram', 'first'),
      new AnchorMock('telegram', 'second'),
      new AnchorMock('unknown', 'leave-me-alone'),
    ]
    initializeShare()

    expect(() => root.dispatchEvent(new CustomEvent('share:update', { detail: updatedDetail }))).not.toThrow()

    const telegram = getShareLinks(updatedDetail.url, updatedDetail.title).find(
      ({ destination }) => destination === 'telegram'
    )
    if (!telegram) {
      throw new Error('Expected a Telegram share descriptor')
    }
    expect(root.anchors.map((anchor) => anchor.href)).toEqual([telegram.href, telegram.href, 'leave-me-alone'])
    expect(root.anchors[2]?.setHref).not.toHaveBeenCalled()
  })
})

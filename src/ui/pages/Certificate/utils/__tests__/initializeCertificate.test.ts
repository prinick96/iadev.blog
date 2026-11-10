import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import type { ShareUpdateDetail } from '@/ui/components/Share/types'
import { CERTIFICATE_LIMITS, DEFAULT_CERTIFICATE } from '@/ui/pages/Certificate/constants'
import type { CertificateValues } from '@/ui/pages/Certificate/types'
import { getCertificateUrl } from '@/ui/pages/Certificate/utils/getCertificateUrl'
import { initializeCertificate } from '@/ui/pages/Certificate/utils/initializeCertificate'

const initialHref = 'https://iadev.blog/certificate/?ref=one&ref=two#preview'
const hydratedValues: CertificateValues = {
  title: 'LLM & WIKI + «工程師»',
  name: 'María 李 🦊',
  description: '<script>alert("ascenso")</script>\nDos carpetas, mil cargos.\r\n100% + café',
}
const fieldNames: (keyof CertificateValues)[] = ['title', 'name', 'description']

class StyleMock {
  private currentHeight = ''
  setHeight = mock((_height: string) => {})

  get height(): string {
    return this.currentHeight
  }

  set height(value: string) {
    this.currentHeight = value
    this.setHeight(value)
  }
}

class FieldMock extends EventTarget {
  value = 'Server-rendered value'
  readOnly = true
  style = new StyleMock()
  scrollHeight = 20
  addEventListener = mock(
    (
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions
    ) => {
      super.addEventListener(type, listener, options)
    }
  )

  set innerHTML(_value: string) {
    throw new Error('Certificate fields must receive literal values, not HTML')
  }
}

class ShareRootMock extends EventTarget {
  dispatchEvent = mock((event: CustomEvent<ShareUpdateDetail>) => super.dispatchEvent(event))
}

class CertificateRootMock {
  dataset: Record<string, string> = {}

  clientWidth = 960
  title = new FieldMock()
  name = new FieldMock()
  description = new FieldMock()
  share = new ShareRootMock()
  nodes = new Map<string, FieldMock | ShareRootMock>([
    ['[data-certificate-field="title"]', this.title],
    ['[data-certificate-field="name"]', this.name],
    ['[data-certificate-field="description"]', this.description],
    ['[data-share]', this.share],
  ])
  querySelector = mock((selector: string) => this.nodes.get(selector) ?? null)
}

class DocumentMock extends EventTarget {
  root: CertificateRootMock | null = null
  unrelatedShare = new ShareRootMock()
  querySelector = mock((selector: string) => {
    if (selector === '[data-certificate]') {
      return this.root
    }
    return selector === '[data-share]' ? this.unrelatedShare : null
  })
  querySelectorAll = mock((_selector: string): ShareRootMock[] => [])
}

class HistoryMock {
  state: unknown = { navigation: { entry: 7 }, scroll: [0, 240] }
  replaceState = mock((state: unknown, _unused: string, url?: string | URL | null) => {
    this.state = state
    if (url !== undefined && url !== null) {
      this.location.href = String(url)
    }
  })
  pushState = mock((_state: unknown, _unused: string, _url?: string | URL | null) => {})

  constructor(private readonly location: { href: string }) {}
}

class WindowMock extends EventTarget {
  location = { href: initialHref }
  history = new HistoryMock(this.location)
  timers: { callback: () => void; delay: number }[] = []
  setTimeout = mock((callback: () => void, delay: number) => {
    this.timers.push({ callback, delay })
    return this.timers.length
  })
  addEventListener = mock(
    (
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions
    ) => {
      super.addEventListener(type, listener, options)
    }
  )
}

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = []
  observe = mock((_target: CertificateRootMock) => {})

  constructor(readonly callback: () => void) {
    ResizeObserverMock.instances.push(this)
  }
}

const originalGlobals = new Map(
  ['document', 'window', 'ResizeObserver'].map((name): [string, PropertyDescriptor | undefined] => [
    name,
    Object.getOwnPropertyDescriptor(globalThis, name),
  ])
)
let page: DocumentMock
let browser: WindowMock
let root: CertificateRootMock

function expectFields(values: CertificateValues): void {
  for (const field of fieldNames) {
    expect(root[field].value).toBe(values[field])
  }
}

function expectShare(values: CertificateValues, currentHref = browser.location.href): void {
  const event = root.share.dispatchEvent.mock.lastCall?.[0]
  expect(event?.type).toBe('share:update')
  expect(event?.bubbles).toBe(false)
  expect(event?.target).toBe(root.share)
  expect(event?.detail).toEqual({
    url: getCertificateUrl(new URL(currentHref), values).href,
    title: values.name ? `${values.name} — ${values.title}` : values.title,
  })
}

function runTimer(index = 0): void {
  const timer = browser.timers[index]
  if (!timer) {
    throw new Error(`No scheduled certificate callback at index ${index}`)
  }
  timer.callback()
}

beforeEach(() => {
  page = new DocumentMock()
  browser = new WindowMock()
  root = new CertificateRootMock()
  ResizeObserverMock.instances = []
  root.title.scrollHeight = 62
  root.description.scrollHeight = 122
  page.root = root
  Object.defineProperties(globalThis, {
    document: { configurable: true, value: page },
    window: { configurable: true, value: browser },
    ResizeObserver: { configurable: true, value: ResizeObserverMock },
  })
})

afterEach(() => {
  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) {
      Object.defineProperty(globalThis, name, descriptor)
    } else {
      Reflect.deleteProperty(globalThis, name)
    }
  }
  expect(browser.history.pushState).not.toHaveBeenCalled()
})

describe('initializeCertificate', () => {
  test('hydrates URL parameters as literal text, enables editing, resizes textareas and dispatches sharing', () => {
    browser.location.href = getCertificateUrl(new URL(initialHref), hydratedValues).href
    const hrefBefore = browser.location.href

    initializeCertificate()

    expectFields(hydratedValues)
    for (const field of fieldNames) {
      expect(root[field].readOnly).toBe(false)
      expect(root[field].addEventListener).toHaveBeenCalledWith('input', expect.any(Function))
      expect(root[field].addEventListener).toHaveBeenCalledWith('blur', expect.any(Function))
    }
    expect(root.title.style.setHeight.mock.calls).toEqual([['auto'], ['64px']])
    expect(root.description.style.setHeight.mock.calls).toEqual([['auto'], ['124px']])
    expect(root.name.style.setHeight).not.toHaveBeenCalled()
    expect(root.dataset.certificateReady).toBe('true')
    expectShare(hydratedValues)
    expect(browser.location.href).toBe(hrefBefore)
    expect(browser.history.replaceState).not.toHaveBeenCalled()
    expect(browser.setTimeout).not.toHaveBeenCalled()
  })

  test('observes certificate width changes and recalculates textarea heights without changing values or sharing', () => {
    initializeCertificate()
    expect(ResizeObserverMock.instances).toHaveLength(1)
    const observer = ResizeObserverMock.instances[0]
    if (!observer) {
      throw new Error('The certificate did not create its resize observer')
    }
    expect(observer.observe).toHaveBeenCalledTimes(1)
    expect(observer.observe.mock.lastCall?.[0]).toBe(root)
    const shareCallsBefore = root.share.dispatchEvent.mock.calls.length
    root.clientWidth = 480
    root.title.scrollHeight = 120
    root.description.scrollHeight = 240

    observer.callback()

    expect(root.title.style.setHeight.mock.calls).toEqual([['auto'], ['64px'], ['auto'], ['122px']])
    expect(root.description.style.setHeight.mock.calls).toEqual([['auto'], ['124px'], ['auto'], ['242px']])
    expect(root.name.style.setHeight).not.toHaveBeenCalled()
    expectFields(DEFAULT_CERTIFICATE)
    expect(root.share.dispatchEvent).toHaveBeenCalledTimes(shareCallsBefore)
    expect(browser.history.replaceState).not.toHaveBeenCalled()
    expect(browser.setTimeout).not.toHaveBeenCalled()

    root.clientWidth = 960
    root.title.scrollHeight = 62
    root.description.scrollHeight = 122
    observer.callback()

    expect(root.title.style.setHeight.mock.calls.slice(-2)).toEqual([['auto'], ['64px']])
    expect(root.description.style.setHeight.mock.calls.slice(-2)).toEqual([['auto'], ['124px']])
    expect(root.share.dispatchEvent).toHaveBeenCalledTimes(shareCallsBefore)
  })

  test('hydrates defaults for missing values and uses only the title when no name is present', () => {
    initializeCertificate()

    expectFields(DEFAULT_CERTIFICATE)
    expectShare(DEFAULT_CERTIFICATE)
    expect(browser.history.replaceState).not.toHaveBeenCalled()
  })

  test.each([
    { prefixOffset: 1, expectedEmoji: '' },
    { prefixOffset: 2, expectedEmoji: '🦊' },
  ])('hydrates boundary emojis without breaking the encoded share title: %p', ({ prefixOffset, expectedEmoji }) => {
    const prefixes = {
      title: 'T'.repeat(CERTIFICATE_LIMITS.title - prefixOffset),
      name: 'N'.repeat(CERTIFICATE_LIMITS.name - prefixOffset),
      description: 'D'.repeat(CERTIFICATE_LIMITS.description - prefixOffset),
    }
    browser.location.href = getCertificateUrl(new URL(initialHref), {
      title: `${prefixes.title}🦊`,
      name: `${prefixes.name}🦊`,
      description: `${prefixes.description}🦊`,
    }).href

    initializeCertificate()

    const values = {
      title: `${prefixes.title}${expectedEmoji}`,
      name: `${prefixes.name}${expectedEmoji}`,
      description: `${prefixes.description}${expectedEmoji}`,
    }
    expectFields(values)
    expectShare(values)
    expect(browser.history.replaceState).not.toHaveBeenCalled()
  })

  test('preserves explicit empty URL values and truncates oversized hydration fields', () => {
    browser.location.href = getCertificateUrl(new URL(initialHref), {
      title: 'T'.repeat(CERTIFICATE_LIMITS.title + 1),
      name: '',
      description: 'D'.repeat(CERTIFICATE_LIMITS.description + 1),
    }).href

    initializeCertificate()

    const values = {
      title: 'T'.repeat(CERTIFICATE_LIMITS.title),
      name: '',
      description: 'D'.repeat(CERTIFICATE_LIMITS.description),
    }
    expectFields(values)
    expectShare(values)
    expect(browser.history.replaceState).not.toHaveBeenCalled()
  })

  test.each(fieldNames)(
    'updates share immediately on %s input and replaces the URL only after the 200ms callback',
    (field) => {
      initializeCertificate()
      const stateBefore = browser.history.state
      const hrefBefore = browser.location.href
      const values = { ...DEFAULT_CERTIFICATE, [field]: 'Editado & + 李\n<script>texto</script>' }
      root[field].value = values[field]
      root.title.scrollHeight = 80
      root.description.scrollHeight = 160

      root[field].dispatchEvent(new Event('input'))

      expectShare(values)
      expect(root.share.dispatchEvent).toHaveBeenCalledTimes(2)
      expect(root.title.style.setHeight.mock.calls.slice(-2)).toEqual([['auto'], ['82px']])
      expect(root.description.style.setHeight.mock.calls.slice(-2)).toEqual([['auto'], ['162px']])
      expect(browser.setTimeout).toHaveBeenCalledWith(expect.any(Function), 200)
      expect(browser.timers).toHaveLength(1)
      expect(browser.timers[0]?.delay).toBe(200)
      expect(browser.location.href).toBe(hrefBefore)
      expect(browser.history.replaceState).not.toHaveBeenCalled()

      runTimer()

      const expectedUrl = getCertificateUrl(new URL(hrefBefore), values)
      expect(browser.history.replaceState).toHaveBeenCalledTimes(1)
      expect(browser.history.replaceState).toHaveBeenCalledWith(stateBefore, '', expectedUrl.href)
      expect(browser.history.state).toBe(stateBefore)
      expect(browser.location.href).toBe(expectedUrl.href)
      expect(expectedUrl.searchParams.getAll('ref')).toEqual(['one', 'two'])
      expect(expectedUrl.hash).toBe('#preview')
      expect(root.share.dispatchEvent).toHaveBeenCalledTimes(2)
    }
  )

  test('uses the current history state at commit time instead of capturing an older state', () => {
    initializeCertificate()
    root.name.value = 'Nombre nuevo'
    root.name.dispatchEvent(new Event('input'))
    const newerState = Object.freeze({ entry: 'updated by another component' })
    browser.history.state = newerState

    runTimer()

    expect(browser.history.replaceState.mock.lastCall?.[0]).toBe(newerState)
    expect(browser.history.state).toBe(newerState)
  })

  test.each(fieldNames)('flushes %s edits on blur and makes the later timer a no-op', (field) => {
    initializeCertificate()
    const stateBefore = browser.history.state
    root[field].value = 'Guardar sin esperar al algoritmo'
    root[field].dispatchEvent(new Event('input'))
    expect(browser.history.replaceState).not.toHaveBeenCalled()

    root[field].dispatchEvent(new Event('blur'))

    const values = { ...DEFAULT_CERTIFICATE, [field]: root[field].value }
    expect(browser.history.replaceState).toHaveBeenCalledTimes(1)
    expect(browser.history.replaceState).toHaveBeenCalledWith(
      stateBefore,
      '',
      getCertificateUrl(new URL(initialHref), values).href
    )
    runTimer()
    expect(browser.history.replaceState).toHaveBeenCalledTimes(1)
    expectShare(values)
  })

  test('ignores stale timers after a newer input and never overwrites the newer URL', () => {
    initializeCertificate()
    root.name.value = 'Primera edición'
    root.name.dispatchEvent(new Event('input'))
    root.name.value = 'Última edición'
    root.name.dispatchEvent(new Event('input'))
    const latestValues = { ...DEFAULT_CERTIFICATE, name: 'Última edición' }
    expectShare(latestValues)
    expect(browser.timers).toHaveLength(2)

    runTimer(0)

    expect(browser.history.replaceState).not.toHaveBeenCalled()
    expect(browser.location.href).toBe(initialHref)

    runTimer(1)
    const latestHref = browser.location.href
    expect(browser.history.replaceState).toHaveBeenCalledTimes(1)
    expect(latestHref).toBe(getCertificateUrl(new URL(initialHref), latestValues).href)

    runTimer(0)
    expect(browser.history.replaceState).toHaveBeenCalledTimes(1)
    expect(browser.location.href).toBe(latestHref)
  })

  test('skips replacing an already current URL', () => {
    browser.location.href = getCertificateUrl(new URL(initialHref), DEFAULT_CERTIFICATE).href
    initializeCertificate()
    root.title.dispatchEvent(new Event('input'))

    runTimer()
    root.title.dispatchEvent(new Event('blur'))

    expect(browser.history.replaceState).not.toHaveBeenCalled()
  })

  test('restores fields, sizes and sharing on popstate without rewriting history or accepting a stale timer', () => {
    initializeCertificate()
    root.name.value = 'Edición pendiente'
    root.name.dispatchEvent(new Event('input'))
    const stateBefore = browser.history.state
    const restoredHref = getCertificateUrl(
      new URL('https://iadev.blog/certificate/?ref=restored#back'),
      hydratedValues
    ).href
    browser.location.href = restoredHref
    root.title.scrollHeight = 100
    root.description.scrollHeight = 200

    browser.dispatchEvent(new Event('popstate'))

    expectFields(hydratedValues)
    expectShare(hydratedValues)
    expect(root.title.style.setHeight.mock.calls.slice(-2)).toEqual([['auto'], ['102px']])
    expect(root.description.style.setHeight.mock.calls.slice(-2)).toEqual([['auto'], ['202px']])
    expect(browser.location.href).toBe(restoredHref)
    expect(browser.history.replaceState).not.toHaveBeenCalled()
    expect(browser.history.state).toBe(stateBefore)
    expect(browser.setTimeout).toHaveBeenCalledTimes(1)

    runTimer()

    expect(browser.history.replaceState).not.toHaveBeenCalled()
    expect(browser.location.href).toBe(restoredHref)
  })

  test('restores defaults and explicit empty fields on subsequent popstate events', () => {
    browser.location.href = getCertificateUrl(new URL(initialHref), hydratedValues).href
    initializeCertificate()
    browser.location.href = initialHref

    browser.dispatchEvent(new Event('popstate'))

    expectFields(DEFAULT_CERTIFICATE)
    expectShare(DEFAULT_CERTIFICATE)
    browser.location.href = 'https://iadev.blog/certificate/?title=&name=&description='
    browser.dispatchEvent(new Event('popstate'))
    expectFields({ title: '', name: '', description: '' })
    expectShare({ title: '', name: '', description: '' })
    expect(browser.history.replaceState).not.toHaveBeenCalled()
  })

  test('dispatches updates only on the share root belonging to the certificate', () => {
    initializeCertificate()
    root.name.value = 'Solo este certificado'
    root.name.dispatchEvent(new Event('input'))

    expectShare({ ...DEFAULT_CERTIFICATE, name: root.name.value })
    expect(root.share.dispatchEvent).toHaveBeenCalledTimes(2)
    expect(page.unrelatedShare.dispatchEvent).not.toHaveBeenCalled()
    expect(page.querySelector.mock.calls).toEqual([['[data-certificate]']])
    expect(root.querySelector).toHaveBeenCalledWith('[data-share]')
  })

  test('does nothing when the certificate root is missing', () => {
    page.root = null

    expect(initializeCertificate).not.toThrow()

    expect(root.querySelector).not.toHaveBeenCalled()
    expect(page.querySelectorAll).not.toHaveBeenCalled()
    expect(ResizeObserverMock.instances).toHaveLength(0)
    expect(browser.addEventListener).not.toHaveBeenCalled()
    expect(browser.setTimeout).not.toHaveBeenCalled()
    expect(browser.history.replaceState).not.toHaveBeenCalled()
  })

  test.each([
    '[data-certificate-field="title"]',
    '[data-certificate-field="name"]',
    '[data-certificate-field="description"]',
    '[data-share]',
  ])('keeps the certificate inert when required markup is missing: %s', (selector) => {
    root.nodes.delete(selector)

    expect(initializeCertificate).not.toThrow()

    expect(root.dataset.certificateReady).toBeUndefined()
    expect(ResizeObserverMock.instances).toHaveLength(0)
    expect(root.share.dispatchEvent).not.toHaveBeenCalled()
    expect(page.querySelectorAll).not.toHaveBeenCalled()
    expect(browser.addEventListener).not.toHaveBeenCalled()
    expect(browser.history.replaceState).not.toHaveBeenCalled()
    for (const field of fieldNames) {
      expect(root[field].value).toBe('Server-rendered value')
      expect(root[field].readOnly).toBe(true)
      expect(root[field].addEventListener).not.toHaveBeenCalled()
    }
  })

  test('initializes only once without rehydrating unsaved input or registering duplicate listeners', () => {
    initializeCertificate()
    root.name.value = 'Edición sin guardar'

    initializeCertificate()

    expect(root.name.value).toBe('Edición sin guardar')
    expect(ResizeObserverMock.instances).toHaveLength(1)
    expect(ResizeObserverMock.instances[0]?.observe).toHaveBeenCalledTimes(1)
    expect(root.share.dispatchEvent).toHaveBeenCalledTimes(1)
    expect(root.querySelector).toHaveBeenCalledTimes(4)
    expect(page.querySelectorAll).toHaveBeenCalledTimes(1)
    expect(browser.addEventListener).toHaveBeenCalledTimes(1)
    expect(browser.addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function))
    for (const field of fieldNames) {
      expect(root[field].addEventListener).toHaveBeenCalledTimes(2)
    }
    root.name.dispatchEvent(new Event('input'))
    expect(browser.setTimeout).toHaveBeenCalledTimes(1)
    expectShare({ ...DEFAULT_CERTIFICATE, name: root.name.value })
  })

  test('does not inspect or wire an already initialized root', () => {
    root.dataset.certificateReady = 'true'

    initializeCertificate()

    expect(root.querySelector).not.toHaveBeenCalled()
    expect(page.querySelectorAll).not.toHaveBeenCalled()
    expect(ResizeObserverMock.instances).toHaveLength(0)
    expect(root.share.dispatchEvent).not.toHaveBeenCalled()
    expect(browser.addEventListener).not.toHaveBeenCalled()
  })
})

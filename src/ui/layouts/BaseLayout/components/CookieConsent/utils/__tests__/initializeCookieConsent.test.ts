import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_LIFETIME } from '@/core/constants/cookies'
import { initializeCookieConsent } from '@/ui/layouts/BaseLayout/components/CookieConsent/utils/initializeCookieConsent'
import { WIDGET_DISMISSAL_KEY } from '@/ui/layouts/BaseLayout/components/SaasIsDead/constants'
import * as widgetLoader from '@/ui/layouts/BaseLayout/components/SaasIsDead/utils/loadSaasIsDead'

class ElementMock extends EventTarget {
  dataset: Record<string, string> = {}
  hidden = true
  textContent = ''
  checked = false
  open = false
  focus = mock(() => {})
  replaceChildren = mock(() => {})
  children = new Map<string, ElementMock>()
  feedback: ElementMock[] = []
  showModal = mock(() => {
    this.open = true
  })
  close = mock(() => {
    this.open = false
  })

  querySelector(selector: string): ElementMock | null {
    return this.children.get(selector) ?? null
  }

  querySelectorAll(): ElementMock[] {
    return this.feedback
  }

  click(): void {
    this.dispatchEvent(new Event('click'))
  }
}

class StorageMock {
  values = new Map<string, string>()
  getItem = mock((key: string) => this.values.get(key) ?? null)
  setItem = mock((key: string, value: string) => {
    this.values.set(key, value)
  })
  removeItem = mock((key: string) => {
    this.values.delete(key)
  })
}

class WindowMock extends EventTarget {
  localStorage = new StorageMock()
  location = { reload: mock(() => {}) }
}

class DocumentMock extends EventTarget {
  root: ElementMock | null = null
  mount = new ElementMock()
  triggers: ElementMock[] = []

  querySelector(selector: string): ElementMock | null {
    if (selector === '[data-cookie-consent]') {
      return this.root
    }
    return selector === '[data-saas-is-dead-mount]' ? this.mount : null
  }

  querySelectorAll(): ElementMock[] {
    return this.triggers
  }
}

const originals = Object.fromEntries(
  ['window', 'document', 'localStorage'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
)
const now = Date.UTC(2026, 10, 5)
let browser: WindowMock
let page: DocumentMock
let root: ElementMock
let trigger: ElementMock
let banner: ElementMock
let dialog: ElementMock
let checkbox: ElementMock
let form: ElementMock
let accept: ElementMock
let reject: ElementMock
let configure: ElementMock
let cancel: ElementMock
let feedback: ElementMock
let loadSpy = spyOn(widgetLoader, 'loadSaasIsDead')
let clock = spyOn(Date, 'now')

function setConsent(widget: boolean, savedAt = now): void {
  browser.localStorage.values.set(
    COOKIE_CONSENT_KEY,
    JSON.stringify({ version: 1, widget, savedAt, expiresAt: savedAt + COOKIE_CONSENT_LIFETIME })
  )
}

beforeEach(() => {
  browser = new WindowMock()
  page = new DocumentMock()
  root = new ElementMock()
  trigger = new ElementMock()
  banner = new ElementMock()
  dialog = new ElementMock()
  checkbox = new ElementMock()
  form = new ElementMock()
  accept = new ElementMock()
  reject = new ElementMock()
  configure = new ElementMock()
  cancel = new ElementMock()
  feedback = new ElementMock()
  root.children = new Map([
    ['[data-cookie-banner]', banner],
    ['#cookie-preferences', dialog],
    ['[data-cookie-widget]', checkbox],
    ['[data-cookie-form]', form],
    ['[data-cookie-accept]', accept],
    ['[data-cookie-reject]', reject],
    ['[data-cookie-configure]', configure],
    ['[data-cookie-cancel]', cancel],
  ])
  root.feedback = [feedback]
  page.root = root
  page.triggers = [trigger]
  loadSpy = spyOn(widgetLoader, 'loadSaasIsDead').mockResolvedValue(undefined)
  clock = spyOn(Date, 'now').mockReturnValue(now)
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser })
  Object.defineProperty(globalThis, 'document', { configurable: true, value: page })
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: browser.localStorage })
})

afterEach(() => {
  loadSpy.mockRestore()
  clock.mockRestore()
  for (const [key, descriptor] of Object.entries(originals)) {
    if (descriptor) {
      Object.defineProperty(globalThis, key, descriptor)
    } else {
      Reflect.deleteProperty(globalThis, key)
    }
  }
})

describe('initializeCookieConsent', () => {
  test('does nothing when the consent root is absent', () => {
    page.root = null
    initializeCookieConsent()
    expect(trigger.hidden).toBe(true)
    expect(browser.localStorage.getItem).not.toHaveBeenCalled()
    expect(page.mount.replaceChildren).not.toHaveBeenCalled()
    expect(loadSpy).not.toHaveBeenCalled()
  })

  test.each(['[data-cookie-banner]', '#cookie-preferences', '[data-cookie-form]', '[data-cookie-widget]'])(
    'does nothing when required markup is missing: %s',
    (selector) => {
      root.children.delete(selector)
      initializeCookieConsent()
      expect(root.dataset.initialized).toBeUndefined()
      expect(trigger.hidden).toBe(true)
      expect(browser.localStorage.getItem).not.toHaveBeenCalled()
      expect(browser.localStorage.removeItem).not.toHaveBeenCalled()
      expect(loadSpy).not.toHaveBeenCalled()
    }
  )

  test('shows the banner and blocks optional content before a saved decision', () => {
    browser.localStorage.values.set(WIDGET_DISMISSAL_KEY, 'old dismissal')
    browser.localStorage.values.set('unrelated', 'keep')
    initializeCookieConsent()
    expect(root.dataset.initialized).toBe('true')
    expect(banner.hidden).toBe(false)
    expect(trigger.hidden).toBe(false)
    expect(loadSpy).not.toHaveBeenCalled()
    expect(page.mount.replaceChildren).toHaveBeenCalledTimes(1)
    expect(browser.localStorage.getItem).toHaveBeenCalledWith(COOKIE_CONSENT_KEY)
    expect(browser.localStorage.values.has(WIDGET_DISMISSAL_KEY)).toBe(false)
    expect(browser.localStorage.values.get('unrelated')).toBe('keep')
  })

  test('reads consent and loads the authorized widget only once for the same root', () => {
    setConsent(true)
    initializeCookieConsent()
    initializeCookieConsent()
    initializeCookieConsent()
    expect(browser.localStorage.getItem).toHaveBeenCalledTimes(1)
    expect(banner.hidden).toBe(true)
    expect(loadSpy).toHaveBeenCalledTimes(1)
    expect(loadSpy.mock.calls[0]?.[0].aborted).toBe(false)
    expect(loadSpy.mock.calls[0]?.[1]()).toBe(true)
    expect(page.mount.replaceChildren).not.toHaveBeenCalled()
    accept.click()
    expect(browser.localStorage.setItem).toHaveBeenCalledTimes(1)
    expect(browser.location.reload).toHaveBeenCalledTimes(1)
    expect(loadSpy).toHaveBeenCalledTimes(1)
    expect(browser.localStorage.getItem).toHaveBeenCalledTimes(1)
  })

  test('remembers rejection without loading optional content', () => {
    setConsent(false)
    initializeCookieConsent()
    expect(banner.hidden).toBe(true)
    expect(loadSpy).not.toHaveBeenCalled()
    expect(page.mount.replaceChildren).toHaveBeenCalledTimes(1)
    trigger.click()
    expect(checkbox.checked).toBe(false)
  })

  test.each([
    '{not json',
    JSON.stringify({ widget: true }),
    JSON.stringify({ version: 1, widget: true, savedAt: now - COOKIE_CONSENT_LIFETIME, expiresAt: now }),
  ])('blocks optional content for damaged or expired consent: %s', (raw) => {
    browser.localStorage.values.set(COOKIE_CONSENT_KEY, raw)
    initializeCookieConsent()
    expect(banner.hidden).toBe(false)
    expect(loadSpy).not.toHaveBeenCalled()
    expect(page.mount.replaceChildren).toHaveBeenCalledTimes(1)
    configure.click()
    expect(checkbox.checked).toBe(false)
  })

  test('opens configuration unchecked and cancellation makes no decision', () => {
    initializeCookieConsent()
    checkbox.checked = true
    feedback.textContent = 'Previous failure'
    feedback.hidden = false
    configure.click()
    expect(dialog.open).toBe(true)
    expect(checkbox.checked).toBe(false)
    expect(feedback.textContent).toBe('')
    expect(feedback.hidden).toBe(true)
    configure.click()
    expect(dialog.showModal).toHaveBeenCalledTimes(1)
    checkbox.checked = true
    cancel.click()
    expect(dialog.open).toBe(false)
    trigger.click()
    expect(checkbox.checked).toBe(false)
    expect(browser.localStorage.setItem).not.toHaveBeenCalled()
    expect(browser.location.reload).not.toHaveBeenCalled()
    expect(loadSpy).not.toHaveBeenCalled()
    expect(trigger.focus).not.toHaveBeenCalled()
    expect(configure.focus).not.toHaveBeenCalled()
  })

  test('reveals and wires every preference trigger without manually restoring focus', () => {
    const secondTrigger = new ElementMock()
    page.triggers.push(secondTrigger)
    setConsent(true)
    initializeCookieConsent()
    for (const opener of page.triggers) {
      expect(opener.hidden).toBe(false)
      opener.click()
      expect(dialog.open).toBe(true)
      expect(checkbox.checked).toBe(true)
      cancel.click()
      expect(dialog.open).toBe(false)
      expect(opener.focus).not.toHaveBeenCalled()
    }
    expect(dialog.showModal).toHaveBeenCalledTimes(2)
    expect(browser.localStorage.getItem).toHaveBeenCalledTimes(1)
  })

  test.each([true, false])('prevents form navigation and saves checkbox value %s before reloading', (widget) => {
    initializeCookieConsent()
    configure.click()
    checkbox.checked = widget
    const event = new Event('submit', { cancelable: true })
    form.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(browser.localStorage.values.get(COOKIE_CONSENT_KEY)).toBe(
      JSON.stringify({ version: 1, widget, savedAt: now, expiresAt: now + COOKIE_CONSENT_LIFETIME })
    )
    expect(dialog.open).toBe(false)
    expect(browser.location.reload).toHaveBeenCalledTimes(1)
    expect(loadSpy).not.toHaveBeenCalled()
  })

  test.each([true, false])('does not synchronize with another tab changing consent to %s', (widget) => {
    setConsent(!widget)
    initializeCookieConsent()
    setConsent(widget)
    for (const event of ['storage', 'focus', 'pageshow']) {
      browser.dispatchEvent(new Event(event))
    }
    page.dispatchEvent(new Event('visibilitychange'))
    trigger.click()
    expect(checkbox.checked).toBe(!widget)
    expect(loadSpy).toHaveBeenCalledTimes(widget ? 0 : 1)
    expect(browser.localStorage.getItem).toHaveBeenCalledTimes(1)
    expect(browser.location.reload).not.toHaveBeenCalled()
  })

  test('checks initial authorization and current expiry without rereading storage', () => {
    setConsent(true)
    initializeCookieConsent()
    const isAllowed = loadSpy.mock.calls[0]?.[1]
    if (!isAllowed) {
      throw new Error('The widget loader did not receive its permission callback')
    }
    setConsent(false)
    expect(isAllowed()).toBe(true)
    clock.mockReturnValue(now + COOKIE_CONSENT_LIFETIME)
    expect(isAllowed()).toBe(false)
    trigger.click()
    expect(checkbox.checked).toBe(false)
    expect(browser.localStorage.getItem).toHaveBeenCalledTimes(1)
  })

  test('initializes safely with blocked storage and keeps optional content disabled', () => {
    browser.localStorage.getItem.mockImplementation(() => {
      throw new Error('Storage access denied')
    })
    browser.localStorage.removeItem.mockImplementation(() => {
      throw new Error('Storage access denied')
    })
    expect(initializeCookieConsent).not.toThrow()
    expect(banner.hidden).toBe(false)
    expect(trigger.hidden).toBe(false)
    expect(page.mount.replaceChildren).toHaveBeenCalledTimes(1)
    expect(loadSpy).not.toHaveBeenCalled()
  })

  test('reports an initial widget loading failure without changing saved consent', async () => {
    setConsent(true)
    const saved = browser.localStorage.values.get(COOKIE_CONSENT_KEY)
    loadSpy.mockRejectedValue(new Error('Offline'))
    initializeCookieConsent()
    await Promise.resolve()
    expect(feedback.textContent).toContain('No se ha podido cargar')
    expect(feedback.hidden).toBe(false)
    expect(banner.hidden).toBe(true)
    expect(browser.localStorage.values.get(COOKIE_CONSENT_KEY)).toBe(saved)
    expect(browser.localStorage.setItem).not.toHaveBeenCalled()
    expect(browser.location.reload).not.toHaveBeenCalled()
  })

  test('aborts pending loading on rejection and ignores its late failure', async () => {
    const pending = Promise.withResolvers<void>()
    loadSpy.mockReturnValue(pending.promise)
    setConsent(true)
    initializeCookieConsent()
    reject.click()
    pending.reject(new Error('Aborted upstream request'))
    await Promise.resolve()
    expect(loadSpy.mock.calls[0]?.[0].aborted).toBe(true)
    expect(loadSpy.mock.calls[0]?.[1]()).toBe(false)
    expect(feedback.textContent).toBe('')
    expect(feedback.hidden).toBe(true)
    expect(browser.location.reload).toHaveBeenCalledTimes(1)
  })

  test('keeps a failed rejection blocked and preserves its feedback after a late loader failure', async () => {
    const pending = Promise.withResolvers<void>()
    loadSpy.mockReturnValue(pending.promise)
    setConsent(true)
    initializeCookieConsent()
    browser.localStorage.setItem.mockImplementation(() => {
      throw new Error('Quota exceeded')
    })
    trigger.click()
    reject.click()
    const message = feedback.textContent
    pending.reject(new Error('Aborted upstream request'))
    await Promise.resolve()
    expect(loadSpy.mock.calls[0]?.[0].aborted).toBe(true)
    expect(loadSpy.mock.calls[0]?.[1]()).toBe(false)
    expect(message.toLowerCase()).toContain('no se ha podido guardar el rechazo')
    expect(feedback.textContent).toBe(message)
    expect(feedback.hidden).toBe(false)
    expect(dialog.open).toBe(false)
    expect(banner.hidden).toBe(true)
    trigger.click()
    expect(checkbox.checked).toBe(false)
    expect(browser.localStorage.getItem).toHaveBeenCalledTimes(1)
    expect(browser.location.reload).not.toHaveBeenCalled()
  })

  test('retries a failed acceptance by persisting and reloading without loading in place', () => {
    initializeCookieConsent()
    configure.click()
    browser.localStorage.setItem.mockImplementationOnce(() => {
      throw new Error('Quota exceeded')
    })
    accept.click()
    expect(feedback.hidden).toBe(false)
    expect(dialog.open).toBe(true)
    expect(banner.hidden).toBe(false)
    expect(checkbox.checked).toBe(false)
    expect(browser.location.reload).not.toHaveBeenCalled()
    accept.click()
    expect(feedback.hidden).toBe(true)
    expect(feedback.textContent).toBe('')
    expect(dialog.open).toBe(false)
    expect(browser.localStorage.setItem).toHaveBeenCalledTimes(2)
    expect(browser.localStorage.values.get(COOKIE_CONSENT_KEY)).toBe(
      JSON.stringify({ version: 1, widget: true, savedAt: now, expiresAt: now + COOKIE_CONSENT_LIFETIME })
    )
    expect(browser.location.reload).toHaveBeenCalledTimes(1)
    expect(loadSpy).not.toHaveBeenCalled()
    expect(browser.localStorage.getItem).toHaveBeenCalledTimes(1)
  })
})

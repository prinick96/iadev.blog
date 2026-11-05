import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_LIFETIME } from '@/core/constants/cookies'
import { saveCookieConsentService } from '@/core/logic/cookies/services/index'
import type { ConsentElements } from '@/ui/layouts/BaseLayout/components/CookieConsent/types'
import { saveCookieConsentPreferences } from '@/ui/layouts/BaseLayout/components/CookieConsent/utils/saveCookieConsentPreferences'
import { WIDGET_DISMISSAL_KEY } from '@/ui/layouts/BaseLayout/components/SaasIsDead/constants'

class ElementMock {
  hidden = false
  checked = true
  open = true
  textContent = 'Previous failure'
  replaceChildren = mock(() => {})
  close = mock(() => {
    this.open = false
  })
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

const originals = Object.fromEntries(
  ['window', 'document', 'localStorage'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
)
const now = Date.UTC(2026, 10, 5)
let storage: StorageMock
let banner: ElementMock
let dialog: ElementMock
let checkbox: ElementMock
let feedback: ElementMock[]
let mount: ElementMock
let controller: AbortController
let elements: ConsentElements
const reload = mock(() => {})
let clock = spyOn(Date, 'now')
let saveSpy = spyOn(saveCookieConsentService, 'execute')

function getElements(): ConsentElements {
  const consentBanner = document.querySelector<HTMLElement>('[data-cookie-banner]')
  const consentDialog = document.querySelector<HTMLDialogElement>('#cookie-preferences')
  const consentCheckbox = document.querySelector<HTMLInputElement>('[data-cookie-widget]')
  if (!consentBanner || !consentDialog || !consentCheckbox) {
    throw new Error('The consent fixture is missing required markup')
  }
  return {
    banner: consentBanner,
    dialog: consentDialog,
    checkbox: consentCheckbox,
    feedback: document.querySelectorAll<HTMLElement>('[data-cookie-feedback]'),
  }
}

beforeEach(() => {
  storage = new StorageMock()
  banner = new ElementMock()
  dialog = new ElementMock()
  checkbox = new ElementMock()
  feedback = [new ElementMock(), new ElementMock()]
  mount = new ElementMock()
  controller = new AbortController()
  reload.mockReset()
  clock = spyOn(Date, 'now').mockReturnValue(now)
  saveSpy = spyOn(saveCookieConsentService, 'execute')
  const nodes = new Map([
    ['[data-cookie-banner]', banner],
    ['#cookie-preferences', dialog],
    ['[data-cookie-widget]', checkbox],
    ['[data-saas-is-dead-mount]', mount],
  ])
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      querySelector: (selector: string) => nodes.get(selector) ?? null,
      querySelectorAll: () => feedback,
    },
  })
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { reload } } })
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage })
  elements = getElements()
})

afterEach(() => {
  clock.mockRestore()
  saveSpy.mockRestore()
  for (const [key, descriptor] of Object.entries(originals)) {
    if (descriptor) {
      Object.defineProperty(globalThis, key, descriptor)
    } else {
      Reflect.deleteProperty(globalThis, key)
    }
  }
})

describe('saveCookieConsentPreferences', () => {
  test.each([true, false])('persists widget %s, clears feedback and closes the dialog before reloading', (widget) => {
    storage.values.set(WIDGET_DISMISSAL_KEY, 'old dismissal')
    const saved = JSON.stringify({ version: 1, widget, savedAt: now, expiresAt: now + COOKIE_CONSENT_LIFETIME })
    reload.mockImplementation(() => {
      expect(storage.values.get(COOKIE_CONSENT_KEY)).toBe(saved)
      expect(dialog.close).toHaveBeenCalledTimes(1)
      expect(dialog.open).toBe(false)
      expect(controller.signal.aborted).toBe(!widget)
      for (const element of feedback) {
        expect(element.textContent).toBe('')
        expect(element.hidden).toBe(true)
      }
    })
    saveCookieConsentPreferences(widget, elements, controller)
    expect(saveSpy).toHaveBeenCalledWith({ widget })
    expect(storage.setItem).toHaveBeenCalledTimes(1)
    expect(storage.setItem).toHaveBeenCalledWith(COOKIE_CONSENT_KEY, saved)
    expect(storage.getItem).not.toHaveBeenCalled()
    expect(reload).toHaveBeenCalledTimes(1)
    if (widget) {
      expect(mount.replaceChildren).not.toHaveBeenCalled()
      expect(storage.removeItem).not.toHaveBeenCalled()
      expect(storage.values.get(WIDGET_DISMISSAL_KEY)).toBe('old dismissal')
    } else {
      expect(mount.replaceChildren).toHaveBeenCalledTimes(1)
      expect(storage.removeItem).toHaveBeenCalledTimes(1)
      expect(storage.removeItem).toHaveBeenCalledWith(WIDGET_DISMISSAL_KEY)
      expect(storage.values.has(WIDGET_DISMISSAL_KEY)).toBe(false)
    }
  })

  test.each([true, false])('blocks the widget after a failed save of %s even when legacy cleanup fails', (widget) => {
    const previous = JSON.stringify({
      version: 1,
      widget: true,
      savedAt: now,
      expiresAt: now + COOKIE_CONSENT_LIFETIME,
    })
    storage.values.set(COOKIE_CONSENT_KEY, previous)
    storage.setItem.mockImplementation(() => {
      throw new Error('Storage write denied')
    })
    storage.removeItem.mockImplementation(() => {
      throw new Error('Storage removal denied')
    })
    expect(() => saveCookieConsentPreferences(widget, elements, controller)).not.toThrow()
    expect(saveSpy).toHaveBeenCalledWith({ widget })
    expect(storage.setItem).toHaveBeenCalledTimes(1)
    expect(storage.values.get(COOKIE_CONSENT_KEY)).toBe(previous)
    expect(storage.getItem).not.toHaveBeenCalled()
    expect(storage.removeItem).toHaveBeenCalledTimes(1)
    expect(storage.removeItem).toHaveBeenCalledWith(WIDGET_DISMISSAL_KEY)
    expect(controller.signal.aborted).toBe(true)
    expect(mount.replaceChildren).toHaveBeenCalledTimes(1)
    expect(checkbox.checked).toBe(false)
    expect(banner.hidden).toBe(!widget)
    expect(dialog.open).toBe(widget)
    expect(dialog.close).toHaveBeenCalledTimes(widget ? 0 : 1)
    expect(reload).not.toHaveBeenCalled()
    for (const element of feedback) {
      expect(element.hidden).toBe(false)
      expect(element.textContent.toLowerCase()).toContain('no se ha podido guardar')
      expect(element.textContent.toLowerCase()).toContain(
        widget ? 'el widget sigue bloqueado' : 'widget desactivado en esta página'
      )
    }
  })

  test('keeps a failed banner acceptance visible without opening a closed dialog', () => {
    dialog.open = false
    storage.setItem.mockImplementation(() => {
      throw new Error('Storage write denied')
    })
    saveCookieConsentPreferences(true, elements, controller)
    expect(dialog.open).toBe(false)
    expect(dialog.close).not.toHaveBeenCalled()
    expect(banner.hidden).toBe(false)
    expect(controller.signal.aborted).toBe(true)
    expect(reload).not.toHaveBeenCalled()
  })
})

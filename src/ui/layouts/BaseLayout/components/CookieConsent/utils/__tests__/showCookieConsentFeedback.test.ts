import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { showCookieConsentFeedback } from '@/ui/layouts/BaseLayout/components/CookieConsent/utils/showCookieConsentFeedback'

const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
let feedback: { textContent: string; hidden: boolean }[]

beforeEach(() => {
  feedback = [
    { textContent: '', hidden: true },
    { textContent: 'Previous failure', hidden: false },
  ]
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { querySelectorAll: () => feedback },
  })
})

afterEach(() => {
  if (originalDocument) {
    Object.defineProperty(globalThis, 'document', originalDocument)
  } else {
    Reflect.deleteProperty(globalThis, 'document')
  }
})

describe('showCookieConsentFeedback', () => {
  test('sets literal text and reveals every feedback element', () => {
    const message = '<strong>No se ha podido guardar tu elección.</strong>'
    showCookieConsentFeedback(document.querySelectorAll<HTMLElement>('[data-cookie-feedback]'), message)
    expect(feedback).toEqual([
      { textContent: message, hidden: false },
      { textContent: message, hidden: false },
    ])
  })

  test('clears text and hides every feedback element for an empty message', () => {
    showCookieConsentFeedback(document.querySelectorAll<HTMLElement>('[data-cookie-feedback]'), '')
    expect(feedback).toEqual([
      { textContent: '', hidden: true },
      { textContent: '', hidden: true },
    ])
  })

  test('accepts an empty feedback collection', () => {
    feedback = []
    expect(() => {
      showCookieConsentFeedback(document.querySelectorAll<HTMLElement>('[data-cookie-feedback]'), 'Storage unavailable')
    }).not.toThrow()
    expect(feedback).toEqual([])
  })
})

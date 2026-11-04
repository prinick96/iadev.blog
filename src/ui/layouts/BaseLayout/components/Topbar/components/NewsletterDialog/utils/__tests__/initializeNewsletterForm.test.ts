import { afterEach, beforeEach, describe, expect, type Mock, mock, spyOn, test } from 'bun:test'
import type { SubscribeToNewsletterInput } from '@/core/logic/newsletter/domain/Inputs'
import type { SubscriptionResult } from '@/core/logic/newsletter/domain/SubscriptionResult'
import { SubscriptionStatus } from '@/core/logic/newsletter/domain/SubscriptionStatus'
import { subscribeToNewsletterService } from '@/core/logic/newsletter/services/index'
import { initializeNewsletterForm } from '@/ui/layouts/BaseLayout/components/Topbar/components/NewsletterDialog/utils/initializeNewsletterForm'

class ElementMock {
  hidden: boolean
  private attributes = new Map<string, string>()
  focus = mock(() => {})

  constructor(hidden = false) {
    this.hidden = hidden
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value)
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name)
  }
}

class InputMock extends ElementMock {
  value = ''
}

class FieldSetMock extends ElementMock {
  disabled = true
}

type SubmitListener = (event: { preventDefault: () => void }) => Promise<void>

class FormMock extends ElementMock {
  dataset: { newsletterReady?: string } = {}
  email = new InputMock()
  honeypot = new InputMock()
  fields = new FieldSetMock()
  submitLabel = new ElementMock()
  submitting = new ElementMock(true)
  feedback = new ElementMock()
  invalidEmail = new ElementMock(true)
  error = new ElementMock(true)
  success = new ElementMock(true)
  private nodes: Record<string, ElementMock> = {
    '#newsletter-email': this.email,
    'input[name="email_address_check"]': this.honeypot,
    'fieldset[data-newsletter-fields]': this.fields,
    '[data-newsletter-submit-label]': this.submitLabel,
    '[data-newsletter-submitting]': this.submitting,
    '[data-newsletter-feedback]': this.feedback,
    '[data-newsletter-invalid]': this.invalidEmail,
    '[data-newsletter-error]': this.error,
    '[data-newsletter-success]': this.success,
  }
  private listeners: SubmitListener[] = []

  querySelector = mock((selector: string) => this.nodes[selector] ?? null)
  reportValidity = mock(() => true)
  preventDefault = mock(() => {})
  reset = mock(() => {
    this.email.value = ''
    this.honeypot.value = ''
  })
  addEventListener = mock((_event: string, listener: SubmitListener) => {
    this.listeners.push(listener)
  })

  constructor() {
    super()
    this.setAttribute('aria-busy', 'false')
  }

  async submit(): Promise<void> {
    await Promise.all(this.listeners.map((listener) => listener({ preventDefault: this.preventDefault })))
  }
}

const originalDocumentDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'document')
let executeSpy: Mock<typeof subscribeToNewsletterService.execute>
const querySelectorMock = mock<(selector: string) => FormMock | null>(() => null)

beforeEach(() => {
  querySelectorMock.mockReset()
  querySelectorMock.mockReturnValue(null)
  executeSpy = spyOn(subscribeToNewsletterService, 'execute')
  executeSpy.mockResolvedValue({ status: SubscriptionStatus.Error })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { querySelector: querySelectorMock },
  })
})

afterEach(() => {
  executeSpy.mockRestore()
  if (originalDocumentDescriptor) {
    Object.defineProperty(globalThis, 'document', originalDocumentDescriptor)
  } else {
    Reflect.deleteProperty(globalThis, 'document')
  }
})

describe('initializeNewsletterForm', () => {
  test('does nothing when the newsletter form is missing', () => {
    expect(() => initializeNewsletterForm()).not.toThrow()

    expect(querySelectorMock).toHaveBeenCalledWith('#newsletter-form')
    expect(executeSpy).not.toHaveBeenCalled()
  })

  test('enables the initially disabled fields only after registering the submit handler', () => {
    const form = new FormMock()
    form.email.value = 'reader@example.com'
    querySelectorMock.mockReturnValue(form)
    expect(form.fields.disabled).toBe(true)
    form.addEventListener.mockImplementation(() => {
      expect(form.fields.disabled).toBe(true)
      expect(form.dataset.newsletterReady).toBeUndefined()
    })

    initializeNewsletterForm()

    expect(form.dataset.newsletterReady).toBe('true')
    expect(form.addEventListener).toHaveBeenCalledWith('submit', expect.any(Function))
    expect(form.reportValidity).not.toHaveBeenCalled()
    expect(form.fields.disabled).toBe(false)
    expect(form.getAttribute('aria-busy')).toBe('false')
    expect(executeSpy).not.toHaveBeenCalled()
  })

  test('initializes the newsletter form only once', async () => {
    const form = new FormMock()
    querySelectorMock.mockReturnValue(form)

    initializeNewsletterForm()
    initializeNewsletterForm()
    await form.submit()

    expect(form.addEventListener).toHaveBeenCalledTimes(1)
    expect(form.preventDefault).toHaveBeenCalledTimes(1)
    expect(executeSpy).toHaveBeenCalledTimes(1)
  })

  test('skips the newsletter form when already marked as ready', () => {
    const form = new FormMock()
    form.dataset.newsletterReady = 'true'
    querySelectorMock.mockReturnValue(form)

    initializeNewsletterForm()

    expect(form.querySelector).not.toHaveBeenCalled()
    expect(form.addEventListener).not.toHaveBeenCalled()
    expect(executeSpy).not.toHaveBeenCalled()
  })

  test('uses native validation and clears stale errors without sending invalid forms', async () => {
    const form = new FormMock()
    form.reportValidity.mockReturnValue(false)
    form.email.setAttribute('aria-invalid', 'true')
    form.invalidEmail.hidden = false
    form.error.hidden = false
    querySelectorMock.mockReturnValue(form)
    initializeNewsletterForm()

    await form.submit()

    expect(form.preventDefault).toHaveBeenCalledTimes(1)
    expect(form.reportValidity).toHaveBeenCalledTimes(1)
    expect(form.email.getAttribute('aria-invalid')).toBeNull()
    expect(form.invalidEmail.hidden).toBe(true)
    expect(form.error.hidden).toBe(true)
    expect(form.fields.disabled).toBe(false)
    expect(form.getAttribute('aria-busy')).toBe('false')
    expect(form.submitLabel.hidden).toBe(false)
    expect(form.submitting.hidden).toBe(true)
    expect(form.reset).not.toHaveBeenCalled()
    expect(form.email.focus).not.toHaveBeenCalled()
    expect(form.feedback.focus).not.toHaveBeenCalled()
    expect(executeSpy).not.toHaveBeenCalled()
  })

  test('immediately disables fields and shows busy labels while blocking duplicate pending submissions', async () => {
    const form = new FormMock()
    const pendingSubscription = Promise.withResolvers<SubscriptionResult>()
    executeSpy.mockReturnValue(pendingSubscription.promise)
    querySelectorMock.mockReturnValue(form)
    initializeNewsletterForm()

    const submission = form.submit()

    expect(form.fields.disabled).toBe(true)
    expect(form.getAttribute('aria-busy')).toBe('true')
    expect(form.submitLabel.hidden).toBe(true)
    expect(form.submitting.hidden).toBe(false)
    expect(form.email.focus).not.toHaveBeenCalled()
    expect(form.feedback.focus).not.toHaveBeenCalled()

    await form.submit()

    expect(form.preventDefault).toHaveBeenCalledTimes(2)
    expect(form.reportValidity).toHaveBeenCalledTimes(1)
    expect(executeSpy).toHaveBeenCalledTimes(1)
    expect(form.fields.disabled).toBe(true)
    expect(form.getAttribute('aria-busy')).toBe('true')

    pendingSubscription.resolve({ status: SubscriptionStatus.Error })
    await submission

    expect(form.fields.disabled).toBe(false)
    expect(form.getAttribute('aria-busy')).toBe('false')
    expect(form.submitLabel.hidden).toBe(false)
    expect(form.submitting.hidden).toBe(true)
  })

  test('clears the form and shows confirmation without allowing another send after success', async () => {
    const form = new FormMock()
    form.email.value = 'reader@example.com'
    executeSpy.mockResolvedValue({ status: SubscriptionStatus.ConfirmationRequired })
    querySelectorMock.mockReturnValue(form)
    initializeNewsletterForm()

    await form.submit()

    expect(form.reset).toHaveBeenCalledTimes(1)
    expect(form.email.value).toBe('')
    expect(form.honeypot.value).toBe('')
    expect(form.fields.hidden).toBe(true)
    expect(form.fields.disabled).toBe(false)
    expect(form.success.hidden).toBe(false)
    expect(form.invalidEmail.hidden).toBe(true)
    expect(form.error.hidden).toBe(true)
    expect(form.getAttribute('aria-busy')).toBe('false')
    expect(form.submitLabel.hidden).toBe(false)
    expect(form.submitting.hidden).toBe(true)
    expect(form.feedback.focus).toHaveBeenCalledTimes(1)
    expect(form.email.focus).not.toHaveBeenCalled()

    await form.submit()

    expect(executeSpy).toHaveBeenCalledTimes(1)
    expect(form.reportValidity).toHaveBeenCalledTimes(1)
    expect(form.reset).toHaveBeenCalledTimes(1)
    expect(form.success.hidden).toBe(false)
  })

  test('marks invalid email and re-enables the input before focusing it', async () => {
    const form = new FormMock()
    form.email.value = 'invalid@example.com'
    executeSpy.mockResolvedValue({ status: SubscriptionStatus.InvalidEmail })
    form.email.focus.mockImplementation(() => {
      expect(form.fields.disabled).toBe(false)
      expect(form.getAttribute('aria-busy')).toBe('false')
      expect(form.submitLabel.hidden).toBe(false)
      expect(form.submitting.hidden).toBe(true)
    })
    querySelectorMock.mockReturnValue(form)
    initializeNewsletterForm()

    await form.submit()

    expect(form.invalidEmail.hidden).toBe(false)
    expect(form.email.getAttribute('aria-invalid')).toBe('true')
    expect(form.email.focus).toHaveBeenCalledTimes(1)
    expect(form.feedback.focus).not.toHaveBeenCalled()
    expect(form.email.value).toBe('invalid@example.com')
    expect(form.fields.hidden).toBe(false)
    expect(form.error.hidden).toBe(true)
    expect(form.success.hidden).toBe(true)
    expect(form.reset).not.toHaveBeenCalled()
  })

  test('clears invalid email feedback before retrying with the corrected email', async () => {
    const form = new FormMock()
    executeSpy.mockResolvedValueOnce({ status: SubscriptionStatus.InvalidEmail })
    querySelectorMock.mockReturnValue(form)
    initializeNewsletterForm()
    await form.submit()
    form.email.value = 'corrected@example.com'
    const pendingSubscription = Promise.withResolvers<SubscriptionResult>()
    executeSpy.mockReturnValueOnce(pendingSubscription.promise)

    const retry = form.submit()

    expect(form.email.getAttribute('aria-invalid')).toBeNull()
    expect(form.invalidEmail.hidden).toBe(true)
    expect(executeSpy).toHaveBeenLastCalledWith({ email: 'corrected@example.com', email_address_check: '' })

    pendingSubscription.resolve({ status: SubscriptionStatus.ConfirmationRequired })
    await retry

    expect(form.success.hidden).toBe(false)
    expect(executeSpy).toHaveBeenCalledTimes(2)
  })

  test('focuses generic error feedback and allows retrying without losing the email', async () => {
    const form = new FormMock()
    form.email.value = 'reader@example.com'
    querySelectorMock.mockReturnValue(form)
    initializeNewsletterForm()

    await form.submit()

    expect(form.error.hidden).toBe(false)
    expect(form.invalidEmail.hidden).toBe(true)
    expect(form.success.hidden).toBe(true)
    expect(form.feedback.focus).toHaveBeenCalledTimes(1)
    expect(form.email.focus).not.toHaveBeenCalled()
    expect(form.email.getAttribute('aria-invalid')).toBeNull()
    expect(form.email.value).toBe('reader@example.com')
    expect(form.fields.hidden).toBe(false)
    expect(form.fields.disabled).toBe(false)
    expect(form.reset).not.toHaveBeenCalled()
    const pendingSubscription = Promise.withResolvers<SubscriptionResult>()
    executeSpy.mockReturnValueOnce(pendingSubscription.promise)

    const retry = form.submit()

    expect(form.error.hidden).toBe(true)
    expect(form.email.value).toBe('reader@example.com')
    expect(executeSpy).toHaveBeenCalledTimes(2)
    expect(executeSpy).toHaveBeenLastCalledWith({ email: 'reader@example.com', email_address_check: '' })

    pendingSubscription.resolve({ status: SubscriptionStatus.ConfirmationRequired })
    await retry

    expect(form.success.hidden).toBe(false)
    expect(form.error.hidden).toBe(true)
  })

  test('passes the email and honeypot to the service unchanged', async () => {
    const input: SubscribeToNewsletterInput = {
      email: '  Reader@example.com  ',
      email_address_check: '  unsolicited robot biography  ',
    }
    const form = new FormMock()
    form.email.value = input.email
    form.honeypot.value = input.email_address_check
    querySelectorMock.mockReturnValue(form)
    initializeNewsletterForm()

    await form.submit()

    expect(executeSpy).toHaveBeenCalledTimes(1)
    expect(executeSpy).toHaveBeenCalledWith(input)
    expect(form.email.value).toBe(input.email)
    expect(form.honeypot.value).toBe(input.email_address_check)
  })
})

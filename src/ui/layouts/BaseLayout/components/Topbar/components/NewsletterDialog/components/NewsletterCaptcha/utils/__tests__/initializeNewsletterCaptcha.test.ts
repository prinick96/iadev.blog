import { afterEach, beforeEach, describe, expect, type Mock, mock, spyOn, test } from 'bun:test'
import type {
  NewsletterCaptchaState,
  NewsletterTurnstile,
} from '@/ui/layouts/BaseLayout/components/Topbar/components/NewsletterDialog/components/NewsletterCaptcha/types'
import { initializeNewsletterCaptcha } from '@/ui/layouts/BaseLayout/components/Topbar/components/NewsletterDialog/components/NewsletterCaptcha/utils/initializeNewsletterCaptcha'
import * as turnstileLoader from '@/ui/layouts/BaseLayout/components/Topbar/components/NewsletterDialog/components/NewsletterCaptcha/utils/loadNewsletterTurnstile'

class ElementMock extends EventTarget {
  clientWidth = 400
  dataset: Record<string, string> = {}
  hidden = false
  disabled = false
  value = ''
}

class DialogMock extends ElementMock {
  open = false

  async show(): Promise<void> {
    this.open = true
    this.dispatchEvent(new Event('toggle'))
    await Bun.sleep(0)
  }

  close(): void {
    this.open = false
    this.dispatchEvent(new Event('close'))
    this.dispatchEvent(new Event('toggle'))
  }
}

class FormMock extends ElementMock {
  container = new ElementMock()
  token = new ElementMock()
  submit = new ElementMock()
  retry = new ElementMock()
  fields = new ElementMock()
  messages = ['pending', 'solved', 'expired', 'error'].map((state) => {
    const message = new ElementMock()
    message.dataset.newsletterCaptchaMessage = state
    return message
  })
  nodes: Record<string, ElementMock> = {
    '[data-newsletter-captcha]': this.container,
    '[data-newsletter-captcha-token]': this.token,
    'button[type="submit"]': this.submit,
    '[data-newsletter-captcha-retry]': this.retry,
    '[data-newsletter-fields]': this.fields,
  }
  querySelector = (selector: string): ElementMock | null => this.nodes[selector] ?? null
  querySelectorAll = (): ElementMock[] => this.messages

  constructor() {
    super()
    this.container.dataset.sitekey = 'public-sitekey'
  }

  expectState(state: NewsletterCaptchaState): void {
    this.messages.forEach((message) => {
      expect(message.hidden).toBe(message.dataset.newsletterCaptchaMessage !== state)
    })
    expect(this.submit.disabled).toBe(state !== 'solved')
    expect(this.retry.hidden).toBe(state !== 'error' && state !== 'expired')
  }
}

const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
const render = mock<NewsletterTurnstile['render']>(() => 'widget-id')
const reset = mock<NewsletterTurnstile['reset']>(() => {})
const remove = mock<NewsletterTurnstile['remove']>(() => {})
const api: NewsletterTurnstile = { render, reset, remove }
let form: FormMock
let dialog: DialogMock
let loadSpy: Mock<typeof turnstileLoader.loadNewsletterTurnstile>

const initialize = () =>
  initializeNewsletterCaptcha(
    document.querySelector<HTMLFormElement>('#newsletter-form')!,
    document.querySelector<HTMLDialogElement>('#newsletter-dialog')!
  )

beforeEach(() => {
  form = new FormMock()
  dialog = new DialogMock()
  render.mockReset()
  render.mockReturnValue('widget-id')
  reset.mockReset()
  remove.mockReset()
  loadSpy = spyOn(turnstileLoader, 'loadNewsletterTurnstile')
  loadSpy.mockResolvedValue(api)
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { querySelector: (selector: string) => (selector === '#newsletter-form' ? form : dialog) },
  })
})

afterEach(() => {
  loadSpy.mockRestore()
  if (originalDocument) {
    Object.defineProperty(globalThis, 'document', originalDocument)
  } else {
    Reflect.deleteProperty(globalThis, 'document')
  }
})

describe('initializeNewsletterCaptcha', () => {
  test('loads nothing until the dialog opens and renders only once while open', async () => {
    const captcha = initialize()
    form.expectState('pending')
    expect(captcha.getToken()).toBe('')
    expect(loadSpy).not.toHaveBeenCalled()

    await dialog.show()
    await dialog.show()

    expect(loadSpy).toHaveBeenCalledTimes(1)
    expect(render).toHaveBeenCalledTimes(1)
    expect(render).toHaveBeenCalledWith(
      form.container,
      expect.objectContaining({
        sitekey: 'public-sitekey',
        language: 'es',
        size: 'flexible',
        'response-field': false,
      })
    )
  })

  test('uses the compact widget when the dialog content is narrower than 300 pixels', async () => {
    form.container.clientWidth = 246
    initialize()
    await dialog.show()

    expect(render.mock.calls[0]![1].size).toBe('compact')
  })

  test('starts verification when initialized in an already open dialog', async () => {
    dialog.open = true
    initialize()
    await Bun.sleep(0)

    expect(render).toHaveBeenCalledTimes(1)
  })

  test('enables submission only after receiving a nonempty token', async () => {
    const captcha = initialize()
    await dialog.show()
    const options = render.mock.calls[0]![1]
    options.callback('verified-token')

    expect(captcha.getToken()).toBe('verified-token')
    form.expectState('solved')

    options.callback(' ')
    expect(captcha.getToken()).toBe('')
    form.expectState('error')
  })

  test.each(['expired-callback', 'error-callback', 'timeout-callback'])(
    'invalidates a solved token on %s',
    async (callback) => {
      const captcha = initialize()
      await dialog.show()
      const options = render.mock.calls[0]![1]
      options.callback('verified-token')
      if (callback === 'error-callback') {
        expect(options['error-callback']()).toBe(true)
        form.expectState('error')
      } else if (callback === 'expired-callback') {
        options['expired-callback']()
        form.expectState('expired')
      } else {
        options['timeout-callback']()
        form.expectState('expired')
      }
      expect(captcha.getToken()).toBe('')
    }
  )

  test('clears and resets a consumed token, requiring another solution', async () => {
    const captcha = initialize()
    await dialog.show()
    render.mock.calls[0]![1].callback('verified-token')

    captcha.reset()

    expect(reset).toHaveBeenCalledWith('widget-id')
    expect(captcha.getToken()).toBe('')
    form.expectState('pending')
  })

  test('allows retrying verification after expiry', async () => {
    initialize()
    await dialog.show()
    render.mock.calls[0]![1]['expired-callback']()
    form.retry.dispatchEvent(new Event('click'))
    await Bun.sleep(0)

    expect(reset).toHaveBeenCalledTimes(1)
    form.expectState('pending')
  })

  test('shows script failure and retries without losing the form contents', async () => {
    form.token.value = 'stale-token'
    loadSpy.mockRejectedValueOnce(new Error('Offline'))
    initialize()
    await dialog.show()

    form.expectState('error')
    expect(form.token.value).toBe('')
    expect(render).not.toHaveBeenCalled()

    form.retry.dispatchEvent(new Event('click'))
    await Bun.sleep(0)
    expect(render).toHaveBeenCalledTimes(1)
    form.expectState('pending')
  })

  test('fails locally when the sitekey is missing', async () => {
    form.container.dataset.sitekey = ''
    initialize()
    await dialog.show()

    form.expectState('error')
    expect(loadSpy).not.toHaveBeenCalled()
  })

  test('does not duplicate loading or render after closing during a pending load', async () => {
    const pending = Promise.withResolvers<NewsletterTurnstile>()
    loadSpy.mockReturnValue(pending.promise)
    initialize()
    await dialog.show()
    await dialog.show()
    dialog.close()
    pending.resolve(api)
    await Bun.sleep(0)

    expect(loadSpy).toHaveBeenCalledTimes(1)
    expect(render).not.toHaveBeenCalled()

    await dialog.show()
    expect(render).toHaveBeenCalledTimes(1)
  })

  test('removes the widget on close, ignores late callbacks, and renders fresh on reopening', async () => {
    const captcha = initialize()
    await dialog.show()
    const oldOptions = render.mock.calls[0]![1]
    oldOptions.callback('old-token')
    dialog.close()
    oldOptions.callback('late-token')
    oldOptions['error-callback']()

    expect(captcha.getToken()).toBe('')
    expect(remove).toHaveBeenCalledTimes(1)
    form.expectState('pending')

    await dialog.show()
    captcha.reset()
    expect(render).toHaveBeenCalledTimes(2)
    expect(reset).toHaveBeenCalledTimes(1)
  })

  test('removes rather than resetting a now-hidden successful form', async () => {
    const captcha = initialize()
    await dialog.show()
    const options = render.mock.calls[0]![1]
    options.callback('verified-token')
    form.fields.hidden = true

    captcha.reset()
    options.callback('late-token')
    expect(options['error-callback']()).toBe(true)
    expect(captcha.getToken()).toBe('')
    form.expectState('pending')
    dialog.close()
    await dialog.show()

    expect(remove).toHaveBeenCalledTimes(1)
    expect(reset).not.toHaveBeenCalled()
    expect(render).toHaveBeenCalledTimes(1)
  })

  test('shows an error if rendering fails', async () => {
    render.mockReturnValue(undefined)
    initialize()
    await dialog.show()

    form.expectState('error')
  })

  test('recovers from a reset failure by creating a fresh widget on retry', async () => {
    const captcha = initialize()
    await dialog.show()
    reset.mockImplementationOnce(() => {
      throw new Error('Widget failure')
    })

    captcha.reset()
    form.expectState('error')
    expect(remove).toHaveBeenCalledTimes(1)

    form.retry.dispatchEvent(new Event('click'))
    await Bun.sleep(0)
    expect(render).toHaveBeenCalledTimes(2)
  })
})

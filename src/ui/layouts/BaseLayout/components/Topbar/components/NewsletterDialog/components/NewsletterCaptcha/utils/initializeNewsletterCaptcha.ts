import type {
  NewsletterCaptcha,
  NewsletterCaptchaState,
} from '@/ui/layouts/BaseLayout/components/Topbar/components/NewsletterDialog/components/NewsletterCaptcha/types'
import { loadNewsletterTurnstile } from '@/ui/layouts/BaseLayout/components/Topbar/components/NewsletterDialog/components/NewsletterCaptcha/utils/loadNewsletterTurnstile'

export function initializeNewsletterCaptcha(form: HTMLFormElement, dialog: HTMLDialogElement): NewsletterCaptcha {
  const container = form.querySelector<HTMLElement>('[data-newsletter-captcha]')!
  const token = form.querySelector<HTMLInputElement>('[data-newsletter-captcha-token]')!
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!
  const retry = form.querySelector<HTMLButtonElement>('[data-newsletter-captcha-retry]')!
  const messages = form.querySelectorAll<HTMLElement>('[data-newsletter-captcha-message]')
  const fields = form.querySelector<HTMLFieldSetElement>('[data-newsletter-fields]')!

  const setState = (state: NewsletterCaptchaState): void => {
    if (state !== 'solved') {
      token.value = ''
    }

    submit.disabled = state !== 'solved'
    retry.hidden = state !== 'error' && state !== 'expired'
    messages.forEach((message) => {
      message.hidden = message.dataset.newsletterCaptchaMessage !== state
    })
  }

  const start = async (): Promise<void> => {
    if (!dialog.open || fields.hidden || container.dataset.captchaLoading === 'true') {
      return
    }

    if (container.dataset.captchaRendered === 'true') {
      return
    }

    container.dataset.captchaLoading = 'true'
    setState('pending')

    try {
      const sitekey = container.dataset.sitekey

      if (!sitekey) {
        throw new Error('Newsletter verification sitekey is missing')
      }

      const turnstile = await loadNewsletterTurnstile()

      if (!dialog.open || fields.hidden) {
        return
      }

      const lifecycle = new AbortController()
      const invalidate = (state: NewsletterCaptchaState): void => {
        if (!lifecycle.signal.aborted) {
          setState(state)
        }
      }
      const widgetId = turnstile.render(container, {
        sitekey,
        language: 'es',
        size: container.clientWidth < 300 ? 'compact' : 'flexible',
        'response-field': false,
        retry: 'never',
        'refresh-expired': 'manual',
        callback: (response) => {
          if (!lifecycle.signal.aborted && dialog.open) {
            token.value = response
            setState(response.trim() === '' ? 'error' : 'solved')
          }
        },
        'expired-callback': () => invalidate('expired'),
        'error-callback': () => {
          invalidate('error')
          return true
        },
        'timeout-callback': () => invalidate('expired'),
      })

      if (widgetId === undefined) {
        throw new Error('Newsletter verification could not be rendered')
      }

      const dispose = (): void => {
        lifecycle.abort()
        container.dataset.captchaRendered = 'false'
        setState('pending')
        turnstile.remove(widgetId)
      }

      container.dataset.captchaRendered = 'true'
      form.addEventListener(
        'newsletter:captcha-reset',
        () => {
          try {
            if (fields.hidden || !dialog.open) {
              dispose()
            } else {
              turnstile.reset(widgetId)
            }
          } catch {
            dispose()
            setState('error')
          }
        },
        { signal: lifecycle.signal }
      )
      dialog.addEventListener('close', dispose, { once: true, signal: lifecycle.signal })
    } catch {
      setState('error')
    } finally {
      container.dataset.captchaLoading = 'false'
    }
  }

  const reset = (): void => {
    setState('pending')
    form.dispatchEvent(new Event('newsletter:captcha-reset'))
  }

  dialog.addEventListener('toggle', start)
  retry.addEventListener('click', async () => {
    if (container.dataset.captchaRendered === 'true') {
      reset()
    } else {
      await start()
    }
  })
  setState('pending')
  void start()

  return { getToken: () => token.value, reset }
}

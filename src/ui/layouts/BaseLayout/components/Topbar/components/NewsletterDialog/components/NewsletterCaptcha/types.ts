export type NewsletterTurnstileOptions = {
  sitekey: string
  language: 'es'
  size: 'flexible' | 'compact'
  'response-field': false
  retry: 'never'
  'refresh-expired': 'manual'
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': () => boolean
  'timeout-callback': () => void
}

export type NewsletterTurnstile = {
  render: (container: HTMLElement, options: NewsletterTurnstileOptions) => string | undefined
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

export type NewsletterCaptcha = {
  getToken: () => string
  reset: () => void
}

export type NewsletterCaptchaState = 'pending' | 'solved' | 'expired' | 'error'

declare global {
  interface Window {
    turnstile?: NewsletterTurnstile
  }
}

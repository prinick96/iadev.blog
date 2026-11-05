import type { NewsletterTurnstile } from '@/ui/layouts/BaseLayout/components/Topbar/components/NewsletterDialog/components/NewsletterCaptcha/types'

export async function loadNewsletterTurnstile(): Promise<NewsletterTurnstile> {
  if (window.turnstile) {
    return window.turnstile
  }

  return await new Promise<NewsletterTurnstile>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true

    const cleanup = (): void => {
      clearTimeout(timeout)
      script.removeEventListener('load', loaded)
      script.removeEventListener('error', failed)
    }

    const failed = (): void => {
      cleanup()
      script.remove()
      reject(new Error('Newsletter verification could not be loaded'))
    }

    const loaded = (): void => {
      if (!window.turnstile) {
        failed()
        return
      }

      cleanup()
      resolve(window.turnstile)
    }

    const timeout = setTimeout(failed, 15_000)
    script.addEventListener('load', loaded, { once: true })
    script.addEventListener('error', failed, { once: true })
    document.head.append(script)
  })
}

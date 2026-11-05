import { WIDGET_DISMISSAL_KEY } from '@/ui/layouts/BaseLayout/components/SaasIsDead/constants'

export function stopSaasIsDead(controller: AbortController): void {
  controller.abort()
  document.querySelector('[data-saas-is-dead-mount]')?.replaceChildren()

  try {
    globalThis.localStorage.removeItem(WIDGET_DISMISSAL_KEY)
  } catch {
    // :)
  }
}

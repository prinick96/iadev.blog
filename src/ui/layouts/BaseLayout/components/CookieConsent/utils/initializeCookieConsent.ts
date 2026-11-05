import { getCookieConsentService } from '@/core/logic/cookies/services/index'
import type { ConsentElements } from '@/ui/layouts/BaseLayout/components/CookieConsent/types'
import { saveCookieConsentPreferences } from '@/ui/layouts/BaseLayout/components/CookieConsent/utils/saveCookieConsentPreferences'
import { showCookieConsentFeedback } from '@/ui/layouts/BaseLayout/components/CookieConsent/utils/showCookieConsentFeedback'
import { loadSaasIsDead } from '@/ui/layouts/BaseLayout/components/SaasIsDead/utils/loadSaasIsDead'
import { stopSaasIsDead } from '@/ui/layouts/BaseLayout/components/SaasIsDead/utils/stopSaasIsDead'

async function loadWidget(
  signal: AbortSignal,
  isAllowed: () => boolean,
  feedback: NodeListOf<HTMLElement>
): Promise<void> {
  try {
    await loadSaasIsDead(signal, isAllowed)
  } catch {
    if (!signal.aborted) {
      showCookieConsentFeedback(
        feedback,
        'No se ha podido cargar el widget opcional. Puedes recargar la página para reintentarlo.'
      )
    }
  }
}

export function initializeCookieConsent(): void {
  const root = document.querySelector<HTMLElement>('[data-cookie-consent]')
  const banner = root?.querySelector<HTMLElement>('[data-cookie-banner]')
  const dialog = root?.querySelector<HTMLDialogElement>('#cookie-preferences')
  const form = root?.querySelector<HTMLFormElement>('[data-cookie-form]')
  const checkbox = root?.querySelector<HTMLInputElement>('[data-cookie-widget]')

  if (!root || !banner || !dialog || !form || !checkbox || root.dataset.initialized === 'true') {
    return
  }

  root.dataset.initialized = 'true'

  const elements: ConsentElements = {
    banner,
    dialog,
    checkbox,
    feedback: root.querySelectorAll<HTMLElement>('[data-cookie-feedback]'),
  }
  const triggers = document.querySelectorAll<HTMLButtonElement>('[data-cookie-preferences]')
  const consent = getCookieConsentService.execute(Date.now())
  const controller = new AbortController()
  const isAllowed = (): boolean =>
    !controller.signal.aborted && consent?.widget === true && consent.expiresAt > Date.now()
  const openPreferences = (): void => {
    checkbox.checked = isAllowed()
    showCookieConsentFeedback(elements.feedback, '')
    if (!dialog.open) {
      dialog.showModal()
    }
  }

  root.querySelector('[data-cookie-accept]')?.addEventListener('click', () => {
    saveCookieConsentPreferences(true, elements, controller)
  })
  root.querySelector('[data-cookie-reject]')?.addEventListener('click', () => {
    saveCookieConsentPreferences(false, elements, controller)
  })
  root.querySelector('[data-cookie-configure]')?.addEventListener('click', openPreferences)
  root.querySelector('[data-cookie-cancel]')?.addEventListener('click', () => dialog.close())
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    saveCookieConsentPreferences(checkbox.checked, elements, controller)
  })
  for (const trigger of triggers) {
    trigger.hidden = false
    trigger.addEventListener('click', openPreferences)
  }

  banner.hidden = consent !== null
  if (isAllowed()) {
    void loadWidget(controller.signal, isAllowed, elements.feedback)
  } else {
    stopSaasIsDead(controller)
  }
}

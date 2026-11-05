import { SaveCookieConsentStatus } from '@/core/logic/cookies/domain/SaveCookieConsentStatus'
import { saveCookieConsentService } from '@/core/logic/cookies/services/index'
import type { ConsentElements } from '@/ui/layouts/BaseLayout/components/CookieConsent/types'
import { showCookieConsentFeedback } from '@/ui/layouts/BaseLayout/components/CookieConsent/utils/showCookieConsentFeedback'
import { stopSaasIsDead } from '@/ui/layouts/BaseLayout/components/SaasIsDead/utils/stopSaasIsDead'

export function saveCookieConsentPreferences(
  widget: boolean,
  elements: ConsentElements,
  controller: AbortController
): void {
  const result = saveCookieConsentService.execute({ widget })

  if (result.status === SaveCookieConsentStatus.Saved) {
    if (!widget) {
      stopSaasIsDead(controller)
    }

    showCookieConsentFeedback(elements.feedback, '')

    elements.dialog.close()
    window.location.reload()

    return
  }

  stopSaasIsDead(controller)
  elements.checkbox.checked = false
  elements.banner.hidden = !widget

  if (widget) {
    showCookieConsentFeedback(
      elements.feedback,
      'No se ha podido guardar tu elección, el widget sigue bloqueado. Permite el almacenamiento o elige rechazar.'
    )
    return
  }

  showCookieConsentFeedback(
    elements.feedback,
    'Widget desactivado en esta página, no se ha podido guardar el rechazo; borra los datos del sitio en tu navegador para retirar también una autorización anterior.'
  )
  elements.dialog.close()
}

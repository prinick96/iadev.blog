import { COOKIE_CONSENT_KEY } from '@/core/constants/cookies'
import type { CookieConsent } from '@/core/logic/cookies/domain/CookieConsent'

import type { ICookieConsentRepository } from '@/core/logic/cookies/infra/interfaces/ICookieConsentRepository'

class CookieConsentRepository implements ICookieConsentRepository {
  read(): CookieConsent | null {
    const raw = globalThis.localStorage.getItem(COOKIE_CONSENT_KEY)

    if (raw === null) {
      return null
    }

    return JSON.parse(raw) as CookieConsent
  }

  write(consent: CookieConsent): void {
    globalThis.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent))
  }
}

export default CookieConsentRepository

import { COOKIE_CONSENT_VERSION } from '@/core/constants/cookies'
import type { CookieConsent } from '@/core/logic/cookies/domain/CookieConsent'
import type { ICookieConsentRepository } from '@/core/logic/cookies/infra/interfaces/ICookieConsentRepository'

class GetCookieConsent {
  constructor(private readonly repository: ICookieConsentRepository) {}

  execute(now: number): CookieConsent | null {
    try {
      const record = this.repository.read()

      if (record === null || record.version !== COOKIE_CONSENT_VERSION || !(record.expiresAt > now)) {
        return null
      }

      return record
    } catch {
      return null
    }
  }
}

export default GetCookieConsent

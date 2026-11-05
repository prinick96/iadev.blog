import { COOKIE_CONSENT_LIFETIME, COOKIE_CONSENT_VERSION } from '@/core/constants/cookies'
import type { SaveCookieConsentInput } from '@/core/logic/cookies/domain/Inputs'
import type { SaveCookieConsentResult } from '@/core/logic/cookies/domain/SaveCookieConsentResult'
import { SaveCookieConsentStatus } from '@/core/logic/cookies/domain/SaveCookieConsentStatus'
import type { ICookieConsentRepository } from '@/core/logic/cookies/infra/interfaces/ICookieConsentRepository'

class SaveCookieConsent {
  constructor(private readonly repository: ICookieConsentRepository) {}

  execute(input: SaveCookieConsentInput): SaveCookieConsentResult {
    const now = Date.now()
    const consent = {
      version: COOKIE_CONSENT_VERSION,
      widget: input.widget,
      savedAt: now,
      expiresAt: now + COOKIE_CONSENT_LIFETIME,
    }

    try {
      this.repository.write(consent)

      return { status: SaveCookieConsentStatus.Saved, consent }
    } catch {
      return { status: SaveCookieConsentStatus.StorageError }
    }
  }
}

export default SaveCookieConsent

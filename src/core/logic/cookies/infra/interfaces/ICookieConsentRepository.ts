import type { CookieConsent } from '@/core/logic/cookies/domain/CookieConsent'

export interface ICookieConsentRepository {
  read(): CookieConsent | null
  write(consent: CookieConsent): void
}

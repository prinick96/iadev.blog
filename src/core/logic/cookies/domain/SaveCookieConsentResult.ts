import type { CookieConsent } from '@/core/logic/cookies/domain/CookieConsent'
import type { SaveCookieConsentStatus } from '@/core/logic/cookies/domain/SaveCookieConsentStatus'

export type SaveCookieConsentResult =
  | { status: SaveCookieConsentStatus.Saved; consent: CookieConsent }
  | { status: SaveCookieConsentStatus.StorageError }

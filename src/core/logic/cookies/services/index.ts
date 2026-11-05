import GetCookieConsent from '@/core/logic/cookies/application/GetCookieConsent'
import SaveCookieConsent from '@/core/logic/cookies/application/SaveCookieConsent'
import CookieConsentRepository from '@/core/logic/cookies/infra/browser/CookieConsentRepository'

const repository = new CookieConsentRepository()

export const getCookieConsentService = new GetCookieConsent(repository)
export const saveCookieConsentService = new SaveCookieConsent(repository)

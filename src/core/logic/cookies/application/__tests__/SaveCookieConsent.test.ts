import { afterEach, beforeEach, expect, spyOn, test } from 'bun:test'
import { COOKIE_CONSENT_LIFETIME, COOKIE_CONSENT_VERSION } from '@/core/constants/cookies'
import SaveCookieConsent from '@/core/logic/cookies/application/SaveCookieConsent'
import { SaveCookieConsentStatus } from '@/core/logic/cookies/domain/SaveCookieConsentStatus'
import CookieConsentRepositoryMock from '@/core/logic/cookies/infra/browser/mocks/CookieConsentRepository.mock'

const now = 1_700_000_000_000
const expiresAt = now + 15_552_000_000
let clock = spyOn(Date, 'now')

beforeEach(() => {
  clock = spyOn(Date, 'now').mockReturnValue(now)
})

afterEach(() => {
  clock.mockRestore()
})

test.each([false, true])('saves widget %s for 180 days without reading storage', (widget) => {
  const repository = new CookieConsentRepositoryMock()
  const input = Object.freeze({ widget })
  const consent = { version: 1, widget, savedAt: now, expiresAt }
  repository.read.mockImplementation(() => {
    throw new Error('Saving must not read storage')
  })

  expect(new SaveCookieConsent(repository).execute(input)).toEqual({ status: SaveCookieConsentStatus.Saved, consent })
  expect(COOKIE_CONSENT_VERSION).toBe(1)
  expect(COOKIE_CONSENT_LIFETIME).toBe(15_552_000_000)
  expect(repository.write.mock.calls).toEqual([[consent]])
  expect(repository.read).not.toHaveBeenCalled()
  expect(clock).toHaveBeenCalledTimes(1)
  expect(input).toEqual({ widget })
})

test.each([false, true])(
  'returns a storage error for widget %s when writing fails without reading storage',
  (widget) => {
    const repository = new CookieConsentRepositoryMock()
    const input = Object.freeze({ widget })
    const consent = { version: 1, widget, savedAt: now, expiresAt }
    repository.write.mockImplementation(() => {
      throw new Error('Write failed')
    })
    repository.read.mockImplementation(() => {
      throw new Error('A failed write must not read storage')
    })

    expect(new SaveCookieConsent(repository).execute(input)).toEqual({ status: SaveCookieConsentStatus.StorageError })
    expect(repository.write.mock.calls).toEqual([[consent]])
    expect(repository.read).not.toHaveBeenCalled()
    expect(clock).toHaveBeenCalledTimes(1)
    expect(input).toEqual({ widget })
  }
)

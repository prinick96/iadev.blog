import { expect, test } from 'bun:test'
import GetCookieConsent from '@/core/logic/cookies/application/GetCookieConsent'
import CookieConsentRepositoryMock from '@/core/logic/cookies/infra/browser/mocks/CookieConsentRepository.mock'

const now = 1_700_000_000_000

test.each([false, true])('reads a valid consent with widget %s', (widget) => {
  const repository = new CookieConsentRepositoryMock()
  repository.read.mockReturnValue({ version: 1, widget, savedAt: now, expiresAt: now + 1 })

  expect(new GetCookieConsent(repository).execute(now)).toEqual({
    version: 1,
    widget,
    savedAt: now,
    expiresAt: now + 1,
  })
  expect(repository.read.mock.calls).toEqual([[]])
  expect(repository.write).not.toHaveBeenCalled()
})

test('uses the reusable repository fixture without constructor arguments', () => {
  const repository = new CookieConsentRepositoryMock()

  expect(new GetCookieConsent(repository).execute(now)).toEqual({
    version: 1,
    widget: true,
    savedAt: now,
    expiresAt: 1_715_552_000_000,
  })
  expect(repository.read.mock.calls).toEqual([[]])
})

test.each([
  { name: 'missing', record: null },
  { name: 'an older version', record: { version: 0, widget: true, savedAt: now, expiresAt: now + 1 } },
  { name: 'incompatible', record: { version: 2, widget: true, savedAt: now, expiresAt: now + 1 } },
  { name: 'a fractional version', record: { version: 1.5, widget: true, savedAt: now, expiresAt: now + 1 } },
  { name: 'a negative version', record: { version: -1, widget: true, savedAt: now, expiresAt: now + 1 } },
  { name: 'expired', record: { version: 1, widget: true, savedAt: now - 2, expiresAt: now - 1 } },
  { name: 'exactly expired', record: { version: 1, widget: true, savedAt: now - 1, expiresAt: now } },
])('returns null for $name consent without modifying storage', ({ record }) => {
  const repository = new CookieConsentRepositoryMock()
  repository.read.mockReturnValue(record)

  expect(new GetCookieConsent(repository).execute(now)).toBeNull()
  expect(repository.read.mock.calls).toEqual([[]])
  expect(repository.write).not.toHaveBeenCalled()
})

test.each([
  { name: 'a fractional savedAt', savedAt: now + 0.5, expiresAt: now + 1 },
  { name: 'a negative savedAt', savedAt: -100, expiresAt: now + 1 },
  { name: 'a future savedAt', savedAt: now + 10_000, expiresAt: now + 1 },
  { name: 'a savedAt beyond safe integers', savedAt: Number.MAX_SAFE_INTEGER + 1, expiresAt: now + 1 },
  { name: 'a fractional expiry', savedAt: now, expiresAt: now + 0.5 },
  { name: 'a shorter lifetime', savedAt: now, expiresAt: now + 1 },
  { name: 'a longer lifetime', savedAt: now, expiresAt: now + 31_104_000_000 },
  { name: 'an expiry beyond safe integers', savedAt: now, expiresAt: Number.MAX_SAFE_INTEGER + 1 },
])('accepts $name without imposing additional timestamp policies', ({ savedAt, expiresAt }) => {
  const repository = new CookieConsentRepositoryMock()
  repository.read.mockReturnValue({ version: 1, widget: true, savedAt, expiresAt })

  expect(new GetCookieConsent(repository).execute(now)).toEqual({
    version: 1,
    widget: true,
    savedAt,
    expiresAt,
  })
  expect(repository.read).toHaveBeenCalledTimes(1)
  expect(repository.write).not.toHaveBeenCalled()
})

test('accepts negative timestamps when expiry is later than the supplied clock', () => {
  const repository = new CookieConsentRepositoryMock()
  repository.read.mockReturnValue({ version: 1, widget: true, savedAt: -100, expiresAt: -1 })

  expect(new GetCookieConsent(repository).execute(-2)).toEqual({
    version: 1,
    widget: true,
    savedAt: -100,
    expiresAt: -1,
  })
})

test('returns null when the supplied clock is NaN', () => {
  const repository = new CookieConsentRepositoryMock()

  expect(new GetCookieConsent(repository).execute(Number.NaN)).toBeNull()
})

test('returns the stored consent without mutating it', () => {
  const repository = new CookieConsentRepositoryMock()
  const source = Object.freeze({
    version: 1,
    widget: false,
    savedAt: now,
    expiresAt: now + 1,
    extra: 'preserved',
  })
  const original = structuredClone(source)
  repository.read.mockReturnValue(source)

  const consent = new GetCookieConsent(repository).execute(now)

  expect(consent).toEqual(source)
  expect(source).toEqual(original)
  expect(repository.write).not.toHaveBeenCalled()
})

test.each([
  new Error('Storage is unavailable'),
  new SyntaxError('Stored JSON is invalid'),
  new Error('Stored cookie consent has an invalid structure'),
])('returns null when reading throws %s', (error) => {
  const repository = new CookieConsentRepositoryMock()
  repository.read.mockImplementation(() => {
    throw error
  })

  expect(new GetCookieConsent(repository).execute(now)).toBeNull()
  expect(repository.read.mock.calls).toEqual([[]])
  expect(repository.write).not.toHaveBeenCalled()
})

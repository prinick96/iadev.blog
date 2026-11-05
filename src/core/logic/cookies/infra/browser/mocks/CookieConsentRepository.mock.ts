import { mock } from 'bun:test'
import type { ICookieConsentRepository } from '@/core/logic/cookies/infra/interfaces/ICookieConsentRepository'

class CookieConsentRepositoryMock implements ICookieConsentRepository {
  read = mock<ICookieConsentRepository['read']>(() => ({
    version: 1,
    widget: true,
    savedAt: 1_700_000_000_000,
    expiresAt: 1_715_552_000_000,
  }))

  write = mock<ICookieConsentRepository['write']>(() => {})
}

export default CookieConsentRepositoryMock

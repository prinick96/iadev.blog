import { createHttpClient } from '@/core/api/createHttpClient'

export const brevo = createHttpClient({
  timeout: 15_000,
})

import { createHttpClient } from '@/core/api/createHttpClient'
import { GITHUB_API_BASE_URL } from '@/core/constants/github'

export const github = createHttpClient({
  baseURL: GITHUB_API_BASE_URL,
  timeout: 10_000,
})

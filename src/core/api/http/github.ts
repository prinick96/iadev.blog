import { createHttpClient } from '@/core/api/createHttpClient'
import { GITHUB_API_BASE_URL, GITHUB_TOKEN } from '@/core/constants/github'

export const github = createHttpClient({
  baseURL: GITHUB_API_BASE_URL,
  timeout: 10_000,
  headers: GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {},
})

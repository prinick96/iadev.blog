import { expect, test } from 'bun:test'
import { createHttpClient } from '@/core/api/createHttpClient'

test('configures the Axios client with the supplied base URL and timeout', () => {
  const client = createHttpClient({ baseURL: 'https://example.com/api/', timeout: 5000 })

  expect(client.defaults.baseURL).toBe('https://example.com/api/')
  expect(client.defaults.timeout).toBe(5000)
})

test('creates independent Axios instances for different APIs', () => {
  const first = createHttpClient({ baseURL: 'https://first.example.com/', timeout: 5000 })
  const second = createHttpClient({ baseURL: 'https://second.example.com/', timeout: 10_000 })
  first.defaults.timeout = 1000

  expect(first).not.toBe(second)
  expect(second.defaults.baseURL).toBe('https://second.example.com/')
  expect(second.defaults.timeout).toBe(10_000)
})

test('does not add GitHub-specific headers to the generic client', () => {
  const client = createHttpClient({ baseURL: 'https://example.com/', timeout: 5000 })

  expect(client.defaults.headers.common['X-GitHub-Api-Version']).toBeUndefined()
  expect(client.defaults.headers.common['User-Agent']).toBeUndefined()
  expect(client.defaults.headers.common.Accept).not.toBe('application/vnd.github+json')
})

test('preserves an undefined base URL without adding a fallback', () => {
  const client = createHttpClient({ baseURL: undefined, timeout: 5000 })

  expect(client.defaults.baseURL).toBeUndefined()
  expect(client.defaults.timeout).toBe(5000)
})

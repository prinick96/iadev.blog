import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import type { NewsletterTurnstile } from '@/ui/layouts/BaseLayout/components/Topbar/components/NewsletterDialog/components/NewsletterCaptcha/types'
import { loadNewsletterTurnstile } from '@/ui/layouts/BaseLayout/components/Topbar/components/NewsletterDialog/components/NewsletterCaptcha/utils/loadNewsletterTurnstile'

class ScriptMock extends EventTarget {
  src = ''
  async = false
  remove = mock(() => {})
}

const originals = ['document', 'window', 'setTimeout', 'clearTimeout'].map((name) => ({
  name,
  descriptor: Object.getOwnPropertyDescriptor(globalThis, name),
}))
const api: NewsletterTurnstile = {
  render: mock(() => 'widget-id'),
  reset: mock(() => {}),
  remove: mock(() => {}),
}
let script: ScriptMock
let browser: { turnstile?: NewsletterTurnstile }
const append = mock((_script: ScriptMock) => {})
const schedule = mock((_callback: () => void, _delay: number) => 1)
const cancel = mock((_timer: number) => {})

beforeEach(() => {
  script = new ScriptMock()
  browser = {}
  append.mockClear()
  schedule.mockClear()
  cancel.mockClear()
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { createElement: () => script, head: { append } },
  })
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser })
  Object.defineProperty(globalThis, 'setTimeout', { configurable: true, value: schedule })
  Object.defineProperty(globalThis, 'clearTimeout', { configurable: true, value: cancel })
})

afterEach(() => {
  originals.forEach(({ name, descriptor }) => {
    if (descriptor) {
      Object.defineProperty(globalThis, name, descriptor)
    } else {
      Reflect.deleteProperty(globalThis, name)
    }
  })
})

describe('loadNewsletterTurnstile', () => {
  test('reuses an already loaded API without another script', async () => {
    browser.turnstile = api

    expect(await loadNewsletterTurnstile()).toBe(api)
    expect(append).not.toHaveBeenCalled()
    expect(schedule).not.toHaveBeenCalled()
  })

  test('loads the explicit-render API directly from Cloudflare and cleans up the timeout', async () => {
    const loading = loadNewsletterTurnstile()

    expect(script.src).toBe('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit')
    expect(script.async).toBe(true)
    expect(append).toHaveBeenCalledWith(script)
    expect(schedule).toHaveBeenCalledWith(expect.any(Function), 15_000)

    browser.turnstile = api
    script.dispatchEvent(new Event('load'))

    expect(await loading).toBe(api)
    expect(cancel).toHaveBeenCalledWith(1)
    expect(script.remove).not.toHaveBeenCalled()
  })

  test.each(['error', 'load'])('rejects and removes a failed script for recovery: %s', async (event) => {
    const loading = loadNewsletterTurnstile()
    script.dispatchEvent(new Event(event))

    const outcomes = await Promise.allSettled([loading])
    expect(outcomes).toEqual([{ status: 'rejected', reason: new Error('Newsletter verification could not be loaded') }])
    expect(script.remove).toHaveBeenCalledTimes(1)
    expect(cancel).toHaveBeenCalledWith(1)
  })

  test('times out a blocked script and ignores its late load event', async () => {
    const loading = loadNewsletterTurnstile()
    schedule.mock.calls[0]?.[0]()

    const outcomes = await Promise.allSettled([loading])
    expect(outcomes).toEqual([{ status: 'rejected', reason: new Error('Newsletter verification could not be loaded') }])
    expect(script.remove).toHaveBeenCalledTimes(1)

    browser.turnstile = api
    script.dispatchEvent(new Event('load'))
    expect(cancel).toHaveBeenCalledTimes(1)
  })

  test('allows a new loading attempt after failure', async () => {
    const failed = loadNewsletterTurnstile()
    script.dispatchEvent(new Event('error'))
    const outcomes = await Promise.allSettled([failed])
    expect(outcomes[0]?.status).toBe('rejected')

    script = new ScriptMock()
    const retry = loadNewsletterTurnstile()
    browser.turnstile = api
    script.dispatchEvent(new Event('load'))

    expect(await retry).toBe(api)
    expect(append).toHaveBeenCalledTimes(2)
  })
})

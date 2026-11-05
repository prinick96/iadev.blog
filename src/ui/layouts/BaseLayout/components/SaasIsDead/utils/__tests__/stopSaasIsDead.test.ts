import { afterEach, beforeEach, expect, mock, test } from 'bun:test'
import { WIDGET_DISMISSAL_KEY } from '@/ui/layouts/BaseLayout/components/SaasIsDead/constants'
import { stopSaasIsDead } from '@/ui/layouts/BaseLayout/components/SaasIsDead/utils/stopSaasIsDead'

const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
const mount = { replaceChildren: mock(() => {}) }
const querySelector = mock((_selector: string): typeof mount | null => mount)
const removeItem = mock((_key: string) => {})

beforeEach(() => {
  mount.replaceChildren.mockClear()
  querySelector.mockReset().mockReturnValue(mount)
  removeItem.mockReset()
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { querySelector } })
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { removeItem } })
})

afterEach(() => {
  for (const [key, descriptor] of [
    ['document', originalDocument],
    ['localStorage', originalStorage],
  ] as const) {
    if (descriptor) {
      Object.defineProperty(globalThis, key, descriptor)
    } else {
      Reflect.deleteProperty(globalThis, key)
    }
  }
})

test('aborts loading, unmounts the widget and removes only its dismissal entry', () => {
  const controller = new AbortController()

  stopSaasIsDead(controller)

  expect(controller.signal.aborted).toBe(true)
  expect(querySelector).toHaveBeenCalledWith('[data-saas-is-dead-mount]')
  expect(mount.replaceChildren).toHaveBeenCalledTimes(1)
  expect(removeItem.mock.calls).toEqual([[WIDGET_DISMISSAL_KEY]])
})

test('handles an absent widget mount', () => {
  querySelector.mockReturnValue(null)
  const controller = new AbortController()

  expect(() => stopSaasIsDead(controller)).not.toThrow()
  expect(controller.signal.aborted).toBe(true)
  expect(mount.replaceChildren).not.toHaveBeenCalled()
  expect(removeItem).toHaveBeenCalledWith(WIDGET_DISMISSAL_KEY)
})

test('still aborts and unmounts when storage removal fails', () => {
  removeItem.mockImplementation(() => {
    throw new Error('Storage is unavailable')
  })
  const controller = new AbortController()

  expect(() => stopSaasIsDead(controller)).not.toThrow()
  expect(controller.signal.aborted).toBe(true)
  expect(mount.replaceChildren).toHaveBeenCalledTimes(1)
})

import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import * as initializer from '@/ui/layouts/BaseLayout/components/SaasIsDead/utils/initializeSaasIsDead'
import { loadSaasIsDead } from '@/ui/layouts/BaseLayout/components/SaasIsDead/utils/loadSaasIsDead'

const originals = Object.fromEntries(
  ['document', 'window', 'customElements'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
)

class ScriptMock extends EventTarget {
  src = ''
  crossOrigin = ''
  async = false
  remove = mock(() => {})
}

let script: ScriptMock
const appendScript = mock((_script: ScriptMock) => {})
const appendWidget = mock((_fragment: object) => {})
const cloneNode = mock((_deep: boolean) => ({ fragment: true }))
const getDefinition = mock((): object | undefined => ({}))
const schedule = mock((_callback: () => void, _delay: number) => 1)
const clearTimer = mock((_timer: number) => {})
let initializeSpy = spyOn(initializer, 'initializeSaasIsDead')
let mountedChildren = 0
let hasTemplate = true
let hasMount = true
let hasStylesheet = true
let allowed = true

beforeEach(() => {
  script = new ScriptMock()
  mountedChildren = 0
  hasTemplate = true
  hasMount = true
  hasStylesheet = true
  allowed = true
  appendScript.mockClear()
  appendWidget.mockClear()
  cloneNode.mockClear()
  schedule.mockClear()
  clearTimer.mockClear()
  getDefinition.mockReset()
  getDefinition.mockReturnValue({})
  initializeSpy = spyOn(initializer, 'initializeSaasIsDead').mockResolvedValue(undefined)
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      querySelector: (selector: string) => {
        if (selector === '[data-saas-is-dead-template]') {
          return hasTemplate ? { content: { cloneNode } } : null
        }
        if (!hasMount) {
          return null
        }
        return {
          childElementCount: mountedChildren,
          append: appendWidget,
          dataset: { stylesheetUrl: hasStylesheet ? '/widget.css' : undefined },
        }
      },
      createElement: (tag: string) => {
        expect(tag).toBe('script')
        return script
      },
      head: { append: appendScript },
    },
  })
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { setTimeout: schedule, clearTimeout: clearTimer },
  })
  Object.defineProperty(globalThis, 'customElements', {
    configurable: true,
    value: { get: getDefinition },
  })
})

afterEach(() => {
  initializeSpy.mockRestore()
  for (const [key, descriptor] of Object.entries(originals)) {
    if (descriptor) {
      Object.defineProperty(globalThis, key, descriptor)
    } else {
      Reflect.deleteProperty(globalThis, key)
    }
  }
})

const load = (signal = new AbortController().signal) => loadSaasIsDead(signal, () => allowed)

describe('loadSaasIsDead', () => {
  test('does not fetch anything before authorization', async () => {
    allowed = false
    await load()
    expect(appendScript).not.toHaveBeenCalled()
    expect(appendWidget).not.toHaveBeenCalled()
  })

  test('does not fetch or mount after cancellation', async () => {
    await load(AbortSignal.abort())
    expect(appendScript).not.toHaveBeenCalled()
  })

  test.each(['template', 'mount', 'stylesheet', 'mounted'])(
    'skips unavailable or already mounted content: %s',
    async (state) => {
      hasTemplate = state !== 'template'
      hasMount = state !== 'mount'
      hasStylesheet = state !== 'stylesheet'
      mountedChildren = state === 'mounted' ? 1 : 0
      await load()
      expect(appendScript).not.toHaveBeenCalled()
    }
  )

  test('loads upstream once authorized and only then mounts and styles the widget', async () => {
    const loading = load()
    expect(script.src).toBe('https://saasisdead.si/reaper/v1.js')
    expect(script.crossOrigin).toBe('anonymous')
    expect(appendScript).toHaveBeenCalledTimes(1)
    expect(appendWidget).not.toHaveBeenCalled()
    script.dispatchEvent(new Event('load'))
    await loading
    expect(cloneNode).toHaveBeenCalledWith(true)
    expect(appendWidget).toHaveBeenCalledTimes(1)
    expect(initializeSpy).toHaveBeenCalledWith('/widget.css')
    expect(clearTimer).toHaveBeenCalledWith(1)
    expect(script.remove).toHaveBeenCalledTimes(1)
  })

  test('rechecks authorization after download, including expiry during loading', async () => {
    const loading = load()
    allowed = false
    script.dispatchEvent(new Event('load'))
    await loading
    expect(appendWidget).not.toHaveBeenCalled()
    expect(initializeSpy).not.toHaveBeenCalled()
  })

  test('aborts a pending download without ever mounting and ignores its late load', async () => {
    const controller = new AbortController()
    const loading = load(controller.signal)
    controller.abort()
    const [result] = await Promise.allSettled([loading])
    expect(result).toMatchObject({ status: 'rejected', reason: new Error('The optional widget was cancelled') })
    script.dispatchEvent(new Event('load'))
    expect(appendWidget).not.toHaveBeenCalled()
    expect(script.remove).toHaveBeenCalled()
  })

  test('does not mount when aborted after download but before its continuation', async () => {
    const controller = new AbortController()
    const loading = load(controller.signal)
    script.dispatchEvent(new Event('load'))
    controller.abort()
    await loading
    expect(appendWidget).not.toHaveBeenCalled()
    expect(initializeSpy).not.toHaveBeenCalled()
    expect(script.remove).toHaveBeenCalledTimes(1)
  })

  test('removes the script and propagates a stylesheet initialization failure', async () => {
    initializeSpy.mockRejectedValue(new Error('stylesheet failure'))
    const loading = load()
    script.dispatchEvent(new Event('load'))
    const [result] = await Promise.allSettled([loading])
    expect(result).toMatchObject({ status: 'rejected', reason: new Error('stylesheet failure') })
    expect(script.remove).toHaveBeenCalledTimes(1)
  })

  test('rejects a network error and removes the script', async () => {
    const loading = load()
    script.dispatchEvent(new Event('error'))
    const [result] = await Promise.allSettled([loading])
    expect(result).toMatchObject({ status: 'rejected', reason: new Error('The optional widget could not be loaded') })
    expect(appendWidget).not.toHaveBeenCalled()
    expect(script.remove).toHaveBeenCalled()
  })

  test('bounds a stalled download and ignores a late successful load', async () => {
    const loading = load()
    expect(schedule).toHaveBeenCalledWith(expect.any(Function), 15_000)
    schedule.mock.calls[0]?.[0]()
    const [result] = await Promise.allSettled([loading])
    expect(result).toMatchObject({ status: 'rejected', reason: new Error('The optional widget could not be loaded') })
    script.dispatchEvent(new Event('load'))
    expect(appendWidget).not.toHaveBeenCalled()
  })

  test('rejects a script that does not register the element', async () => {
    getDefinition.mockReturnValue(undefined)
    const loading = load()
    script.dispatchEvent(new Event('load'))
    const [result] = await Promise.allSettled([loading])
    expect(result).toMatchObject({
      status: 'rejected',
      reason: new Error('The optional widget did not register its custom element'),
    })
    expect(appendWidget).not.toHaveBeenCalled()
  })
})

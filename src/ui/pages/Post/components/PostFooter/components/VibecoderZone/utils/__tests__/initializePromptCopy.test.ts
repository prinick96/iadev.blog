import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { initializePromptCopy } from '@/ui/pages/Post/components/PostFooter/components/VibecoderZone/utils/initializePromptCopy'

class CopyButtonMock {
  hidden = true
  disabled = false
  private listener?: () => Promise<void>

  addEventListener = mock((_event: string, listener: () => Promise<void>) => {
    this.listener = listener
  })

  async click(): Promise<void> {
    await this.listener?.()
  }
}

class PromptZoneMock {
  button: CopyButtonMock | null = new CopyButtonMock()
  prompt: { textContent: string | null } | null = { textContent: 'Lee https://iadev.blog/posts/example/ y resúmelo.' }

  querySelector(selector: string) {
    switch (selector) {
      case 'button[data-vibecoder-copy]':
        return this.button
      case '[data-vibecoder-prompt]':
        return this.prompt
      default:
        return null
    }
  }
}

const browserGlobals = ['document', 'navigator', 'HTMLButtonElement']
const originalDescriptors = browserGlobals.map(
  (name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const
)
const writeTextMock = mock<(text: string) => Promise<void>>()
let zones: PromptZoneMock[] = []

beforeEach(() => {
  zones = []
  writeTextMock.mockReset()
  writeTextMock.mockResolvedValue(undefined)
  Object.defineProperties(globalThis, {
    document: { configurable: true, value: { querySelectorAll: () => zones } },
    navigator: { configurable: true, value: { clipboard: { writeText: writeTextMock } } },
    HTMLButtonElement: { configurable: true, value: CopyButtonMock },
  })
})

afterEach(() => {
  for (const [name, descriptor] of originalDescriptors) {
    if (descriptor) {
      Object.defineProperty(globalThis, name, descriptor)
    } else {
      Reflect.deleteProperty(globalThis, name)
    }
  }
})

describe('initializePromptCopy', () => {
  test('does nothing when there are no prompt zones', () => {
    expect(() => initializePromptCopy()).not.toThrow()
    expect(writeTextMock).not.toHaveBeenCalled()
  })

  test('reveals the copy button and registers its click handler', () => {
    const zone = new PromptZoneMock()
    zones.push(zone)

    initializePromptCopy()

    expect(zone.button?.hidden).toBe(false)
    expect(zone.button?.addEventListener).toHaveBeenCalledWith('click', expect.any(Function))
    expect(writeTextMock).not.toHaveBeenCalled()
  })

  test('copies the exact prompt without changing its contents', async () => {
    const zone = new PromptZoneMock()
    zones.push(zone)
    initializePromptCopy()

    await zone.button?.click()

    expect(writeTextMock).toHaveBeenCalledTimes(1)
    expect(writeTextMock).toHaveBeenCalledWith(zone.prompt?.textContent)
    expect(zone.prompt?.textContent).toBe('Lee https://iadev.blog/posts/example/ y resúmelo.')
    expect(zone.button?.disabled).toBe(false)
  })

  test('disables the button while copying and re-enables it afterwards', async () => {
    const zone = new PromptZoneMock()
    zones.push(zone)
    const pendingCopy = Promise.withResolvers<void>()
    writeTextMock.mockReturnValue(pendingCopy.promise)
    initializePromptCopy()

    const click = zone.button?.click()

    expect(zone.button?.disabled).toBe(true)

    pendingCopy.resolve()
    await click

    expect(zone.button?.disabled).toBe(false)
  })

  test('handles clipboard errors silently, re-enables the button and allows retrying', async () => {
    const zone = new PromptZoneMock()
    zones.push(zone)
    writeTextMock.mockRejectedValueOnce(new Error('Clipboard permission denied'))
    initializePromptCopy()

    await zone.button?.click()

    expect(zone.button?.disabled).toBe(false)

    await zone.button?.click()

    expect(writeTextMock).toHaveBeenCalledTimes(2)
    expect(zone.prompt?.textContent).toBe('Lee https://iadev.blog/posts/example/ y resúmelo.')
  })

  test.each([undefined, {}])('keeps buttons hidden when clipboard writing is unavailable: %p', (clipboard) => {
    const zone = new PromptZoneMock()
    zones.push(zone)
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard } })

    initializePromptCopy()

    expect(zone.button?.hidden).toBe(true)
    expect(zone.button?.addEventListener).not.toHaveBeenCalled()
  })

  test.each(['button', 'prompt'] as const)('skips zones missing their %s without preventing other zones', (field) => {
    const incompleteZone = new PromptZoneMock()
    incompleteZone[field] = null
    const completeZone = new PromptZoneMock()
    zones.push(incompleteZone, completeZone)

    initializePromptCopy()

    expect(incompleteZone.button?.addEventListener.mock.calls ?? []).toEqual([])
    expect(completeZone.button?.hidden).toBe(false)
    expect(completeZone.button?.addEventListener).toHaveBeenCalledTimes(1)
  })

  test('skips copy controls that are not button elements', () => {
    const zone = new PromptZoneMock()
    zones.push(zone)
    Object.defineProperty(globalThis, 'HTMLButtonElement', { configurable: true, value: class OtherButton {} })

    initializePromptCopy()

    expect(zone.button?.hidden).toBe(true)
    expect(zone.button?.addEventListener).not.toHaveBeenCalled()
  })

  test('copies only the prompt belonging to the clicked zone', async () => {
    const firstZone = new PromptZoneMock()
    const secondZone = new PromptZoneMock()
    secondZone.prompt = { textContent: 'Lee https://iadev.blog/posts/another-example/ y resúmelo.' }
    zones.push(firstZone, secondZone)
    initializePromptCopy()

    await secondZone.button?.click()

    expect(writeTextMock).toHaveBeenCalledTimes(1)
    expect(writeTextMock).toHaveBeenCalledWith(secondZone.prompt.textContent)
    expect(firstZone.prompt?.textContent).toBe('Lee https://iadev.blog/posts/example/ y resúmelo.')
  })

  test('copies an empty string when prompt text is null', async () => {
    const zone = new PromptZoneMock()
    zone.prompt = { textContent: null }
    zones.push(zone)
    initializePromptCopy()

    await zone.button?.click()

    expect(writeTextMock).toHaveBeenCalledWith('')
  })
})

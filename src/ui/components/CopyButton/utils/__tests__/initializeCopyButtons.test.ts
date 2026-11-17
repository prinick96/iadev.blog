import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { initializeCopyButtons } from '@/ui/components/CopyButton/utils/initializeCopyButtons'

class CopyButtonMock {
  hidden = true
  disabled = false
  dataset: { copyInitialized?: string } = {}
  private listener?: () => Promise<void>

  addEventListener = mock((_event: string, listener: () => Promise<void>) => {
    this.listener = listener
  })

  async click(): Promise<void> {
    await this.listener?.()
  }
}

class CopyContainerMock {
  button = new CopyButtonMock()
  source = { textContent: 'Lee https://iadev.blog/posts/example/ y resúmelo.' }

  querySelectorAll(selector: string) {
    switch (selector) {
      case 'button[data-copy-button]':
        return [this.button]
      case '[data-copy-content]':
        return [this.source]
      default:
        return []
    }
  }
}

const browserGlobals = ['document', 'navigator']
const originalDescriptors = browserGlobals.map(
  (name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const
)
const writeTextMock = mock<(text: string) => Promise<void>>()
let containers: CopyContainerMock[] = []
const querySelectorAllMock = mock((_selector: string) => containers)

beforeEach(() => {
  containers = []
  querySelectorAllMock.mockClear()
  writeTextMock.mockReset()
  writeTextMock.mockResolvedValue(undefined)
  Object.defineProperties(globalThis, {
    document: { configurable: true, value: { querySelectorAll: querySelectorAllMock } },
    navigator: { configurable: true, value: { clipboard: { writeText: writeTextMock } } },
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

describe('initializeCopyButtons', () => {
  test('does nothing when there are no copy containers', () => {
    expect(() => initializeCopyButtons()).not.toThrow()
    expect(querySelectorAllMock).toHaveBeenCalledWith('[data-copy-container]')
    expect(writeTextMock).not.toHaveBeenCalled()
  })

  test('reveals the copy button, marks it initialized and registers its click handler', () => {
    const container = new CopyContainerMock()
    containers.push(container)

    initializeCopyButtons()

    expect(container.button.hidden).toBe(false)
    expect(container.button.dataset.copyInitialized).toBe('true')
    expect(container.button.addEventListener).toHaveBeenCalledWith('click', expect.any(Function))
    expect(writeTextMock).not.toHaveBeenCalled()
  })

  test('copies the exact source text without changing its contents', async () => {
    const container = new CopyContainerMock()
    container.source.textContent = '  const answer = 42\n\n  console.log(answer)\n'
    containers.push(container)
    initializeCopyButtons()

    await container.button.click()

    expect(writeTextMock).toHaveBeenCalledTimes(1)
    expect(writeTextMock).toHaveBeenCalledWith(container.source.textContent)
    expect(container.source.textContent).toBe('  const answer = 42\n\n  console.log(answer)\n')
    expect(container.button.disabled).toBe(false)
  })

  test('disables the button while copying and re-enables it afterwards', async () => {
    const container = new CopyContainerMock()
    containers.push(container)
    const pendingCopy = Promise.withResolvers<void>()
    writeTextMock.mockReturnValue(pendingCopy.promise)
    initializeCopyButtons()

    const click = container.button.click()

    expect(container.button.disabled).toBe(true)

    pendingCopy.resolve()
    await click

    expect(container.button.disabled).toBe(false)
  })

  test('handles clipboard errors silently, re-enables the button and allows retrying', async () => {
    const container = new CopyContainerMock()
    containers.push(container)
    writeTextMock.mockRejectedValueOnce(new Error('Clipboard permission denied'))
    initializeCopyButtons()

    await container.button.click()

    expect(container.button.disabled).toBe(false)

    await container.button.click()

    expect(writeTextMock).toHaveBeenCalledTimes(2)
    expect(container.source.textContent).toBe('Lee https://iadev.blog/posts/example/ y resúmelo.')
  })

  test.each([undefined, {}])('keeps buttons hidden when clipboard writing is unavailable: %p', (clipboard) => {
    const container = new CopyContainerMock()
    containers.push(container)
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard } })

    initializeCopyButtons()

    expect(querySelectorAllMock).not.toHaveBeenCalled()
    expect(container.button.hidden).toBe(true)
    expect(container.button.dataset.copyInitialized).toBeUndefined()
    expect(container.button.addEventListener).not.toHaveBeenCalled()
  })

  test('copies only the source belonging to the clicked container', async () => {
    const firstContainer = new CopyContainerMock()
    const secondContainer = new CopyContainerMock()
    secondContainer.source.textContent = 'Lee https://iadev.blog/posts/another-example/ y resúmelo.'
    containers.push(firstContainer, secondContainer)
    initializeCopyButtons()

    await secondContainer.button.click()

    expect(writeTextMock).toHaveBeenCalledTimes(1)
    expect(writeTextMock).toHaveBeenCalledWith(secondContainer.source.textContent)
    expect(firstContainer.source.textContent).toBe('Lee https://iadev.blog/posts/example/ y resúmelo.')
  })

  test('copies an empty source without replacing its text', async () => {
    const container = new CopyContainerMock()
    container.source.textContent = ''
    containers.push(container)
    initializeCopyButtons()

    await container.button.click()

    expect(writeTextMock).toHaveBeenCalledWith('')
  })

  test('does not register duplicate handlers when initialized repeatedly', async () => {
    const container = new CopyContainerMock()
    containers.push(container)

    initializeCopyButtons()
    initializeCopyButtons()
    await container.button.click()

    expect(container.button.dataset.copyInitialized).toBe('true')
    expect(container.button.addEventListener).toHaveBeenCalledTimes(1)
    expect(writeTextMock).toHaveBeenCalledTimes(1)
  })

  test('initializes newly added containers without reinitializing existing buttons', async () => {
    const firstContainer = new CopyContainerMock()
    containers.push(firstContainer)
    initializeCopyButtons()
    const secondContainer = new CopyContainerMock()
    containers.push(secondContainer)

    initializeCopyButtons()
    await secondContainer.button.click()

    expect(firstContainer.button.addEventListener).toHaveBeenCalledTimes(1)
    expect(secondContainer.button.hidden).toBe(false)
    expect(secondContainer.button.dataset.copyInitialized).toBe('true')
    expect(secondContainer.button.addEventListener).toHaveBeenCalledTimes(1)
    expect(writeTextMock).toHaveBeenCalledTimes(1)
  })
})

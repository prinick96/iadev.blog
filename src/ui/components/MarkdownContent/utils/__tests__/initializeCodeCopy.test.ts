import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { initializeCodeCopy } from '@/ui/components/MarkdownContent/utils/initializeCodeCopy'

class CodeMock {
  textContent = '  const answer = 42\n\n  console.log(answer)\n'
  attributes = new Map<string, string>()

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value)
  }
}

class CodeBlockMock {
  code = new CodeMock()
  parentElement: ContainerMock | null = null
  before = mock((_container: ContainerMock) => {})
  querySelectorAll = mock((selector: string) => (selector === 'code' ? [this.code] : []))
  closest = mock((_selector: string) => this.parentElement)
}

class ContainerMock {
  className = ''
  attributes = new Map<string, string>()
  children: unknown[] = []

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value)
  }

  append(block: CodeBlockMock, button: unknown): void {
    this.children.push(block, button)
    block.parentElement = this
  }
}

class TemplateMock {
  content = { cloneNode: mock((_deep: boolean) => ({ button: Symbol('copy-button') })) }
}

class MarkdownContentMock {
  template = new TemplateMock()
  blocks = [new CodeBlockMock()]

  querySelectorAll = mock((selector: string) => {
    switch (selector) {
      case 'template[data-code-copy-template]':
        return [this.template]
      case 'pre.astro-code':
        return this.blocks
      default:
        return []
    }
  })
}

const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
let contents: MarkdownContentMock[] = []
let containers: ContainerMock[] = []
const querySelectorAllMock = mock((_selector: string) => contents)
const createElementMock = mock((_tagName: string) => {
  const container = new ContainerMock()
  containers.push(container)
  return container
})

beforeEach(() => {
  contents = []
  containers = []
  querySelectorAllMock.mockClear()
  createElementMock.mockClear()
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { querySelectorAll: querySelectorAllMock, createElement: createElementMock },
  })
})

afterEach(() => {
  if (originalDocument) {
    Object.defineProperty(globalThis, 'document', originalDocument)
  } else {
    Reflect.deleteProperty(globalThis, 'document')
  }
})

describe('initializeCodeCopy', () => {
  test('does nothing when there is no Markdown content', () => {
    expect(() => initializeCodeCopy()).not.toThrow()
    expect(querySelectorAllMock).toHaveBeenCalledWith('.markdown-content')
    expect(createElementMock).not.toHaveBeenCalled()
  })

  test('wraps highlighted code with its own cloned copy button without replacing the original code', () => {
    const content = new MarkdownContentMock()
    const block = content.blocks[0]
    const originalCode = block.code
    contents.push(content)

    initializeCodeCopy()

    const container = containers[0]
    expect(content.querySelectorAll).toHaveBeenCalledWith('pre.astro-code')
    expect(createElementMock).toHaveBeenCalledWith('div')
    expect(container.className).toBe('markdown-content__code-block')
    expect(container.attributes.get('data-copy-container')).toBe('')
    expect(block.before).toHaveBeenCalledWith(container)
    expect(container.children[0]).toBe(block)
    expect(block.parentElement).toBe(container)
    expect(block.code).toBe(originalCode)
    expect(block.code.attributes.get('data-copy-content')).toBe('')
    expect(block.code.textContent).toBe('  const answer = 42\n\n  console.log(answer)\n')
    expect(content.template.content.cloneNode).toHaveBeenCalledWith(true)
    expect(container.children[1]).toBe(content.template.content.cloneNode.mock.results[0].value)
  })

  test('creates independent buttons for every highlighted block', () => {
    const content = new MarkdownContentMock()
    content.blocks.push(new CodeBlockMock())
    contents.push(content)

    initializeCodeCopy()

    expect(containers).toHaveLength(2)
    expect(content.template.content.cloneNode).toHaveBeenCalledTimes(2)
    expect(containers[0].children[0]).toBe(content.blocks[0])
    expect(containers[1].children[0]).toBe(content.blocks[1])
    expect(containers[0].children[1]).not.toBe(containers[1].children[1])
  })

  test('uses the template belonging to each Markdown container', () => {
    const firstContent = new MarkdownContentMock()
    const secondContent = new MarkdownContentMock()
    contents.push(firstContent, secondContent)

    initializeCodeCopy()

    expect(containers).toHaveLength(2)
    expect(firstContent.template.content.cloneNode).toHaveBeenCalledTimes(1)
    expect(secondContent.template.content.cloneNode).toHaveBeenCalledTimes(1)
    expect(containers[0].children[1]).toBe(firstContent.template.content.cloneNode.mock.results[0].value)
    expect(containers[1].children[1]).toBe(secondContent.template.content.cloneNode.mock.results[0].value)
  })

  test('does not create containers when there are no highlighted blocks', () => {
    const content = new MarkdownContentMock()
    content.blocks = []
    contents.push(content)

    initializeCodeCopy()

    expect(createElementMock).not.toHaveBeenCalled()
    expect(content.template.content.cloneNode).not.toHaveBeenCalled()
  })

  test('does not duplicate containers or buttons when initialized repeatedly', () => {
    const content = new MarkdownContentMock()
    contents.push(content)

    initializeCodeCopy()
    initializeCodeCopy()

    expect(containers).toHaveLength(1)
    expect(content.blocks[0].closest).toHaveBeenCalledWith('[data-copy-container]')
    expect(content.blocks[0].before).toHaveBeenCalledTimes(1)
    expect(content.template.content.cloneNode).toHaveBeenCalledTimes(1)
  })

  test('wraps new blocks without changing existing copy containers', () => {
    const content = new MarkdownContentMock()
    contents.push(content)
    initializeCodeCopy()
    const newBlock = new CodeBlockMock()
    content.blocks.push(newBlock)

    initializeCodeCopy()

    expect(containers).toHaveLength(2)
    expect(content.blocks[0].before).toHaveBeenCalledTimes(1)
    expect(newBlock.before).toHaveBeenCalledTimes(1)
    expect(containers[1].children[0]).toBe(newBlock)
  })
})

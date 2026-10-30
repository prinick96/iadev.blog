import { afterEach, expect, mock, test } from 'bun:test'
import { initializeSaasIsDead } from '@/ui/layouts/BaseLayout/components/SaasIsDead/utils/initializeSaasIsDead'

const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
const originalCustomElements = Object.getOwnPropertyDescriptor(globalThis, 'customElements')
const stylesheetUrl = '/_astro/styles.test.css'

class StylesheetMock {
  rel = ''
  href = ''
  attributes = new Map<string, string>()

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value)
  }
}

class ShadowRootMock {
  stylesheets: StylesheetMock[] = []

  querySelector(selector: string): StylesheetMock | undefined {
    expect(selector).toBe('link[data-saas-is-dead-styles]')
    return this.stylesheets.find((stylesheet) => stylesheet.attributes.has('data-saas-is-dead-styles'))
  }

  append(stylesheet: StylesheetMock): void {
    this.stylesheets.push(stylesheet)
  }
}

function setEnvironment(widgets: { shadowRoot: ShadowRootMock | null }[], ready = Promise.resolve()): void {
  Object.defineProperty(globalThis, 'customElements', {
    configurable: true,
    value: {
      whenDefined: mock((name: string) => {
        expect(name).toBe('saas-is-dead')
        return ready
      }),
    },
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      querySelectorAll: (selector: string) => {
        expect(selector).toBe('saas-is-dead.saas-is-dead')
        return widgets
      },
      createElement: (tag: string) => {
        expect(tag).toBe('link')
        return new StylesheetMock()
      },
    },
  })
}

afterEach(() => {
  if (originalDocument) {
    Object.defineProperty(globalThis, 'document', originalDocument)
  } else {
    Reflect.deleteProperty(globalThis, 'document')
  }
  if (originalCustomElements) {
    Object.defineProperty(globalThis, 'customElements', originalCustomElements)
  } else {
    Reflect.deleteProperty(globalThis, 'customElements')
  }
})

test('waits for the external custom element before installing the stylesheet', async () => {
  const ready = Promise.withResolvers<void>()
  const root = new ShadowRootMock()
  setEnvironment([{ shadowRoot: root }], ready.promise)

  const initialization = initializeSaasIsDead(stylesheetUrl)
  expect(root.stylesheets).toHaveLength(0)
  ready.resolve()
  await initialization

  expect(root.stylesheets).toHaveLength(1)
  expect(root.stylesheets[0]?.rel).toBe('stylesheet')
  expect(root.stylesheets[0]?.href).toBe(stylesheetUrl)
  expect(root.stylesheets[0]?.attributes.get('data-saas-is-dead-styles')).toBe('')
})

test('does not duplicate the stylesheet on repeated initialization', async () => {
  const root = new ShadowRootMock()
  setEnvironment([{ shadowRoot: root }])

  await initializeSaasIsDead(stylesheetUrl)
  await initializeSaasIsDead(stylesheetUrl)

  expect(root.stylesheets).toHaveLength(1)
})

test('handles missing widgets without creating a stylesheet', async () => {
  setEnvironment([])

  const result = await initializeSaasIsDead(stylesheetUrl)

  expect(result).toBeUndefined()
})

test('skips inaccessible shadow roots and initializes each accessible widget independently', async () => {
  const first = new ShadowRootMock()
  const second = new ShadowRootMock()
  setEnvironment([{ shadowRoot: null }, { shadowRoot: first }, { shadowRoot: second }])

  await initializeSaasIsDead(stylesheetUrl)

  expect(first.stylesheets).toHaveLength(1)
  expect(second.stylesheets).toHaveLength(1)
  expect(first.stylesheets[0]).not.toBe(second.stylesheets[0])
})

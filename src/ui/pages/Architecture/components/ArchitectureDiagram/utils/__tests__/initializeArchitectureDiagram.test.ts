import { afterEach, expect, mock, test } from 'bun:test'
import { initializeArchitectureDiagram } from '@/ui/pages/Architecture/components/ArchitectureDiagram/utils/initializeArchitectureDiagram'

const globalNames = ['document', 'Element', 'HTMLButtonElement', 'PointerEvent', 'ResizeObserver']
const originalDescriptors = new Map(
  globalNames.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)])
)

class DiagramEventMock {
  target: ElementMock | null = null
  defaultPrevented = false
  detail = 1
  key = ''
  ctrlKey = false
  metaKey = false
  deltaY = 0
  clientX = 0
  clientY = 0
  button = 0
  pointerId = 1

  constructor(properties: Partial<DiagramEventMock> = {}) {
    Object.assign(this, properties)
  }

  preventDefault(): void {
    this.defaultPrevented = true
  }
}

class PointerEventMock extends DiagramEventMock {}

function datasetKey(name: string): string {
  return name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

class ElementMock {
  children: ElementMock[] = []
  parent: ElementMock | null = null
  attributes = new Map<string, string>()
  listeners = new Map<string, ((event: DiagramEventMock) => void)[]>()
  hidden = false
  disabled = false
  value = ''
  textContent = ''
  rect = { left: 100, top: 50, width: 800, height: 400 }
  setPointerCapture = mock((_pointerId: number): void => {})
  requestFullscreen = mock(async (): Promise<void> => {})

  constructor(
    public dataset: Record<string, string> = {},
    public tagName = 'div'
  ) {}

  append(...children: ElementMock[]): void {
    for (const child of children) {
      child.parent = this
      this.children.push(child)
    }
  }

  remove(): void {
    if (this.parent) {
      this.parent.children = this.parent.children.filter((child) => child !== this)
      this.parent = null
    }
  }

  getAttribute(name: string): string | null {
    if (name.startsWith('data-')) {
      return this.dataset[datasetKey(name.slice(5))] ?? null
    }
    return this.attributes.get(name) ?? null
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value)
  }

  matches(selector: string): boolean {
    if (selector === 'button') {
      return this.tagName === 'button'
    }
    const match = /^\[(data-[\w-]+)(?:="([^"]*)")?\]$/.exec(selector)
    if (!match) {
      throw new Error(`Unsupported mock selector: ${selector}`)
    }
    const value = this.getAttribute(match[1])
    return value !== null && (match[2] === undefined || value === match[2])
  }

  querySelectorAll(selector: string): ElementMock[] {
    return this.children.flatMap((child) => [
      ...(child.matches(selector) ? [child] : []),
      ...child.querySelectorAll(selector),
    ])
  }

  querySelector(selector: string): ElementMock | null {
    return this.querySelectorAll(selector)[0] ?? null
  }

  closest(selector: string): ElementMock | null {
    return this.matches(selector) ? this : (this.parent?.closest(selector) ?? null)
  }

  getBoundingClientRect(): typeof this.rect {
    return this.rect
  }

  focus(): void {
    for (let ancestor: ElementMock | null = this; ancestor; ancestor = ancestor.parent) {
      if (ancestor instanceof DocumentMock) {
        ancestor.activeElement = this
        return
      }
    }
  }

  addEventListener(type: string, listener: (event: DiagramEventMock) => void): void {
    const listeners = this.listeners.get(type) ?? []
    this.listeners.set(type, [...listeners, listener])
  }

  dispatch(type: string, event = new DiagramEventMock()): DiagramEventMock {
    event.target ??= this
    for (let current: ElementMock | null = this; current; current = current.parent) {
      for (const listener of current.listeners.get(type) ?? []) {
        listener(event)
      }
    }
    return event
  }
}

class ButtonMock extends ElementMock {
  constructor(dataset: Record<string, string> = {}, text = '') {
    super(dataset, 'button')
    this.textContent = text
  }
}

class SvgMock extends ElementMock {
  viewBox = { baseVal: { x: 0, y: 0, width: 1000, height: 500 } }

  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value)
    if (name === 'viewBox') {
      const [x = 0, y = 0, width = 0, height = 0] = value.split(' ').map(Number)
      this.viewBox.baseVal = { x, y, width, height }
    }
  }
}

class DocumentMock extends ElementMock {
  activeElement: ElementMock | null = null
  fullscreenElement: ElementMock | null = null
  fullscreenEnabled = true
  exitFullscreen = mock(async (): Promise<void> => {})
}

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = []
  observe = mock((_target: ElementMock): void => {})

  constructor(public callback: () => void) {
    ResizeObserverMock.instances.push(this)
  }
}

function createDiagram() {
  ResizeObserverMock.instances = []
  const document = new DocumentMock()
  const root = new ElementMock({ architectureDiagram: '' })
  const viewport = new ElementMock()
  const canvas = new ElementMock({ diagramCanvas: '' })
  const svg = new SvgMock({ diagramSvg: '', diagramWidth: '1000' })
  const controls = new ElementMock({ diagramControls: '' })
  controls.hidden = true
  const toolbar = new ElementMock({ diagramToolbar: '' })
  toolbar.hidden = true
  const overview = new ElementMock({ diagramOverview: '' })
  const output = new ElementMock({ diagramZoom: '' })
  const status = new ElementMock({ diagramStatus: '' })
  const nodes = [
    new ButtonMock({ diagramNode: 'entry', nodeBounds: '0 0 100 100' }, 'Entrada'),
    new ButtonMock({ diagramNode: 'domain', nodeBounds: '200 0 100 100' }, 'Dominio'),
    new ButtonMock({ diagramNode: 'output', nodeBounds: '600 200 100 100' }, 'Salida'),
    new ButtonMock({ diagramNode: 'archive', nodeBounds: '900 300 100 100' }, 'Archivo'),
  ]
  const views = [
    new ButtonMock({ diagramView: 'reading', focusNodes: 'entry domain' }, 'Lectura'),
    new ButtonMock({ diagramView: 'content', focusNodes: 'domain output' }, 'Contenido'),
  ]
  const panels = nodes.map((node) => {
    const panel = new ElementMock({ nodePanel: node.dataset.diagramNode })
    const title = new ElementMock({ diagramDetailTitle: '' }, 'h2')
    title.textContent = node.textContent
    title.setAttribute('tabindex', '-1')
    panel.append(title)
    panel.hidden = true
    return panel
  })
  const notes = views.map((view) => new ElementMock({ viewNote: view.dataset.diagramView }))
  const connections = [
    new ElementMock({ connectionFrom: 'entry', connectionTo: 'domain' }),
    new ElementMock({ connectionFrom: 'domain', connectionTo: 'output' }),
    new ElementMock({ connectionFrom: 'output', connectionTo: 'archive' }),
  ]
  const actions = {
    in: new ButtonMock({ diagramAction: 'in' }),
    out: new ButtonMock({ diagramAction: 'out' }),
    fit: new ButtonMock({ diagramAction: 'fit' }),
    clear: new ButtonMock({ diagramAction: 'clear' }),
    fullscreen: new ButtonMock({ diagramAction: 'fullscreen' }),
  }
  const related = new ButtonMock({ nodeTarget: 'output' })
  svg.append(...connections)
  canvas.append(svg, ...nodes)
  controls.append(...views)
  toolbar.append(actions.in, actions.out, output, actions.fit, actions.fullscreen)
  actions.fullscreen.setAttribute('aria-label', 'Pantalla completa')
  actions.fullscreen.setAttribute('title', 'Pantalla completa')
  actions.fullscreen.append(new ElementMock({}, 'svg'))
  viewport.append(canvas, toolbar)
  panels[1].append(related, actions.clear)
  root.append(viewport, controls, overview, status, ...panels, ...notes)
  document.append(root)

  const globals = {
    document,
    Element: ElementMock,
    HTMLButtonElement: ButtonMock,
    PointerEvent: PointerEventMock,
    ResizeObserver: ResizeObserverMock,
  }
  for (const [name, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, name, { configurable: true, value })
  }

  return {
    document,
    root,
    viewport,
    canvas,
    svg,
    controls,
    toolbar,
    overview,
    output,
    status,
    nodes,
    views,
    panels,
    notes,
    connections,
    actions,
    related,
  }
}

function expectSelection(diagram: ReturnType<typeof createDiagram>, id: string): void {
  expect(diagram.overview.hidden).toBe(true)
  expect(diagram.nodes.map((node) => node.getAttribute('aria-pressed'))).toEqual(
    diagram.nodes.map((node) => String(node.dataset.diagramNode === id))
  )
  expect(diagram.panels.map((panel) => panel.hidden)).toEqual(
    diagram.panels.map((panel) => panel.dataset.nodePanel !== id)
  )
}

afterEach(() => {
  for (const name of globalNames) {
    const descriptor = originalDescriptors.get(name)
    if (descriptor) {
      Object.defineProperty(globalThis, name, descriptor)
    } else {
      Reflect.deleteProperty(globalThis, name)
    }
  }
  ResizeObserverMock.instances = []
})

test('does nothing when the diagram root is absent', () => {
  const diagram = createDiagram()
  diagram.root.remove()

  expect(() => initializeArchitectureDiagram()).not.toThrow()
  expect(diagram.root.dataset.ready).toBeUndefined()
  expect(diagram.root.listeners.size).toBe(0)
  expect(ResizeObserverMock.instances).toHaveLength(0)
})

test.each(['canvas', 'svg', 'controls', 'toolbar', 'overview', 'output', 'status'] as const)(
  'leaves an incomplete diagram untouched when %s is missing',
  (part) => {
    const diagram = createDiagram()
    diagram[part].remove()

    expect(() => initializeArchitectureDiagram()).not.toThrow()
    expect(diagram.root.dataset.ready).toBeUndefined()
    expect(diagram.controls.hidden).toBe(true)
    expect(diagram.toolbar.hidden).toBe(true)
    expect(diagram.root.listeners.size).toBe(0)
    expect(diagram.canvas.listeners.size).toBe(0)
    expect(ResizeObserverMock.instances).toHaveLength(0)
  }
)

test('reveals controls and toolbar, fits the initial view and observes the canvas', () => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()

  expect(diagram.root.dataset.ready).toBe('true')
  expect(diagram.controls.hidden).toBe(false)
  expect(diagram.toolbar.hidden).toBe(false)
  expect(diagram.root.querySelector('[data-diagram-picker]')).toBeNull()
  expect(diagram.root.querySelector('[data-diagram-action="all"]')).toBeNull()
  expect(diagram.root.querySelector('[data-view-note="all"]')).toBeNull()
  expect(diagram.svg.viewBox.baseVal).toEqual({ x: -40, y: -45, width: 380, height: 190 })
  expect(diagram.svg.getAttribute('viewBox')).toBe('-40 -45 380 190')
  expect(diagram.output.value).toBe('263 %')
  expect(diagram.views.map((view) => view.getAttribute('aria-pressed'))).toEqual(['true', 'false'])
  expect(diagram.notes.map((note) => note.hidden)).toEqual([false, true])
  expect(diagram.nodes.map((node) => node.dataset.dimmed)).toEqual(['false', 'false', 'true', 'true'])
  expect(diagram.status.textContent).toBe('Recorrido: Lectura.')
  expect(ResizeObserverMock.instances).toHaveLength(1)
  expect(ResizeObserverMock.instances[0].observe).toHaveBeenCalledWith(diagram.canvas)
})

test('does not duplicate listeners, observers or zoom effects on a second initialization', () => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  diagram.actions.in.dispatch('click')
  const viewport = { ...diagram.svg.viewBox.baseVal }
  initializeArchitectureDiagram()

  expect(diagram.svg.viewBox.baseVal).toEqual(viewport)
  expect(ResizeObserverMock.instances).toHaveLength(1)
  for (const element of [diagram.root, diagram.canvas, diagram.toolbar, diagram.document]) {
    for (const listeners of element.listeners.values()) {
      expect(listeners).toHaveLength(1)
    }
  }
  diagram.actions.in.dispatch('click')
  expect(diagram.svg.viewBox.baseVal.width).toBeCloseTo(viewport.width / 1.25)
})

test.each(['toolbar', 'in', 'out', 'fit', 'fullscreen'] as const)(
  'does not start canvas pointer listeners or pan when dragging %s',
  (target) => {
    const diagram = createDiagram()
    initializeArchitectureDiagram()
    const viewport = { ...diagram.svg.viewBox.baseVal }
    const element = target === 'toolbar' ? diagram.toolbar : diagram.actions[target]
    const canvasListeners = ['pointerdown', 'pointermove'].flatMap((eventName) => {
      const listeners = (diagram.canvas.listeners.get(eventName) ?? []).map((listener) => mock(listener))
      diagram.canvas.listeners.set(eventName, listeners)
      return listeners
    })

    expect(diagram.toolbar.parent).toBe(diagram.viewport)
    expect(diagram.canvas.parent).toBe(diagram.viewport)
    expect(diagram.canvas.querySelector('[data-diagram-toolbar]')).toBeNull()
    expect(canvasListeners).toHaveLength(2)
    element.dispatch('pointerdown', new PointerEventMock({ clientX: 200, clientY: 200 }))
    element.dispatch('pointermove', new PointerEventMock({ clientX: 224, clientY: 216 }))

    for (const listener of canvasListeners) {
      expect(listener).not.toHaveBeenCalled()
    }
    expect(element.setPointerCapture).not.toHaveBeenCalled()
    expect(diagram.root.dataset.dragged).toBeUndefined()
    expect(diagram.root.dataset.dragging).toBeUndefined()
    expect(diagram.svg.viewBox.baseVal).toEqual(viewport)
    diagram.canvas.dispatch('pointermove', new PointerEventMock({ clientX: 248, clientY: 232 }))
    expect(diagram.svg.viewBox.baseVal).toEqual(viewport)
    expect(diagram.root.dataset.dragging).toBeUndefined()
  }
)

test('zooms in and out around the viewport center and updates the percentage', () => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  const initial = { ...diagram.svg.viewBox.baseVal }
  diagram.actions.in.dispatch('click')
  const zoomed = diagram.svg.viewBox.baseVal

  expect(zoomed.width).toBe(304)
  expect(zoomed.height).toBe(152)
  expect(zoomed.x + zoomed.width / 2).toBe(initial.x + initial.width / 2)
  expect(zoomed.y + zoomed.height / 2).toBe(initial.y + initial.height / 2)
  expect(diagram.output.value).toBe('329 %')
  diagram.actions.out.dispatch('click')
  expect(diagram.svg.viewBox.baseVal).toEqual(initial)
  expect(diagram.output.value).toBe('263 %')
})

test.each([
  ['in', 180, true, false],
  ['out', 5000, false, true],
] as const)(
  'clamps repeated zoom %s and disables the corresponding control',
  (action, width, inDisabled, outDisabled) => {
    const diagram = createDiagram()
    initializeArchitectureDiagram()
    for (let count = 0; count < 20; count += 1) {
      diagram.actions[action].dispatch('click')
    }

    expect(diagram.svg.viewBox.baseVal.width).toBe(width)
    expect(diagram.actions.in.disabled).toBe(inDisabled)
    expect(diagram.actions.out.disabled).toBe(outDisabled)
  }
)

test('changes the active view, clears selection and fits its nodes', () => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  diagram.nodes[0].dispatch('click')
  diagram.views[1].dispatch('click')

  expect(diagram.views.map((view) => view.getAttribute('aria-pressed'))).toEqual(['false', 'true'])
  expect(diagram.notes.map((note) => note.hidden)).toEqual([true, false])
  expect(diagram.nodes.map((node) => node.dataset.dimmed)).toEqual(['true', 'false', 'false', 'true'])
  expect(diagram.connections.map((connection) => connection.dataset.dimmed)).toEqual(['true', 'false', 'true'])
  expect(diagram.nodes.every((node) => node.getAttribute('aria-pressed') === 'false')).toBe(true)
  expect(diagram.overview.hidden).toBe(false)
  expect(diagram.panels.every((panel) => panel.hidden)).toBe(true)
  expect(diagram.svg.viewBox.baseVal).toEqual({ x: 70, y: -40, width: 760, height: 380 })
  expect(diagram.status.textContent).toBe('Recorrido: Contenido.')
})

test('restores the active view bounds with fit after zooming in', () => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  diagram.views[1].dispatch('click')
  const viewport = { ...diagram.svg.viewBox.baseVal }
  diagram.actions.in.dispatch('click')

  expect(diagram.svg.viewBox.baseVal.width).toBeCloseTo(viewport.width / 1.25)
  diagram.actions.fit.dispatch('click')

  expect(diagram.svg.viewBox.baseVal).toEqual(viewport)
  expect(diagram.notes.map((note) => note.hidden)).toEqual([true, false])
  expect(diagram.views.map((view) => view.getAttribute('aria-pressed'))).toEqual(['false', 'true'])
})

test.each([0, 1])('fits the complete active view %s even when a node is selected', (viewIndex) => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  diagram.views[viewIndex].dispatch('click')
  const viewport = { ...diagram.svg.viewBox.baseVal }
  diagram.nodes[1].dispatch('click')
  diagram.actions.in.dispatch('click')
  diagram.canvas.dispatch('keydown', new DiagramEventMock({ key: 'ArrowRight' }))

  expect(diagram.svg.viewBox.baseVal).not.toEqual(viewport)
  diagram.actions.fit.dispatch('click')

  expectSelection(diagram, 'domain')
  expect(diagram.svg.viewBox.baseVal).toEqual(viewport)
  expect(diagram.views.map((view) => view.getAttribute('aria-pressed'))).toEqual(
    diagram.views.map((_, index) => String(index === viewIndex))
  )
})

test('ignores the removed all action without changing selection, view or viewport', () => {
  const diagram = createDiagram()
  const removedAction = new ButtonMock({ diagramAction: 'all' })
  diagram.toolbar.append(removedAction)
  initializeArchitectureDiagram()
  diagram.nodes[1].dispatch('click')
  const viewport = { ...diagram.svg.viewBox.baseVal }
  const status = diagram.status.textContent
  removedAction.dispatch('click')

  expectSelection(diagram, 'domain')
  expect(diagram.svg.viewBox.baseVal).toEqual(viewport)
  expect(diagram.views.map((view) => view.getAttribute('aria-pressed'))).toEqual(['true', 'false'])
  expect(diagram.notes.map((note) => note.hidden)).toEqual([false, true])
  expect(diagram.nodes.map((node) => node.dataset.dimmed)).toEqual(['false', 'false', 'false', 'true'])
  expect(diagram.status.textContent).toBe(status)
})

test('selects a clicked node while highlighting its neighbors', () => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  const viewport = { ...diagram.svg.viewBox.baseVal }
  diagram.nodes[1].dispatch('click')

  expectSelection(diagram, 'domain')
  expect(diagram.svg.viewBox.baseVal).toEqual(viewport)
  expect(diagram.nodes.map((node) => node.dataset.dimmed)).toEqual(['false', 'false', 'false', 'true'])
  expect(diagram.connections.map((connection) => connection.dataset.dimmed)).toEqual(['false', 'false', 'true'])
  expect(diagram.status.textContent).toBe('Dominio. Relaciones y código disponibles bajo el mapa.')
})

test('selects a clicked node through a nested target without recentering', () => {
  const diagram = createDiagram()
  const label = new ElementMock()
  diagram.nodes[1].append(label)
  initializeArchitectureDiagram()
  const viewport = { ...diagram.svg.viewBox.baseVal }
  label.dispatch('click')

  expectSelection(diagram, 'domain')
  expect(diagram.svg.viewBox.baseVal).toEqual(viewport)
})

test('selects and centers a related node outside the current view', () => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  diagram.nodes[1].dispatch('click')
  diagram.related.dispatch('click')

  expectSelection(diagram, 'output')
  expect(diagram.svg.viewBox.baseVal).toEqual({ x: 460, y: 155, width: 380, height: 190 })
})

test('moves focus from a related button in the hidden panel to the newly selected detail title', () => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  diagram.nodes[1].dispatch('click')
  diagram.related.focus()

  expect(diagram.panels[1].hidden).toBe(false)
  expect(diagram.related.parent).toBe(diagram.panels[1])
  expect(diagram.document.activeElement).toBe(diagram.related)
  diagram.related.dispatch('click')

  const title = diagram.panels[2].querySelector('[data-diagram-detail-title]')
  expect(title).not.toBeNull()
  expectSelection(diagram, 'output')
  expect(diagram.panels[1].hidden).toBe(true)
  expect(diagram.panels[2].hidden).toBe(false)
  expect(diagram.document.activeElement).toBe(title)
})

test('returns focus from the clear button in a hidden panel to the previously selected node', () => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  diagram.nodes[1].dispatch('click')
  diagram.actions.clear.focus()

  expect(diagram.panels[1].hidden).toBe(false)
  expect(diagram.actions.clear.parent).toBe(diagram.panels[1])
  expect(diagram.document.activeElement).toBe(diagram.actions.clear)
  diagram.actions.clear.dispatch('click')

  expect(diagram.panels.every((panel) => panel.hidden)).toBe(true)
  expect(diagram.overview.hidden).toBe(false)
  expect(diagram.nodes.every((node) => node.getAttribute('aria-pressed') === 'false')).toBe(true)
  expect(diagram.document.activeElement).toBe(diagram.nodes[1])
})

test('focuses the canvas when clearing without a selected node', () => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  diagram.actions.clear.remove()
  diagram.overview.append(diagram.actions.clear)
  diagram.actions.clear.focus()
  diagram.actions.clear.dispatch('click')

  expect(diagram.document.activeElement).toBe(diagram.canvas)
  expect(diagram.overview.hidden).toBe(false)
  expect(diagram.nodes.every((node) => node.getAttribute('aria-pressed') === 'false')).toBe(true)
  expect(diagram.panels.every((panel) => panel.hidden)).toBe(true)
})

test.each(['button', 'escape'])('clears selection through %s and restores active view highlights', (method) => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  diagram.nodes[1].dispatch('click')
  if (method === 'button') {
    diagram.actions.clear.dispatch('click')
  } else {
    diagram.nodes[1].dispatch('keydown', new DiagramEventMock({ key: 'Escape' }))
  }

  expect(diagram.overview.hidden).toBe(false)
  expect(diagram.nodes.every((node) => node.getAttribute('aria-pressed') === 'false')).toBe(true)
  expect(diagram.panels.every((panel) => panel.hidden)).toBe(true)
  expect(diagram.nodes.map((node) => node.dataset.dimmed)).toEqual(['false', 'false', 'true', 'true'])
  expect(diagram.connections.map((connection) => connection.dataset.dimmed)).toEqual(['false', 'true', 'true'])
})

test('leaves ordinary wheel scrolling untouched', () => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  const viewport = { ...diagram.svg.viewBox.baseVal }
  const event = diagram.canvas.dispatch('wheel', new DiagramEventMock({ deltaY: -100, clientX: 300, clientY: 350 }))

  expect(event.defaultPrevented).toBe(false)
  expect(diagram.svg.viewBox.baseVal).toEqual(viewport)
})

test.each(['ctrlKey', 'metaKey'] as const)('zooms around the cursor and prevents scrolling with %s', (modifier) => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  const viewport = { ...diagram.svg.viewBox.baseVal }
  const anchor = { x: viewport.x + viewport.width * 0.25, y: viewport.y + viewport.height * 0.75 }
  const event = diagram.canvas.dispatch(
    'wheel',
    new DiagramEventMock({ [modifier]: true, deltaY: -100, clientX: 300, clientY: 350 })
  )
  const zoomed = diagram.svg.viewBox.baseVal

  expect(event.defaultPrevented).toBe(true)
  expect(zoomed.width).toBeCloseTo(viewport.width / Math.exp(0.2))
  expect((anchor.x - zoomed.x) / zoomed.width).toBeCloseTo(0.25)
  expect((anchor.y - zoomed.y) / zoomed.height).toBeCloseTo(0.75)
})

test.each([
  ['ArrowLeft', -1, 0],
  ['ArrowRight', 1, 0],
  ['ArrowUp', 0, -1],
  ['ArrowDown', 0, 1],
] as const)('pans with %s when the canvas is focused', (key, horizontal, vertical) => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  const viewport = { ...diagram.svg.viewBox.baseVal }
  const event = diagram.canvas.dispatch('keydown', new DiagramEventMock({ key }))
  const result = diagram.svg.viewBox.baseVal

  expect(event.defaultPrevented).toBe(true)
  expect(result.x).toBeCloseTo(viewport.x + horizontal * viewport.width * 0.08)
  expect(result.y).toBeCloseTo(viewport.y + vertical * viewport.width * 0.08)
  expect(result.width).toBe(viewport.width)
  expect(result.height).toBe(viewport.height)
})

test('does not hijack arrow keys on a node or unrelated keys on the canvas', () => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  const viewport = { ...diagram.svg.viewBox.baseVal }
  const nodeEvent = diagram.nodes[0].dispatch('keydown', new DiagramEventMock({ key: 'ArrowRight' }))
  const canvasEvent = diagram.canvas.dispatch('keydown', new DiagramEventMock({ key: 'Tab' }))

  expect(nodeEvent.defaultPrevented).toBe(false)
  expect(canvasEvent.defaultPrevented).toBe(false)
  expect(diagram.svg.viewBox.baseVal).toEqual(viewport)
})

test.each(['pointerup', 'pointercancel', 'lostpointercapture'])(
  'suppresses the click after a drag ending in %s but permits the next pointer interaction',
  (endEvent) => {
    const diagram = createDiagram()
    initializeArchitectureDiagram()
    const viewport = { ...diagram.svg.viewBox.baseVal }
    const node = diagram.nodes[1]
    node.dispatch('pointerdown', new PointerEventMock({ pointerId: 1, clientX: 200, clientY: 200 }))
    node.dispatch('pointermove', new PointerEventMock({ pointerId: 1, clientX: 224, clientY: 216 }))

    expect(node.setPointerCapture).toHaveBeenCalledWith(1)
    expect(diagram.root.dataset.dragged).toBe('true')
    expect(diagram.root.dataset.dragging).toBe('true')
    expect(diagram.svg.viewBox.baseVal.x).toBeCloseTo(viewport.x - (24 * viewport.width) / 800)
    expect(diagram.svg.viewBox.baseVal.y).toBeCloseTo(viewport.y - (16 * viewport.height) / 400)
    expect(diagram.svg.viewBox.baseVal.width).toBe(viewport.width)
    node.dispatch(endEvent, new PointerEventMock({ pointerId: 1, clientX: 224, clientY: 216 }))
    node.dispatch('click')

    expect(diagram.root.dataset.dragging).toBe('false')
    expect(diagram.nodes.every((node) => node.getAttribute('aria-pressed') === 'false')).toBe(true)
    expect(diagram.overview.hidden).toBe(false)
    const panned = { ...diagram.svg.viewBox.baseVal }
    node.dispatch('pointerdown', new PointerEventMock({ pointerId: 2, clientX: 224, clientY: 216 }))
    node.dispatch('pointerup', new PointerEventMock({ pointerId: 2, clientX: 224, clientY: 216 }))
    node.dispatch('click')

    expect(diagram.root.dataset.dragged).toBe('false')
    expectSelection(diagram, 'domain')
    expect(diagram.svg.viewBox.baseVal).toEqual(panned)
  }
)

test.each(['Enter', ' '])('allows keyboard activation with %s after suppressing a drag click', (key) => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  const node = diagram.nodes[1]
  node.dispatch('pointerdown', new PointerEventMock({ clientX: 200, clientY: 200 }))
  node.dispatch('pointermove', new PointerEventMock({ clientX: 224, clientY: 216 }))
  node.dispatch('pointerup', new PointerEventMock({ clientX: 224, clientY: 216 }))
  node.dispatch('click')

  expect(diagram.root.dataset.dragged).toBe('true')
  expect(diagram.nodes.every((node) => node.getAttribute('aria-pressed') === 'false')).toBe(true)
  const viewport = { ...diagram.svg.viewBox.baseVal }
  node.dispatch('keydown', new DiagramEventMock({ key }))
  node.dispatch('keyup', new DiagramEventMock({ key }))
  node.dispatch('click', new DiagramEventMock({ detail: 0 }))

  expectSelection(diagram, 'domain')
  expect(diagram.svg.viewBox.baseVal).toEqual(viewport)
})

test('allows the next toolbar click after suppressing a drag click', () => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  diagram.canvas.dispatch('pointerdown', new PointerEventMock({ clientX: 200, clientY: 200 }))
  diagram.canvas.dispatch('pointermove', new PointerEventMock({ clientX: 224, clientY: 216 }))
  diagram.canvas.dispatch('pointerup', new PointerEventMock({ clientX: 224, clientY: 216 }))
  diagram.canvas.dispatch('click')
  const width = diagram.svg.viewBox.baseVal.width

  diagram.actions.in.dispatch('pointerdown', new PointerEventMock({ pointerId: 2 }))
  diagram.actions.in.dispatch('pointerup', new PointerEventMock({ pointerId: 2 }))
  diagram.actions.in.dispatch('click')

  expect(diagram.svg.viewBox.baseVal.width).toBeCloseTo(width / 1.25)
})

test('allows a click after a pointer movement below the drag threshold', () => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  const viewport = { ...diagram.svg.viewBox.baseVal }
  const node = diagram.nodes[0]
  node.dispatch('pointerdown', new PointerEventMock({ clientX: 200, clientY: 200 }))
  node.dispatch('pointermove', new PointerEventMock({ clientX: 202, clientY: 201 }))
  node.dispatch('pointerup', new PointerEventMock({ clientX: 202, clientY: 201 }))
  node.dispatch('click')

  expectSelection(diagram, 'entry')
  expect(diagram.svg.viewBox.baseVal).toEqual(viewport)
})

test('centers a focused offscreen node but leaves a visible node in place', () => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  const viewport = { ...diagram.svg.viewBox.baseVal }
  diagram.nodes[0].dispatch('focusin')
  expect(diagram.svg.viewBox.baseVal).toEqual(viewport)
  diagram.nodes[2].dispatch('focusin')

  expect(diagram.svg.viewBox.baseVal).toEqual({ x: 460, y: 155, width: 380, height: 190 })
  expect(diagram.nodes.every((node) => node.getAttribute('aria-pressed') === 'false')).toBe(true)
})

test('refits the viewport to a resized container while preserving its center', () => {
  const diagram = createDiagram()
  initializeArchitectureDiagram()
  diagram.svg.rect = { left: 100, top: 50, width: 400, height: 800 }
  ResizeObserverMock.instances[0].callback()

  expect(diagram.svg.viewBox.baseVal).toEqual({ x: -40, y: -330, width: 380, height: 760 })
})

test('hides fullscreen when the document does not support it', () => {
  const diagram = createDiagram()
  diagram.document.fullscreenEnabled = false
  initializeArchitectureDiagram()

  expect(diagram.actions.fullscreen.hidden).toBe(true)
})

test('requests fullscreen, reflects fullscreen changes and exits when already active', async () => {
  const diagram = createDiagram()
  const icon = diagram.actions.fullscreen.children[0]
  const text = diagram.actions.fullscreen.textContent
  initializeArchitectureDiagram()
  expect(diagram.actions.fullscreen.hidden).toBe(false)
  diagram.actions.fullscreen.dispatch('click')
  await Promise.resolve()
  expect(diagram.root.requestFullscreen).toHaveBeenCalledTimes(1)
  diagram.document.fullscreenElement = diagram.root
  diagram.document.dispatch('fullscreenchange')
  expect(diagram.actions.fullscreen.getAttribute('aria-label')).toBe('Salir de pantalla completa')
  expect(diagram.actions.fullscreen.getAttribute('title')).toBe('Salir de pantalla completa')
  expect(diagram.actions.fullscreen.textContent).toBe(text)
  expect(diagram.actions.fullscreen.children).toEqual([icon])
  diagram.actions.fullscreen.dispatch('click')
  await Promise.resolve()
  expect(diagram.document.exitFullscreen).toHaveBeenCalledTimes(1)
  diagram.document.fullscreenElement = null
  diagram.document.dispatch('fullscreenchange')
  expect(diagram.actions.fullscreen.getAttribute('aria-label')).toBe('Pantalla completa')
  expect(diagram.actions.fullscreen.getAttribute('title')).toBe('Pantalla completa')
  expect(diagram.actions.fullscreen.textContent).toBe(text)
  expect(diagram.actions.fullscreen.children).toEqual([icon])
})

test.each(['enter', 'exit'])('reports fullscreen %s failures without breaking zoom controls', async (operation) => {
  const diagram = createDiagram()
  const rejectFullscreen = mock(async (): Promise<void> => {
    throw new Error('Fullscreen denied')
  })
  if (operation === 'enter') {
    diagram.root.requestFullscreen = rejectFullscreen
  } else {
    diagram.document.fullscreenElement = diagram.root
    diagram.document.exitFullscreen = rejectFullscreen
  }
  initializeArchitectureDiagram()
  diagram.actions.fullscreen.dispatch('click')
  await Promise.resolve()

  expect(rejectFullscreen).toHaveBeenCalledTimes(1)
  expect(diagram.status.textContent).toBe(
    'No se pudo abrir la pantalla completa. Puedes seguir usando los controles de zoom.'
  )
  diagram.actions.in.dispatch('click')
  expect(diagram.svg.viewBox.baseVal.width).toBe(304)
})

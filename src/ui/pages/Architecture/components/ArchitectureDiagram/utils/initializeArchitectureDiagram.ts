import type { Point, Viewport } from '@/ui/pages/Architecture/components/ArchitectureDiagram/types'
import { fitViewport } from '@/ui/pages/Architecture/components/ArchitectureDiagram/utils/fitViewport'
import { panViewport } from '@/ui/pages/Architecture/components/ArchitectureDiagram/utils/panViewport'
import { zoomViewport } from '@/ui/pages/Architecture/components/ArchitectureDiagram/utils/zoomViewport'

export function initializeArchitectureDiagram(): void {
  const root = document.querySelector<HTMLElement>('[data-architecture-diagram]')
  const canvas = root?.querySelector<HTMLElement>('[data-diagram-canvas]')
  const svg = root?.querySelector<SVGSVGElement>('[data-diagram-svg]')
  const controls = root?.querySelector<HTMLElement>('[data-diagram-controls]')
  const toolbar = root?.querySelector<HTMLElement>('[data-diagram-toolbar]')
  const overview = root?.querySelector<HTMLElement>('[data-diagram-overview]')
  const output = root?.querySelector<HTMLOutputElement>('[data-diagram-zoom]')
  const status = root?.querySelector<HTMLElement>('[data-diagram-status]')

  if (
    !root ||
    !canvas ||
    !svg ||
    !controls ||
    !toolbar ||
    !overview ||
    !output ||
    !status ||
    root.dataset.ready === 'true'
  ) {
    return
  }

  const nodes = [...root.querySelectorAll<HTMLButtonElement>('[data-diagram-node]')]
  const views = [...root.querySelectorAll<HTMLButtonElement>('[data-diagram-view]')]
  const panels = [...root.querySelectorAll<HTMLElement>('[data-node-panel]')]
  const notes = [...root.querySelectorAll<HTMLElement>('[data-view-note]')]
  const connections = [...root.querySelectorAll<SVGGElement>('[data-connection-from]')]
  const pointers = new Map<number, { start: Point; current: Point }>()
  const fullWidth = Number(svg.dataset.diagramWidth)
  const limits = { min_width: 180, max_width: fullWidth * 5 }

  const readViewport = (): Viewport => {
    const box = svg.viewBox.baseVal
    return { x: box.x, y: box.y, width: box.width, height: box.height }
  }

  const writeViewport = (viewport: Viewport): void => {
    svg.setAttribute('viewBox', `${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`)
    output.value = `${Math.round((fullWidth / viewport.width) * 100)} %`
    const zoomIn = root.querySelector<HTMLButtonElement>('[data-diagram-action="in"]')
    const zoomOut = root.querySelector<HTMLButtonElement>('[data-diagram-action="out"]')

    if (zoomIn && zoomOut) {
      zoomIn.disabled = viewport.width <= limits.min_width
      zoomOut.disabled = viewport.width >= limits.max_width
    }
  }

  const nodeBounds = (node: HTMLButtonElement): Viewport => {
    const [x, y, width, height] = (node.dataset.nodeBounds ?? '').split(' ').map(Number)
    return { x, y, width, height }
  }

  const fitNodes = (targets: readonly HTMLButtonElement[], readableStart = false): void => {
    if (targets.length === 0) {
      return
    }

    const boxes = targets.map(nodeBounds)
    const left = Math.min(...boxes.map((box) => box.x)) - 40
    const top = Math.min(...boxes.map((box) => box.y)) - 40
    const right = Math.max(...boxes.map((box) => box.x + box.width)) + 40
    const bottom = Math.max(...boxes.map((box) => box.y + box.height)) + 40
    const width = readableStart ? Math.min(right - left, 360) : right - left
    const height = readableStart ? Math.min(bottom - top, 480) : bottom - top
    writeViewport(fitViewport({ x: left, y: top, width, height }, svg.getBoundingClientRect()))
  }

  const highlight = (ids: readonly string[]): void => {
    const selected = new Set(ids)

    for (const node of nodes) {
      node.dataset.dimmed = String(!selected.has(node.dataset.diagramNode ?? ''))
    }

    for (const connection of connections) {
      connection.dataset.dimmed = String(
        !selected.has(connection.dataset.connectionFrom ?? '') || !selected.has(connection.dataset.connectionTo ?? '')
      )
    }
  }

  const clearSelection = (): void => {
    for (const node of nodes) {
      node.setAttribute('aria-pressed', 'false')
    }

    for (const panel of panels) {
      panel.hidden = true
    }

    overview.hidden = false
    const view = views.find((entry) => entry.getAttribute('aria-pressed') === 'true')
    highlight(view?.dataset.focusNodes?.split(' ') ?? nodes.map((node) => node.dataset.diagramNode ?? ''))
  }

  const centerNode = (node: HTMLButtonElement, onlyWhenOutside = false): void => {
    const box = nodeBounds(node)
    const viewport = readViewport()
    const isVisible =
      box.x >= viewport.x &&
      box.y >= viewport.y &&
      box.x + box.width <= viewport.x + viewport.width &&
      box.y + box.height <= viewport.y + viewport.height

    if (onlyWhenOutside && isVisible) {
      return
    }

    writeViewport({
      ...viewport,
      x: box.x + box.width / 2 - viewport.width / 2,
      y: box.y + box.height / 2 - viewport.height / 2,
    })
  }

  const selectNode = (id: string, center: boolean): void => {
    const node = nodes.find((entry) => entry.dataset.diagramNode === id)

    if (!node) {
      return
    }

    clearSelection()
    const related = connections
      .filter((entry) => entry.dataset.connectionFrom === id || entry.dataset.connectionTo === id)
      .flatMap((entry) => [entry.dataset.connectionFrom ?? '', entry.dataset.connectionTo ?? ''])
    highlight([id, ...related])
    node.setAttribute('aria-pressed', 'true')

    overview.hidden = true

    for (const panel of panels) {
      panel.hidden = panel.dataset.nodePanel !== id
    }

    if (center) {
      centerNode(node)
    }

    status.textContent = `${node.textContent?.trim()}. Relaciones y código disponibles bajo el mapa.`
  }

  const setView = (view: HTMLButtonElement, readableStart = false): void => {
    const ids = view.dataset.focusNodes?.split(' ') ?? []

    for (const button of views) {
      button.setAttribute('aria-pressed', String(button === view))
    }

    for (const note of notes) {
      note.hidden = note.dataset.viewNote !== view.dataset.diagramView
    }

    clearSelection()
    highlight(ids)
    fitNodes(
      nodes.filter((node) => ids.includes(node.dataset.diagramNode ?? '')),
      readableStart
    )
    status.textContent = `Recorrido: ${view.textContent?.trim()}.`
  }

  const toWorld = (point: Point): Point => {
    const rect = svg.getBoundingClientRect()
    const viewport = readViewport()
    return {
      x: viewport.x + ((point.x - rect.left) / rect.width) * viewport.width,
      y: viewport.y + ((point.y - rect.top) / rect.height) * viewport.height,
    }
  }

  const zoom = (factor: number, anchor?: Point): void => {
    const viewport = readViewport()
    const point = anchor ?? { x: viewport.x + viewport.width / 2, y: viewport.y + viewport.height / 2 }
    writeViewport(zoomViewport(viewport, factor, point, limits))
  }

  const toggleFullscreen = async (): Promise<void> => {
    try {
      if (document.fullscreenElement === root) {
        await document.exitFullscreen()
      } else {
        await root.requestFullscreen()
      }
    } catch {
      status.textContent = 'No se pudo abrir la pantalla completa. Puedes seguir usando los controles de zoom.'
    }
  }

  root.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button') : null

    if (!target) {
      return
    }

    if (target.dataset.diagramView) {
      setView(target)
      return
    }

    const nodeId = target.dataset.diagramNode ?? target.dataset.nodeTarget

    if (nodeId) {
      if (target.dataset.diagramNode && root.dataset.dragged === 'true' && event.detail !== 0) {
        return
      }
      selectNode(nodeId, Boolean(target.dataset.nodeTarget))
      if (target.dataset.nodeTarget) {
        const panel = panels.find((entry) => entry.dataset.nodePanel === nodeId)
        panel?.querySelector<HTMLElement>('[data-diagram-detail-title]')?.focus()
      }
      return
    }

    switch (target.dataset.diagramAction) {
      case 'in':
        zoom(1.25)
        break
      case 'out':
        zoom(0.8)
        break
      case 'fit': {
        const view = views.find((entry) => entry.getAttribute('aria-pressed') === 'true')
        const ids = view?.dataset.focusNodes?.split(' ') ?? []
        const targets = view ? nodes.filter((node) => ids.includes(node.dataset.diagramNode ?? '')) : nodes
        fitNodes(targets)
        break
      }
      case 'clear': {
        const selected = nodes.find((node) => node.getAttribute('aria-pressed') === 'true')
        clearSelection()
        const focusTarget = selected ?? canvas
        focusTarget.focus()
        break
      }
      case 'fullscreen':
        void toggleFullscreen()
        break
    }
  })

  canvas.addEventListener('focusin', (event) => {
    if (event.target instanceof HTMLButtonElement && event.target.dataset.diagramNode) {
      centerNode(event.target, true)
    }
  })

  canvas.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      clearSelection()
      return
    }

    if (event.target !== canvas) {
      return
    }

    const viewport = readViewport()
    const step = viewport.width * 0.08
    const moves: Record<string, Point> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    }
    const move = moves[event.key]

    if (move) {
      event.preventDefault()
      writeViewport(panViewport(viewport, move))
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault()
      zoom(1.25)
    } else if (event.key === '-') {
      event.preventDefault()
      zoom(0.8)
    } else if (event.key === '0') {
      event.preventDefault()
      const view = views.find((entry) => entry.getAttribute('aria-pressed') === 'true')
      if (view) {
        setView(view)
      } else {
        fitNodes(nodes)
      }
    }
  })

  canvas.addEventListener(
    'wheel',
    (event) => {
      if (!event.ctrlKey && !event.metaKey) {
        return
      }

      event.preventDefault()
      zoom(Math.exp(-event.deltaY * 0.002), toWorld({ x: event.clientX, y: event.clientY }))
    },
    { passive: false }
  )

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) {
      return
    }

    if (pointers.size === 0) {
      root.dataset.dragged = 'false'
    }

    const point = { x: event.clientX, y: event.clientY }
    pointers.set(event.pointerId, { start: point, current: point })

    if (event.target instanceof Element) {
      event.target.setPointerCapture(event.pointerId)
    }
  })

  canvas.addEventListener('pointermove', (event) => {
    const previous = pointers.get(event.pointerId)

    if (!previous) {
      return
    }

    const before = [...pointers.values()].map((pointer) => pointer.current)
    const current = { x: event.clientX, y: event.clientY }
    pointers.set(event.pointerId, { start: previous.start, current })
    const after = [...pointers.values()].map((pointer) => pointer.current)
    const viewport = readViewport()
    const rect = svg.getBoundingClientRect()

    if (Math.hypot(current.x - previous.start.x, current.y - previous.start.y) > 4) {
      root.dataset.dragged = 'true'
      root.dataset.dragging = 'true'
    }

    if (before.length === 2) {
      const beforeCenter = { x: (before[0].x + before[1].x) / 2, y: (before[0].y + before[1].y) / 2 }
      const afterCenter = { x: (after[0].x + after[1].x) / 2, y: (after[0].y + after[1].y) / 2 }
      const beforeDistance = Math.hypot(before[1].x - before[0].x, before[1].y - before[0].y)
      const afterDistance = Math.hypot(after[1].x - after[0].x, after[1].y - after[0].y)
      const factor = beforeDistance > 0 ? afterDistance / beforeDistance : 1
      const zoomed = zoomViewport(viewport, factor, toWorld(beforeCenter), limits)
      writeViewport(
        panViewport(zoomed, {
          x: ((beforeCenter.x - afterCenter.x) * zoomed.width) / rect.width,
          y: ((beforeCenter.y - afterCenter.y) * zoomed.height) / rect.height,
        })
      )
    } else if (before.length === 1 && root.dataset.dragged === 'true') {
      writeViewport(
        panViewport(viewport, {
          x: ((previous.current.x - current.x) * viewport.width) / rect.width,
          y: ((previous.current.y - current.y) * viewport.height) / rect.height,
        })
      )
    }
  })

  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(eventName, (event) => {
      if (event instanceof PointerEvent) {
        pointers.delete(event.pointerId)
      }
      root.dataset.dragging = 'false'
    })
  }

  const fullscreenButton = root.querySelector<HTMLButtonElement>('[data-diagram-action="fullscreen"]')
  if (fullscreenButton) {
    fullscreenButton.hidden = !document.fullscreenEnabled
    document.addEventListener('fullscreenchange', () => {
      const label = document.fullscreenElement === root ? 'Salir de pantalla completa' : 'Pantalla completa'
      fullscreenButton.setAttribute('aria-label', label)
      fullscreenButton.setAttribute('title', label)
    })
  }

  root.dataset.ready = 'true'
  controls.hidden = false
  toolbar.hidden = false
  const initialView = views[0]

  if (initialView) {
    setView(initialView, svg.getBoundingClientRect().width < 600)
  }

  const observer = new ResizeObserver(() => {
    writeViewport(fitViewport(readViewport(), svg.getBoundingClientRect()))
  })
  observer.observe(canvas)
}

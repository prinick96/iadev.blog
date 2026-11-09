import { COLS, ROWS, SIZE } from '@/ui/assets/posts/el-juego-de-la-vida/engine/constants'
import { createPattern } from '@/ui/assets/posts/el-juego-de-la-vida/engine/createPattern'
import { emptyGrid } from '@/ui/assets/posts/el-juego-de-la-vida/engine/emptyGrid'
import { nextGeneration } from '@/ui/assets/posts/el-juego-de-la-vida/engine/nextGeneration'
import { randomGrid } from '@/ui/assets/posts/el-juego-de-la-vida/engine/randomGrid'
import { toggleCell } from '@/ui/assets/posts/el-juego-de-la-vida/engine/toggleCell'
import type { Grid, PatternName } from '@/ui/assets/posts/el-juego-de-la-vida/engine/types'

class LifeBoardElement extends HTMLElement {
  readonly #templateId: string
  #grid: Grid
  #initialGrid: Grid
  #generation = 0
  #running = false
  #lastTime = 0
  #frameId: number | null = null
  #cursorX = Math.floor(COLS / 2)
  #cursorY = Math.floor(ROWS / 2)
  #canvas: HTMLCanvasElement | null = null
  #context: CanvasRenderingContext2D | null = null
  #listeners: AbortController | null = null
  #visibility: IntersectionObserver | null = null

  constructor(templateId: string, pattern?: PatternName) {
    super()
    this.#templateId = templateId
    this.#grid = pattern ? createPattern(pattern) : emptyGrid()
    this.#initialGrid = this.#grid
  }

  connectedCallback(): void {
    const template = document.getElementById(this.#templateId)

    if (!(template instanceof HTMLTemplateElement)) {
      return
    }

    const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' })
    root.replaceChildren(template.content.cloneNode(true))
    this.#canvas = root.querySelector<HTMLCanvasElement>('[data-world]')
    this.#context = this.#canvas?.getContext('2d') ?? null

    if (!this.#canvas || !this.#context) {
      const status = root.querySelector('[data-status]')
      if (status) {
        status.textContent = 'No se pudo crear el contexto 2D. Prueba con un navegador compatible con Canvas.'
      }

      root
        .querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>('button, input, select')
        .forEach((control) => {
          control.disabled = true
        })
      return
    }

    this.#listeners = new AbortController()
    const options = { signal: this.#listeners.signal }
    root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
      button.addEventListener('click', () => this.handleAction(button.dataset.action), options)
    })
    const speed = root.querySelector<HTMLInputElement>('[data-speed]')
    speed?.addEventListener(
      'input',
      () => {
        const output = root.querySelector('[data-speed-value]')
        if (output) {
          output.textContent = speed.value
        }
      },
      options
    )

    if (this.#canvas.hasAttribute('tabindex')) {
      this.#canvas.addEventListener('click', (event) => this.handlePointer(event), options)
      this.#canvas.addEventListener('keydown', (event) => this.handleKey(event), options)
      this.#canvas.addEventListener('focus', () => this.render(), options)
      this.#canvas.addEventListener('blur', () => this.render(), options)
    }

    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) {
          this.pause()
        }
      },
      options
    )

    this.#visibility = new IntersectionObserver((entries) => {
      if (entries.some((entry) => !entry.isIntersecting)) {
        this.pause()
      }
    })
    this.#visibility.observe(this)
    this.render()
  }

  disconnectedCallback(): void {
    this.pause()
    this.#listeners?.abort()
    this.#visibility?.disconnect()
  }

  private handleAction(action: string | undefined): void {
    switch (action) {
      case 'load': {
        const pattern = this.shadowRoot?.querySelector<HTMLSelectElement>('[data-pattern]')?.value
        if (pattern === 'block' || pattern === 'blinker' || pattern === 'glider') {
          this.replaceGrid(createPattern(pattern))
        }
        break
      }
      case 'clear':
        this.replaceGrid(emptyGrid())
        break
      case 'step':
        this.pause()
        this.advance()
        break
      case 'reset':
        this.replaceGrid(this.#initialGrid)
        break
      case 'random': {
        const density = this.shadowRoot?.querySelector<HTMLSelectElement>('[data-density]')?.value
        this.replaceGrid(randomGrid(Number(density)))
        break
      }
      case 'toggle':
        if (this.#running) {
          this.pause()
        } else {
          this.start()
        }
        break
    }
  }

  private replaceGrid(grid: Grid): void {
    this.pause()
    this.#grid = grid
    this.#initialGrid = grid
    this.#generation = 0
    this.render()
  }

  private advance(): void {
    this.#grid = nextGeneration(this.#grid)
    this.#generation += 1
    this.render()
  }

  private start(): void {
    if (this.#running || document.hidden) {
      return
    }
    this.#running = true
    this.#lastTime = performance.now()
    this.render()
    this.#frameId = requestAnimationFrame((time) => this.tick(time))
  }

  private pause(): void {
    this.#running = false
    if (this.#frameId !== null) {
      cancelAnimationFrame(this.#frameId)
      this.#frameId = null
    }

    this.render()
  }

  private tick(time: number): void {
    if (!this.#running) {
      return
    }

    const speed = this.shadowRoot?.querySelector<HTMLInputElement>('[data-speed]')
    const interval = 1000 / Number(speed?.value ?? 6)
    if (time - this.#lastTime >= interval) {
      this.advance()
      this.#lastTime = time
    }
    this.#frameId = requestAnimationFrame((nextTime) => this.tick(nextTime))
  }

  private handlePointer(event: MouseEvent): void {
    const canvas = this.#canvas
    if (this.#running || !canvas) {
      return
    }

    const rect = canvas.getBoundingClientRect()
    const scaleX = rect.width / canvas.offsetWidth
    const scaleY = rect.height / canvas.offsetHeight
    const width = canvas.clientWidth * scaleX
    const height = canvas.clientHeight * scaleY

    if (width <= 0 || height <= 0) {
      return
    }

    const x = Math.floor(((event.clientX - rect.left - canvas.clientLeft * scaleX) / width) * COLS)
    const y = Math.floor(((event.clientY - rect.top - canvas.clientTop * scaleY) / height) * ROWS)

    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
      return
    }

    this.#cursorX = x
    this.#cursorY = y
    canvas.focus({ preventScroll: true })
    this.replaceGrid(toggleCell(this.#grid, x, y))
  }

  private handleKey(event: KeyboardEvent): void {
    if (this.#running) {
      return
    }
    switch (event.key) {
      case 'ArrowLeft':
        this.#cursorX = Math.max(0, this.#cursorX - 1)
        break
      case 'ArrowRight':
        this.#cursorX = Math.min(COLS - 1, this.#cursorX + 1)
        break
      case 'ArrowUp':
        this.#cursorY = Math.max(0, this.#cursorY - 1)
        break
      case 'ArrowDown':
        this.#cursorY = Math.min(ROWS - 1, this.#cursorY + 1)
        break
      case ' ':
      case 'Enter':
        this.replaceGrid(toggleCell(this.#grid, this.#cursorX, this.#cursorY))
        break
      default:
        return
    }
    event.preventDefault()
    this.render()
  }

  private render(): void {
    const canvas = this.#canvas
    const context = this.#context
    const root = this.shadowRoot

    if (!canvas || !context || !root) {
      return
    }

    const colors = getComputedStyle(this)
    const background = colors.getPropertyValue('--color-background').trim()
    const border = colors.getPropertyValue('--color-border').trim()
    const accent = colors.getPropertyValue('--color-accent').trim()
    context.fillStyle = border
    context.fillRect(0, 0, canvas.width, canvas.height)

    this.#grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        context.fillStyle = cell === 1 ? accent : background
        context.fillRect(x * SIZE, y * SIZE, SIZE - 1, SIZE - 1)
      })
    })

    if (root.activeElement === canvas) {
      context.strokeStyle = colors.getPropertyValue('--color-text').trim()
      context.lineWidth = 2
      context.strokeRect(this.#cursorX * SIZE + 1, this.#cursorY * SIZE + 1, SIZE - 3, SIZE - 3)
    }

    const population = this.#grid.reduce((sum, row) => sum + row.reduce<number>((count, cell) => count + cell, 0), 0)
    const status = root.querySelector('[data-status]')
    if (status) {
      status.setAttribute('aria-live', this.#running ? 'off' : 'polite')
      status.textContent = `Generación: ${this.#generation} · Células vivas: ${population}`
    }

    const toggle = root.querySelector<HTMLButtonElement>('[data-toggle]')
    if (toggle) {
      toggle.textContent = this.#running ? 'Pausar' : 'Iniciar'
      toggle.setAttribute('aria-pressed', String(this.#running))
    }

    if (canvas.hasAttribute('tabindex')) {
      const cell = this.#grid[this.#cursorY][this.#cursorX] === 1 ? 'viva' : 'muerta'
      canvas.setAttribute(
        'aria-label',
        `Tablero de ${COLS} columnas y ${ROWS} filas. Fila ${this.#cursorY + 1}, columna ${this.#cursorX + 1}: ${cell}.`
      )
    }
  }
}

export default LifeBoardElement

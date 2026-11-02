import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { HastNode } from 'satteri'
import { defineHastPlugin, htmlToHast } from 'satteri'
import { logger, parse, View, Warn } from 'vega'
import type { TopLevelSpec } from 'vega-lite'
import { compile } from 'vega-lite'
import schema from 'vega-lite/vega-lite-schema.json'

const validator = addFormats(
  new Ajv({
    strict: false,
    allErrors: true,
    formats: { 'color-hex': /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i },
  })
)
const validateSpec = validator.compile<TopLevelSpec>(schema)

function failChart(...messages: unknown[]): never {
  throw new Error(messages.map(String).join(' '))
}

const chartLogger = { ...logger(Warn), warn: failChart, error: failChart }

async function denyResource(uri: string): Promise<never> {
  throw new Error(`External chart resources are disabled: ${uri}. Use inline data.values or datasets.`)
}

function assertInlineResources(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(assertInlineResources)
    return
  }

  if (typeof value !== 'object' || value === null) {
    return
  }

  Object.entries(value).forEach(([key, entry]) => {
    if (key === 'url' || key === 'href') {
      throw new Error(
        `Chart resource "${key}" is disabled. Use inline data.values or datasets, without images or links.`
      )
    }

    // Literal rows, signal values and metadata can contain URL fields without loading resources.
    if (key !== 'values' && key !== 'value' && key !== 'usermeta') {
      assertInlineResources(entry)
    }
  })
}

function assertSvgResources(node: HastNode): void {
  if (node.type === 'element') {
    Object.entries(node.properties).forEach(([name, value]) => {
      if (typeof value !== 'string') {
        return
      }

      if ((name === 'href' || name === 'xLinkHref') && !value.startsWith('#')) {
        throw new Error('External SVG links and images are disabled.')
      }

      if (['fill', 'stroke', 'filter', 'clipPath', 'mask', 'cursor', 'style'].includes(name)) {
        const withoutLocalReferences = value.replace(/url\(\s*(?:"#[-\w:.]+"|'#[-\w:.]+'|#[-\w:.]+)\s*\)/gi, '')

        // CSS escapes and unterminated url() tokens must not bypass resource checks.
        if (value.includes('\\') || /\burl\s*\(/i.test(withoutLocalReferences)) {
          throw new Error('External SVG paint resources are disabled. Use a color or a local gradient.')
        }
      }
    })
  }

  if ('children' in node) {
    node.children.forEach(assertSvgResources)
  }
}

function parseSpec(source: string): TopLevelSpec & { description: string } {
  const specification: unknown = JSON.parse(source)

  if (!validateSpec(specification)) {
    const errors = validateSpec.errors?.filter((error) => error.keyword !== 'anyOf').slice(0, 5)
    throw new Error(`Invalid Vega-Lite specification: ${validator.errorsText(errors, { dataVar: 'spec' })}`)
  }

  const description = specification.description

  if (typeof description !== 'string' || !description.trim()) {
    throw new Error('A nonempty top-level description is required as accessible text for the chart.')
  }

  return { ...specification, description }
}

async function renderChart(specification: TopLevelSpec): Promise<string> {
  const { spec } = compile(specification, {
    logger: chartLogger,
    config: {
      background: 'transparent',
      font: 'monospace',
      view: { stroke: null, continuousWidth: 400, continuousHeight: 300 },
      mark: { color: 'var(--color-accent)' },
      text: { color: 'currentColor' },
      axis: {
        labelColor: 'currentColor',
        titleColor: 'currentColor',
        domainColor: 'currentColor',
        tickColor: 'currentColor',
        gridColor: 'var(--color-border)',
        labelFontSize: 12,
        titleFontSize: 14,
      },
      legend: { labelColor: 'currentColor', titleColor: 'currentColor' },
      title: { color: 'currentColor' },
    },
  })

  assertInlineResources(spec)

  const view = new View(parse(spec), {
    renderer: 'none',
    logger: chartLogger,
    loader: { load: denyResource, sanitize: denyResource, http: denyResource, file: denyResource },
  })

  try {
    const svg = await view.toSVG()
    assertSvgResources(htmlToHast(svg, { fragment: true }))

    return svg
  } finally {
    view.finalize()
  }
}

export function renderVegaLiteCharts() {
  return defineHastPlugin({
    name: 'render-vega-lite-charts',
    options: { position: true },
    element: {
      filter: ['pre'],
      async visit(node, context) {
        const code = node.children.find((child) => child.type === 'element' && child.tagName === 'code')

        if (code?.type !== 'element') {
          return
        }

        const classes = code.properties.className
        const classNames = Array.isArray(classes) ? classes.map(String) : String(classes ?? '').split(/\s+/)

        if (!classNames.includes('language-vega-lite')) {
          return
        }

        try {
          const specification = parseSpec(context.textContent(code))
          const svg = await renderChart(specification)

          context.replaceNode(node, {
            type: 'element',
            tagName: 'figure',
            properties: {
              className: ['markdown-content__chart'],
              role: 'img',
              ariaLabel: specification.description,
              tabIndex: 0,
            },
            children: [{ type: 'raw', value: svg }],
          })
        } catch (error) {
          const location = `${context.fileURL?.href ?? 'Markdown'}:${node.position?.start.line ?? 1}`
          const message = error instanceof Error ? error.message : String(error)
          throw new Error(`Invalid vega-lite chart at ${location}: ${message}`, { cause: error })
        }
      },
    },
  })
}

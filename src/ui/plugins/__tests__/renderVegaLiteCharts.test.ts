import { describe, expect, test } from 'bun:test'
import type { HastNode } from 'satteri'
import { htmlToHast, markdownToHtml } from 'satteri'
import { renderVegaLiteCharts } from '@/ui/plugins/renderVegaLiteCharts'

const fence = (specification: unknown, language = 'vega-lite') =>
  `\`\`\`${language}\n${JSON.stringify(specification)}\n\`\`\``

const renderMarkdown = async (markdown: string, fileURL?: URL) => {
  const { html } = await markdownToHtml(markdown, { fileURL, hastPlugins: [renderVegaLiteCharts()] })
  return html
}

const getElements = (node: HastNode): Extract<HastNode, { type: 'element' }>[] => {
  const children = 'children' in node ? node.children.flatMap(getElements) : []
  return node.type === 'element' ? [node, ...children] : children
}

describe('renderVegaLiteCharts', () => {
  const barChart = {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    description: 'Values by category',
    data: {
      values: [
        { category: 'Alpha', value: 2 },
        { category: 'Beta', value: 4 },
      ],
    },
    mark: 'bar',
    encoding: {
      x: { field: 'category', type: 'nominal' },
      y: { field: 'value', type: 'quantitative' },
    },
  }

  test('renders inline data as actual SVG bars in an accessible, keyboard-focusable figure', async () => {
    const html = await renderMarkdown(fence(barChart))
    const figure = html.match(/<figure\b[^>]*>/)?.[0] ?? ''
    const bars = html.match(/<path\b[^>]*aria-roledescription="bar"[^>]*>/g) ?? []

    expect(figure).toContain('class="markdown-content__chart"')
    expect(figure).toContain('role="img"')
    expect(figure).toContain('aria-label="Values by category"')
    expect(figure).toContain('tabindex="0"')
    expect(html).toMatch(/<svg\b/)
    expect(bars).toHaveLength(2)
    for (const bar of bars) {
      expect(bar).toMatch(/\bd="[^"]+"/)
    }
    expect(html).not.toMatch(/<(?:script|iframe|canvas)\b/i)
    expect(html).not.toContain('<pre>')
    expect(html).not.toContain('language-vega-lite')
  })

  test('renders a line with nonempty SVG geometry', async () => {
    const html = await renderMarkdown(fence({ ...barChart, mark: 'line' }))
    const line = html.match(/<path\b[^>]*aria-roledescription="line mark"[^>]*>/)?.[0] ?? ''

    expect(line).toMatch(/\bd="M[^"\n]+L[^"\n]+"/)
    expect(html).not.toMatch(/<script\b/i)
  })

  test('renders layered scatter points and their text labels', async () => {
    const html = await renderMarkdown(
      fence({
        description: 'Labeled scatter plot',
        data: {
          values: [
            { x: 1, y: 2, label: 'First observation' },
            { x: 3, y: 4, label: 'Second observation' },
          ],
        },
        encoding: {
          x: { field: 'x', type: 'quantitative' },
          y: { field: 'y', type: 'quantitative' },
        },
        layer: [
          { mark: 'point' },
          { mark: { type: 'text', dy: -10 }, encoding: { text: { field: 'label', type: 'nominal' } } },
        ],
      })
    )
    const points = html.match(/<path\b[^>]*aria-roledescription="point"[^>]*>/g) ?? []

    expect(points).toHaveLength(2)
    for (const point of points) {
      expect(point).toMatch(/\bd="[^"]+"/)
    }
    expect(html).toMatch(/<text\b[^>]*>First observation<\/text>/)
    expect(html).toMatch(/<text\b[^>]*>Second observation<\/text>/)
  })

  test('escapes descriptions and data labels without creating executable HTML', async () => {
    const description = 'Revenue "A&B" <expenses> <script>alert(1)</script>'
    const html = await renderMarkdown(
      fence({
        ...barChart,
        description,
        mark: 'text',
        data: { values: [{ category: '<script>alert(2)</script>', value: 2 }] },
        encoding: { ...barChart.encoding, text: { field: 'category', type: 'nominal' } },
      })
    )
    const elements = getElements(htmlToHast(html))
    const figure = elements.find((element) => element.tagName === 'figure')

    expect(figure?.properties.ariaLabel).toBe(description)
    expect(elements.some((element) => element.tagName === 'script' || element.tagName === 'expenses')).toBe(false)
    expect(html).toContain('&lt;script&gt;alert(2)&lt;/script&gt;')
  })

  test('does not let description quotes inject attributes into the figure', async () => {
    const description = 'Chart" onfocus="alert(1)" tabindex="-1'
    const html = await renderMarkdown(fence({ ...barChart, description }))
    const figure = getElements(htmlToHast(html)).find((element) => element.tagName === 'figure')

    expect(figure?.properties.ariaLabel).toBe(description)
    expect(figure?.properties.tabIndex).toBe(0)
    expect(figure?.properties).not.toHaveProperty('onFocus')
    expect(figure?.properties).not.toHaveProperty('onfocus')
  })

  test('preserves neighboring Markdown and renders multiple chart blocks in source order', async () => {
    const markdown = [
      '# Before charts',
      '',
      fence(barChart),
      '',
      'Between **both** charts.',
      '',
      fence({ ...barChart, description: 'Second chart', mark: 'line' }),
      '',
      'After [the charts](/posts/example/).',
    ].join('\n')
    const html = await renderMarkdown(markdown)

    expect(html.match(/<figure\b/g)).toHaveLength(2)
    expect(html.match(/<svg\b/g)).toHaveLength(2)
    expect(html).toMatch(/<h1\b[^>]*>Before charts<\/h1>/)
    expect(html).toContain('<p>Between <strong>both</strong> charts.</p>')
    expect(html).toContain('<a href="/posts/example/">the charts</a>')
    expect(html.indexOf('Before charts')).toBeLessThan(html.indexOf('<figure'))
    expect(html.indexOf('</figure>')).toBeLessThan(html.indexOf('Between <strong>'))
    expect(html.indexOf('Between <strong>')).toBeLessThan(html.indexOf('aria-label="Second chart"'))
    expect(html.lastIndexOf('</figure>')).toBeLessThan(html.indexOf('After <a'))
  })

  test.each(['json', 'javascript', 'vega', 'vega-lite-extra', 'VEGA-LITE', ''])(
    'leaves non-chart fences unchanged for language "%s"',
    async (language) => {
      const markdown = fence({ ...barChart, description: undefined }, language)
      const { html: original } = markdownToHtml(markdown)

      expect(await renderMarkdown(markdown)).toBe(original)
    }
  )

  test('leaves inline code and ordinary Markdown untouched', async () => {
    const markdown = 'Inline `vega-lite` and `{"mark":"bar"}`.\n\nA regular paragraph.'
    const { html: original } = markdownToHtml(markdown)

    expect(await renderMarkdown(markdown)).toBe(original)
  })

  test.each([
    ['malformed JSON', '{"description": "Broken", "mark":'],
    ['trailing commas', '{"description": "Broken", "mark": "bar",}'],
    ['JavaScript comments', '{"description": "Broken", /* comment */ "mark": "bar"}'],
    ['an empty block', ''],
  ])('rejects %s instead of treating it as JavaScript', (_name, source) => {
    expect(renderMarkdown(`\`\`\`vega-lite\n${source}\n\`\`\``)).rejects.toThrow(/vega-lite/i)
  })

  test.each([
    ['a missing description', undefined],
    ['an empty description', ''],
    ['a whitespace-only description', ' \n\t '],
    ['a non-string description', 123],
  ])('requires accessible text for %s', (_name, description) => {
    expect(renderMarkdown(fence({ ...barChart, description }))).rejects.toThrow(/vega-lite/i)
  })

  test('does not substitute a nested layer description for the required top-level description', () => {
    expect(
      renderMarkdown(
        fence({
          data: barChart.data,
          layer: [
            { mark: barChart.mark, encoding: barChart.encoding, description: 'Only the layer has a description' },
          ],
        })
      )
    ).rejects.toThrow(/vega-lite/i)
  })

  test.each([
    ['a missing mark', { ...barChart, mark: undefined }],
    ['an unsupported mark', { ...barChart, mark: 'not-a-vega-lite-mark' }],
    ['an invalid encoding type', { ...barChart, encoding: { x: { field: 'category', type: 'not-a-type' } } }],
    ['a malformed encoding channel', { ...barChart, encoding: { x: 123 } }],
    ['a malformed mark property', { ...barChart, mark: { type: 'bar', opacity: 'opaque' } }],
    ['an invalid width', { ...barChart, width: 'wide' }],
    ['an unknown specification property', { ...barChart, inventedProperty: true }],
    ['a JSON array', [barChart]],
    ['JSON null', null],
  ])('rejects schema violations: %s', (_name, specification) => {
    expect(renderMarkdown(fence(specification))).rejects.toThrow(/vega-lite/i)
  })

  test.each(['https://example.invalid/data.json', './data.json', '/data/values.json', 'file:///data/values.json'])(
    'rejects external data URL %s',
    (url) => {
      expect(renderMarkdown(fence({ ...barChart, data: { url } }))).rejects.toThrow(/vega-lite/i)
    }
  )

  test('rejects data URLs nested inside a layer', () => {
    expect(
      renderMarkdown(
        fence({
          description: 'Layer with external data',
          layer: [
            {
              mark: barChart.mark,
              encoding: barChart.encoding,
              data: { url: 'https://example.invalid/nested.json' },
            },
          ],
        })
      )
    ).rejects.toThrow(/vega-lite/i)
  })

  test.each(['https://example.invalid/image.png', './image.png', 'file:///images/chart.png'])(
    'rejects image resources supplied through a URL encoding: %s',
    (url) => {
      expect(
        renderMarkdown(
          fence({
            ...barChart,
            mark: 'image',
            data: { values: [{ category: 'Alpha', value: 2, image: url }] },
            encoding: { ...barChart.encoding, url: { field: 'image', type: 'nominal' } },
          })
        )
      ).rejects.toThrow(/vega-lite/i)
    }
  )

  test.each(['https://example.invalid/article', '/posts/example/', 'javascript:alert(1)'])(
    'rejects hyperlinks supplied through an href encoding: %s',
    (href) => {
      expect(
        renderMarkdown(
          fence({
            ...barChart,
            data: { values: [{ category: 'Alpha', value: 2, destination: href }] },
            encoding: { ...barChart.encoding, href: { field: 'destination', type: 'nominal' } },
          })
        )
      ).rejects.toThrow(/vega-lite/i)
    }
  )

  test('allows URL-looking text that is not a resource or hyperlink', async () => {
    const html = await renderMarkdown(
      fence({
        ...barChart,
        description: 'Counts for https://example.invalid without loading that address',
        data: { values: [{ category: 'https://example.invalid', value: 2 }] },
      })
    )

    expect(html).toMatch(/<path\b[^>]*aria-roledescription="bar"/)
    expect(html).not.toMatch(/<(?:a|image|script)\b/i)
  })

  test('allows URL-named literal fields in inline datasets without treating them as resources', async () => {
    const html = await renderMarkdown(
      fence({
        ...barChart,
        data: { name: 'observations' },
        datasets: {
          observations: [
            {
              category: 'Alpha',
              value: 2,
              url: 'https://example.invalid/data.json',
              href: 'file:///data/reference.json',
            },
          ],
        },
      })
    )

    expect(html.match(/<path\b[^>]*aria-roledescription="bar"[^>]*>/g)).toHaveLength(1)
    expect(html).not.toMatch(/<(?:a|image|script)\b/i)
  })

  test('allows literal parameter objects containing URL-named fields', async () => {
    const html = await renderMarkdown(
      fence({
        ...barChart,
        params: [{ name: 'metadata', value: { url: 'https://example.invalid', href: 'file:///reference' } }],
      })
    )

    expect(html.match(/<path\b[^>]*aria-roledescription="bar"[^>]*>/g)).toHaveLength(2)
  })

  test('preserves URL syntax and ID attributes when they are only text labels', async () => {
    const label = 'url(https://example.invalid) id="literal"'
    const html = await renderMarkdown(
      fence({
        ...barChart,
        mark: 'text',
        data: { values: [{ category: label, value: 2 }] },
        encoding: { ...barChart.encoding, text: { field: 'category', type: 'nominal' } },
      })
    )
    const texts = getElements(htmlToHast(html)).filter((element) => element.tagName === 'text')

    expect(
      texts.some((element) => element.children.some((child) => child.type === 'text' && child.value === label))
    ).toBe(true)
  })

  test.each([
    'url(https://example.invalid/paint.svg#gradient)',
    'u\\72l(https://example.invalid/paint.svg#gradient)',
    'url(https://example.invalid/paint.svg#gradient',
    'url("https://example.invalid/paint.svg#gradient")',
    'url(./paint.svg#gradient)',
    'URL(//example.invalid/paint.svg#gradient)',
  ])('rejects external SVG paint references: %s', (paint) => {
    expect(
      renderMarkdown(
        fence({
          ...barChart,
          data: {
            values: [{ category: 'Alpha', value: 2, paint }],
          },
          encoding: {
            ...barChart.encoding,
            color: { field: 'paint', type: 'nominal', scale: null },
          },
        })
      )
    ).rejects.toThrow(/vega-lite/i)
  })

  test('rejects expression errors raised while evaluating inline data', () => {
    expect(
      renderMarkdown(
        fence({
          ...barChart,
          transform: [{ calculate: 'datum.missing.value', as: 'calculated' }],
          encoding: { ...barChart.encoding, y: { field: 'calculated', type: 'quantitative' } },
        })
      )
    ).rejects.toThrow(/vega-lite/i)
  })

  test('preserves local gradient and multiple clip references without sharing IDs between charts', async () => {
    const chart = {
      description: 'Clipped layered marks with a local gradient',
      data: barChart.data,
      encoding: barChart.encoding,
      layer: [
        {
          mark: {
            type: 'bar',
            clip: true,
            color: {
              gradient: 'linear',
              stops: [
                { offset: 0, color: '#336699' },
                { offset: 1, color: '#99ccff' },
              ],
            },
          },
        },
        { mark: { type: 'line', clip: true } },
        { mark: { type: 'point', clip: true } },
      ],
    }
    const html = await renderMarkdown(`${fence(chart)}\n\n${fence(chart)}`)
    const elements = getElements(htmlToHast(html))
    const figures = elements.filter((element) => element.tagName === 'figure')
    const allIds = elements.flatMap((element) =>
      typeof element.properties.id === 'string' ? [element.properties.id] : []
    )

    expect(figures).toHaveLength(2)
    expect(new Set(allIds).size).toBe(allIds.length)
    for (const figure of figures) {
      const chartElements = getElements(figure)
      const ids = chartElements.map((element) => element.properties.id)
      const references = chartElements.flatMap((element) =>
        Object.values(element.properties).flatMap((value) =>
          typeof value === 'string' ? [...value.matchAll(/url\(#([^)]+)\)/g)].map((match) => match[1]) : []
        )
      )
      const gradients = chartElements.filter((element) => element.tagName === 'linearGradient')
      const clips = chartElements.filter((element) => element.tagName === 'clipPath')

      expect(gradients.length).toBeGreaterThan(0)
      expect(clips.length).toBeGreaterThanOrEqual(2)
      for (const definition of [...gradients, ...clips]) {
        expect(references).toContain(String(definition.properties.id))
      }
      for (const reference of references) {
        expect(ids).toContain(reference)
      }
      expect(chartElements.some((element) => element.tagName === 'script')).toBe(false)
    }
  })

  test('includes the source file URL and opening fence line in JSON errors', () => {
    const fileURL = new URL('file:///articles/chart-errors.md')
    const result = renderMarkdown('# Heading\n\nAn introduction.\n\n```vega-lite\n{invalid}\n```', fileURL)

    expect(result).rejects.toThrow(/vega-lite/i)
    expect(result).rejects.toThrow(fileURL.href)
    expect(result).rejects.toThrow(/(?:line\s+|:|L)5\b/i)
  })

  test('reports the failing block line when an earlier chart is valid', () => {
    const fileURL = new URL('file:///articles/multiple-charts.md')
    const markdown = `${fence(barChart)}\n\n${fence({ ...barChart, mark: 'invalid' })}`
    const result = renderMarkdown(markdown, fileURL)

    expect(result).rejects.toThrow(/vega-lite/i)
    expect(result).rejects.toThrow(fileURL.href)
    expect(result).rejects.toThrow(/(?:line\s+|:|L)5\b/i)
  })
})

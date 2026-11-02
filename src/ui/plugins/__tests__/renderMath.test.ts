import { describe, expect, test } from 'bun:test'
import type { HastNode } from 'satteri'
import { htmlToHast, markdownToHtml } from 'satteri'
import { renderMath } from '@/ui/plugins/renderMath'

const renderMarkdown = (markdown: string, fileURL?: URL) => {
  const { html } = markdownToHtml(markdown, { fileURL, features: { math: true }, hastPlugins: [renderMath()] })
  return html
}

const getElements = (node: HastNode): Extract<HastNode, { type: 'element' }>[] => {
  const children = 'children' in node ? node.children.flatMap(getElements) : []
  return node.type === 'element' ? [node, ...children] : children
}

describe('renderMath', () => {
  test('renders inline fractions synchronously as semantic MathML and visual HTML without a pre wrapper', () => {
    const formula = String.raw`\frac{a}{b}`
    const html = renderMarkdown(`El cociente es $${formula}$.`)
    const elements = getElements(htmlToHast(html))
    const math = elements.find((element) => element.tagName === 'math')
    const annotation = elements.find((element) => element.tagName === 'annotation')
    const visual = elements.find((element) => element.properties.className?.includes('katex-html'))

    expect(typeof html).toBe('string')
    expect(html).toMatch(/^<p>El cociente es <span\b/)
    expect(html).toContain('</span>.</p>')
    expect(math).toBeDefined()
    expect(html).toContain('<math xmlns="http://www.w3.org/1998/Math/MathML">')
    expect(elements.some((element) => element.tagName === 'semantics')).toBe(true)
    expect(elements.some((element) => element.tagName === 'mfrac')).toBe(true)
    expect(annotation?.properties.encoding).toBe('application/x-tex')
    expect(annotation?.children).toEqual([{ type: 'text', value: formula }])
    expect(visual?.properties.ariaHidden).toBe('true')
    expect(visual?.children.length).toBeGreaterThan(0)
    expect(html).not.toMatch(/<(?:pre|code)\b/)
    expect(html).not.toContain('katex-display')
    expect(html).not.toContain('markdown-content__math')
  })

  test('replaces the display pre with an accessible keyboard-focusable scrolling group', () => {
    const formula = String.raw`\sum_{i=1}^{n} i`
    const html = renderMarkdown(`$$\n${formula}\n$$`)
    const elements = getElements(htmlToHast(html))
    const wrapper = elements.find((element) => element.properties.className?.includes('markdown-content__math'))
    const math = elements.find((element) => element.tagName === 'math')
    const annotation = elements.find((element) => element.tagName === 'annotation')

    expect(wrapper?.tagName).toBe('div')
    expect(wrapper?.properties.role).toBe('group')
    expect(wrapper?.properties.ariaLabel).toBe('Fórmula matemática')
    expect(wrapper?.properties.tabIndex).toBe(0)
    expect(math?.properties.display).toBe('block')
    expect(annotation?.children).toEqual([{ type: 'text', value: formula }])
    expect(html).toContain('class="katex-display"')
    expect(html).toContain('class="katex-html"')
    expect(html).not.toMatch(/<(?:pre|code)\b/)
    expect(html).not.toContain('math-display')
  })

  test.each([
    [String.raw`\frac{x + 1}{y}`, 'mfrac'],
    [String.raw`\begin{aligned} a &= b + c \\ d &= e \end{aligned}`, 'mtable'],
    [String.raw`\sum_{i=1}^{n} i^2`, 'munderover'],
  ])('renders display expression %s with meaningful MathML %s', (formula, tagName) => {
    const html = renderMarkdown(`$$\n${formula}\n$$`)
    const elements = getElements(htmlToHast(html))
    const annotation = elements.find((element) => element.tagName === 'annotation')

    expect(elements.some((element) => element.tagName === tagName)).toBe(true)
    expect(annotation?.properties.encoding).toBe('application/x-tex')
    expect(annotation?.children).toEqual([{ type: 'text', value: formula }])
    expect(elements.some((element) => element.properties.className?.includes('katex-html'))).toBe(true)
    expect(html).not.toContain('katex-error')
  })

  test('preserves neighboring Markdown and mixed inline and display formulas in source order', () => {
    const markdown = [
      '# Resultados',
      '',
      'Antes de $x^2$, una **explicación**.',
      '',
      '$$',
      String.raw`\frac{1}{2}`,
      '$$',
      '',
      'Después de $y + 1$, [otra lectura](/posts/example/).',
      '',
      '$$',
      String.raw`\sum_{i=1}^{n} i`,
      '$$',
      '',
      '- Fin del cálculo.',
    ].join('\n')
    const html = renderMarkdown(markdown)
    const elements = getElements(htmlToHast(html))
    const annotations = elements.filter((element) => element.tagName === 'annotation')

    expect(annotations.map((annotation) => annotation.children)).toEqual([
      [{ type: 'text', value: 'x^2' }],
      [{ type: 'text', value: String.raw`\frac{1}{2}` }],
      [{ type: 'text', value: 'y + 1' }],
      [{ type: 'text', value: String.raw`\sum_{i=1}^{n} i` }],
    ])
    expect(elements.filter((element) => element.properties.className?.includes('markdown-content__math'))).toHaveLength(
      2
    )
    expect(html).toContain('<h1>Resultados</h1>')
    expect(html).toContain('<strong>explicación</strong>')
    expect(html).toContain('<a href="/posts/example/">otra lectura</a>')
    expect(html).toContain('<li>Fin del cálculo.</li>')
    expect(html).not.toMatch(/<(?:pre|code)\b/)
  })

  test('keeps same-line double-dollar formulas inline according to native Satteri parsing', () => {
    const html = renderMarkdown('Antes $$x^2$$ después.')

    expect(html).toContain('<annotation encoding="application/x-tex">x^2</annotation>')
    expect(html).toMatch(/^<p>Antes <span\b/)
    expect(html).not.toContain('katex-display')
    expect(html).not.toContain('markdown-content__math')
  })

  test.each(['go', 'text', 'math', 'latex', 'math-inline', 'math-display', ''])(
    'leaves math syntax and invalid TeX unchanged in a %s code fence',
    (language) => {
      const markdown = `\`\`\`${language}\n// $x$\n$$\n\\unknownFormula\n$$\n\`\`\``
      const { html: original } = markdownToHtml(markdown, { features: { math: true } })

      expect(renderMarkdown(markdown)).toBe(original)
      expect(original).toContain('<pre><code')
      expect(original).not.toContain('katex')
    }
  )

  test('leaves math syntax inside inline code unchanged alongside a real formula', () => {
    const code = '`$\\unknownFormula$` y `$$x$$`'
    const { html: original } = markdownToHtml(code, { features: { math: true } })
    const html = renderMarkdown(`${code} y $x$.`)

    expect(renderMarkdown(code)).toBe(original)
    expect(html).toContain('<code>$\\unknownFormula$</code>')
    expect(html).toContain('<code>$$x$$</code>')
    expect(getElements(htmlToHast(html)).filter((element) => element.tagName === 'math')).toHaveLength(1)
  })

  test.each(['Cuesta $20.', 'El total es 20$.', 'Un dólar $ sin cierre.', 'Texto normal sin fórmulas.'])(
    'preserves text and unpaired currency delimiters: %s',
    (markdown) => {
      const { html: original } = markdownToHtml(markdown, { features: { math: true } })

      expect(renderMarkdown(markdown)).toBe(original)
      expect(original).not.toContain('math-inline')
      expect(original).not.toContain('math-display')
    }
  )

  test.each([String.raw`Cuesta \$20 y \$30.`, String.raw`\$x\$`, String.raw`\$\$ no es una fórmula \$\$`])(
    'preserves native Satteri escaped-dollar behavior: %s',
    (markdown) => {
      const { html: original } = markdownToHtml(markdown, { features: { math: true } })

      expect(renderMarkdown(markdown)).toBe(original)
      expect(original).not.toContain('math-inline')
      expect(original).not.toContain('math-display')
    }
  )

  test('renders properly delimited math after escaped literal currency', () => {
    const html = renderMarkdown(String.raw`Cuesta \$20; el resultado es $x + 1$.`)

    expect(html).toContain('<p>Cuesta $20; el resultado es ')
    expect(html).toContain('<annotation encoding="application/x-tex">x + 1</annotation>')
    expect(getElements(htmlToHast(html)).filter((element) => element.tagName === 'math')).toHaveLength(1)
  })

  test.each([String.raw`\unknownFormula`, String.raw`\frac{1}`, 'é'])(
    'throws synchronously for unknown, malformed or strict-invalid TeX: %s',
    (formula) => {
      expect(() => renderMarkdown(`$${formula}$`)).toThrow()
      expect(() => renderMarkdown(`$$\n${formula}\n$$`)).toThrow()
    }
  )

  test('includes the source file URL and inline formula line in an error', () => {
    const fileURL = new URL('file:///articles/inline-math-errors.md')
    const render = () => renderMarkdown('# Resultados\n\nUna introducción.\n\nError: $\\unknownFormula$.', fileURL)

    expect(render).toThrow(/unknownFormula/)
    expect(render).toThrow(fileURL.href)
    expect(render).toThrow(/(?:line\s+|:|L)5\b/i)
  })

  test('reports the opening double-dollar line rather than the display content line', () => {
    const fileURL = new URL('file:///articles/display-math-errors.md')
    const render = () => renderMarkdown('# Resultados\n\nUna introducción.\n\n$$\n\\frac{1}\n$$', fileURL)

    expect(render).toThrow(fileURL.href)
    expect(render).toThrow(/(?:line\s+|:|L)5\b/i)
  })

  test('reports the failing display opening line after an earlier valid formula', () => {
    const fileURL = new URL('file:///articles/multiple-formulas.md')
    const render = () => renderMarkdown('$$\nx^2\n$$\n\n$$\n\\unknownFormula\n$$', fileURL)

    expect(render).toThrow(/unknownFormula/)
    expect(render).toThrow(fileURL.href)
    expect(render).toThrow(/(?:line\s+|:|L)5\b/i)
  })

  test.each([
    String.raw`\href{https://untrusted.example/path}{click}`,
    String.raw`\href{javascript:alert(1)}{click}`,
    String.raw`\includegraphics{https://untrusted.example/pixel.svg}`,
  ])('does not emit untrusted links or resources for %s', (formula) => {
    const html = renderMarkdown(`$${formula}$\n\n$$\n${formula}\n$$`)
    const elements = getElements(htmlToHast(html))

    expect(elements.filter((element) => element.tagName === 'math')).toHaveLength(2)
    expect(html).not.toMatch(/<(?:a|img|image|script|iframe|object|embed|link)\b/i)
    expect(html).not.toMatch(/\s(?:href|src|xlink:href|onerror|onload)\s*=/i)
  })

  test('renders static HTML and MathML without scripts or CDN assets', () => {
    const html = renderMarkdown('$x^2$\n\n$$\n\\frac{1}{2}\n$$')
    const elements = getElements(htmlToHast(html))

    expect(elements.filter((element) => element.tagName === 'math')).toHaveLength(2)
    expect(elements.filter((element) => element.properties.className?.includes('katex-html'))).toHaveLength(2)
    expect(html).not.toMatch(/<(?:script|link|iframe)\b/i)
    expect(html).not.toMatch(/\s(?:src|href)\s*=/i)
    expect(html).not.toMatch(/(?:cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com)/i)
  })

  test.each([
    '$\\gdef\\privateFormula{42}\\privateFormula$\n\n$\\privateFormula$',
    '$$\n\\gdef\\privateFormula{42}\\privateFormula\n$$\n\n$\\privateFormula$',
    '$\\gdef\\privateFormula{42}\\privateFormula$\n\n$$\n\\privateFormula\n$$',
  ])('does not leak global macro definitions to a neighboring formula: %s', (markdown) => {
    expect(renderMarkdown(String.raw`$\gdef\privateFormula{42}\privateFormula$`)).toContain('katex-html')
    expect(() => renderMarkdown(markdown)).toThrow(/privateFormula/)
  })

  test('does not leak global macro definitions across documents reusing the same plugin', () => {
    const options = { features: { math: true }, hastPlugins: [renderMath()] }
    const { html } = markdownToHtml(String.raw`$\gdef\documentFormula{42}\documentFormula$`, options)

    expect(html).toContain('katex-html')
    expect(() => markdownToHtml(String.raw`$\documentFormula$`, options)).toThrow(/documentFormula/)
  })
})

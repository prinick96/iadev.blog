import { renderToString } from 'katex'
import { defineHastPlugin } from 'satteri'

export function renderMath() {
  return defineHastPlugin({
    name: 'render-math',
    options: { position: true },
    element: {
      filter: ['code'],
      visit(node, context) {
        const classes = node.properties.className
        const classNames = Array.isArray(classes) ? classes.map(String) : String(classes ?? '').split(/\s+/)
        const displayMode = classNames.includes('math-display')

        if (!displayMode && !classNames.includes('math-inline')) {
          return
        }

        const parent = context.parent(node)
        const target = displayMode && parent.type === 'element' && parent.tagName === 'pre' ? parent : node

        try {
          const html = renderToString(context.textContent(node), {
            displayMode,
            output: 'htmlAndMathml',
            throwOnError: true,
            strict: 'error',
            trust: false,
          })

          if (displayMode) {
            context.replaceNode(target, {
              type: 'element',
              tagName: 'div',
              properties: {
                className: ['markdown-content__math'],
                role: 'group',
                ariaLabel: 'Fórmula matemática',
                tabIndex: 0,
              },
              children: [{ type: 'raw', value: html }],
            })
            return
          }

          context.replaceNode(target, { type: 'raw', value: html })
        } catch (error) {
          const location = `${context.fileURL?.href ?? 'Markdown'}:${target.position?.start.line ?? 1}`
          const message = error instanceof Error ? error.message : String(error)
          throw new Error(`Invalid math expression at ${location}: ${message}`, { cause: error })
        }
      },
    },
  })
}

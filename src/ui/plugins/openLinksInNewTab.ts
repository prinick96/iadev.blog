import { defineHastPlugin } from 'satteri'

export function openLinksInNewTab() {
  return defineHastPlugin({
    name: 'open-links-in-new-tab',
    element: {
      filter: ['a'],
      visit(node, context) {
        if (typeof node.properties.href !== 'string') {
          return
        }

        const existingRel = node.properties.rel
        const tokens = Array.isArray(existingRel) ? existingRel.map(String) : String(existingRel ?? '').split(/\s+/)
        const rel = [
          ...new Set([
            ...tokens.filter((token) => token && token.toLowerCase() !== 'opener'),
            'noopener',
            'noreferrer',
          ]),
        ]

        context.setProperty(node, 'target', '_blank')
        context.setProperty(node, 'rel', rel)
      },
    },
  })
}

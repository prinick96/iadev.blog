export function initializeCodeCopy(): void {
  for (const content of document.querySelectorAll('.markdown-content')) {
    const [template] = content.querySelectorAll<HTMLTemplateElement>('template[data-code-copy-template]')

    for (const block of content.querySelectorAll('pre.astro-code')) {
      if (block.closest('[data-copy-container]')) {
        continue
      }

      const [code] = block.querySelectorAll('code')
      const container = document.createElement('div')
      container.className = 'markdown-content__code-block'
      container.setAttribute('data-copy-container', '')
      code.setAttribute('data-copy-content', '')
      block.before(container)
      container.append(block, template.content.cloneNode(true))
    }
  }
}

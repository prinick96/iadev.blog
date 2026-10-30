export async function initializeSaasIsDead(stylesheetUrl: string): Promise<void> {
  await customElements.whenDefined('saas-is-dead')

  for (const widget of document.querySelectorAll('saas-is-dead.saas-is-dead')) {
    const root = widget.shadowRoot

    if (!root || root.querySelector('link[data-saas-is-dead-styles]')) {
      continue
    }

    const stylesheet = document.createElement('link')
    stylesheet.rel = 'stylesheet'
    stylesheet.href = stylesheetUrl
    stylesheet.setAttribute('data-saas-is-dead-styles', '')
    root.append(stylesheet)
  }
}

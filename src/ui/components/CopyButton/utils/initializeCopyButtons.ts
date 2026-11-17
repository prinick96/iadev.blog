export function initializeCopyButtons(): void {
  if (!navigator.clipboard?.writeText) {
    return
  }

  for (const container of document.querySelectorAll('[data-copy-container]')) {
    const [button] = container.querySelectorAll<HTMLButtonElement>('button[data-copy-button]')
    const [source] = container.querySelectorAll<HTMLElement>('[data-copy-content]')

    if (button.dataset.copyInitialized === 'true') {
      continue
    }

    button.dataset.copyInitialized = 'true'
    button.hidden = false
    button.addEventListener('click', async () => {
      button.disabled = true

      try {
        await navigator.clipboard.writeText(source.textContent)
      } catch {
        return
      } finally {
        button.disabled = false
      }
    })
  }
}

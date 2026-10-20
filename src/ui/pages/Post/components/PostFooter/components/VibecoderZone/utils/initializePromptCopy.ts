export function initializePromptCopy(): void {
  for (const zone of document.querySelectorAll('[data-vibecoder-zone]')) {
    const button = zone.querySelector('button[data-vibecoder-copy]')
    const prompt = zone.querySelector('[data-vibecoder-prompt]')

    if (!(button instanceof HTMLButtonElement) || !prompt || !navigator.clipboard?.writeText) {
      continue
    }

    button.hidden = false
    button.addEventListener('click', async () => {
      button.disabled = true

      try {
        await navigator.clipboard.writeText(prompt.textContent ?? '')
      } catch {
        return
      } finally {
        button.disabled = false
      }
    })
  }
}

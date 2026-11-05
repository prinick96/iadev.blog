export function showCookieConsentFeedback(elements: NodeListOf<HTMLElement>, message: string): void {
  for (const element of elements) {
    element.textContent = message
    element.hidden = message === ''
  }
}

import { getNewPostUrl } from '@/ui/utils/getNewPostUrl'

export function initializePostTemplate(): void {
  const newPostLinks = document.querySelectorAll<HTMLAnchorElement>('a[data-new-post]')

  for (const link of newPostLinks) {
    const baseUrl = link.href

    for (const event of ['click', 'auxclick', 'contextmenu']) {
      link.addEventListener(event, () => {
        link.href = getNewPostUrl(baseUrl, new Date())
      })
    }
  }
}

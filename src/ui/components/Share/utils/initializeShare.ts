import type { ShareUpdateDetail } from '@/ui/components/Share/types'
import { getShareLinks } from '@/ui/components/Share/utils/getShareLinks'

export function initializeShare(): void {
  document.querySelectorAll<HTMLElement>('[data-share][data-share-live]').forEach((root) => {
    if (root.dataset.shareReady === 'true') {
      return
    }

    root.addEventListener('share:update', ({ detail }: CustomEvent<ShareUpdateDetail>) => {
      const links = getShareLinks(detail.url, detail.title)

      links.forEach(({ destination, href }) => {
        root.querySelectorAll<HTMLAnchorElement>(`a[data-share-destination="${destination}"]`).forEach((anchor) => {
          anchor.href = href
        })
      })
    })
    root.dataset.shareReady = 'true'
  })
}

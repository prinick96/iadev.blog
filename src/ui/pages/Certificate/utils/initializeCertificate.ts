import type { ShareUpdateDetail } from '@/ui/components/Share/types'
import { initializeShare } from '@/ui/components/Share/utils/initializeShare'
import type { CertificateValues } from '@/ui/pages/Certificate/types'
import { getCertificateUrl } from '@/ui/pages/Certificate/utils/getCertificateUrl'
import { readCertificate } from '@/ui/pages/Certificate/utils/readCertificate'

export function initializeCertificate(): void {
  const root = document.querySelector<HTMLElement>('[data-certificate]')
  if (!root || root.dataset.certificateReady === 'true') {
    return
  }

  const title = root.querySelector<HTMLTextAreaElement>('[data-certificate-field="title"]')
  const name = root.querySelector<HTMLInputElement>('[data-certificate-field="name"]')
  const description = root.querySelector<HTMLTextAreaElement>('[data-certificate-field="description"]')
  const share = root.querySelector<HTMLElement>('[data-share]')
  if (!title || !name || !description || !share) {
    return
  }

  const fields = [title, name, description]
  const readFields = (): CertificateValues => ({
    title: title.value,
    name: name.value,
    description: description.value,
  })

  const resizeFields = (): void => {
    for (const field of [title, description]) {
      field.style.height = 'auto'
      field.style.height = `${field.scrollHeight + 2}px`
    }
  }

  const updateShare = (url: URL): void => {
    const shareTitle = name.value ? `${name.value} — ${title.value}` : title.value
    share.dispatchEvent(
      new CustomEvent<ShareUpdateDetail>('share:update', { detail: { url: url.href, title: shareTitle } })
    )
  }

  const commitUrl = (url: URL): void => {
    if (window.location.href !== url.href) {
      window.history.replaceState(window.history.state, '', url.href)
    }
  }

  const restoreFromUrl = (): void => {
    const currentUrl = new URL(window.location.href)
    const values = readCertificate(currentUrl.searchParams)
    title.value = values.title
    name.value = values.name
    description.value = values.description
    resizeFields()
    updateShare(getCertificateUrl(currentUrl, values))
  }

  const handleInput = (): void => {
    resizeFields()
    const url = getCertificateUrl(new URL(window.location.href), readFields())
    updateShare(url)

    window.setTimeout(() => {
      const latestUrl = getCertificateUrl(new URL(window.location.href), readFields())
      if (url.href === latestUrl.href) {
        commitUrl(url)
      }
    }, 200)
  }

  initializeShare()
  restoreFromUrl()
  fields.forEach((field) => {
    field.readOnly = false
    field.addEventListener('input', handleInput)
    field.addEventListener('blur', () => {
      commitUrl(getCertificateUrl(new URL(window.location.href), readFields()))
    })
  })
  window.addEventListener('popstate', restoreFromUrl)
  const resizeObserver = new ResizeObserver(resizeFields)
  resizeObserver.observe(root)
  root.dataset.certificateReady = 'true'
}

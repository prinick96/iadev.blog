import type { CertificateValues } from '@/ui/pages/Certificate/types'

export function getCertificateUrl(currentUrl: URL, values: CertificateValues): URL {
  const url = new URL(currentUrl.href)
  url.searchParams.set('title', values.title)
  url.searchParams.set('name', values.name)
  url.searchParams.set('description', values.description)

  return url
}

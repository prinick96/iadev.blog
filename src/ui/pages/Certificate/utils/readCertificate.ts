import { CERTIFICATE_LIMITS, DEFAULT_CERTIFICATE } from '@/ui/pages/Certificate/constants'
import type { CertificateValues } from '@/ui/pages/Certificate/types'

function truncateCertificateField(value: string, limit: number): string {
  return value.slice(0, limit).replace(/[\uD800-\uDBFF]$/, '')
}

export function readCertificate(params: URLSearchParams): CertificateValues {
  return {
    title: truncateCertificateField(params.get('title') ?? DEFAULT_CERTIFICATE.title, CERTIFICATE_LIMITS.title),
    name: truncateCertificateField(params.get('name') ?? DEFAULT_CERTIFICATE.name, CERTIFICATE_LIMITS.name),
    description: truncateCertificateField(
      params.get('description') ?? DEFAULT_CERTIFICATE.description,
      CERTIFICATE_LIMITS.description
    ),
  }
}

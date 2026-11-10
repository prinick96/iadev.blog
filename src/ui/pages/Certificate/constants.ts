import type { CertificateValues } from '@/ui/pages/Certificate/types'

export const DEFAULT_CERTIFICATE: Readonly<CertificateValues> = {
  title: 'ESPECIALISTA EN IA',
  name: '',
  description:
    'Por generar su propio certificado y demostrar una confianza ilimitada en sus conocimientos de inteligencia artificial.',
}

export const CERTIFICATE_LIMITS = {
  title: 100,
  name: 100,
  description: 400,
} as const

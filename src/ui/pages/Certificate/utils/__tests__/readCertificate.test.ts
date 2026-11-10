import { describe, expect, test } from 'bun:test'
import { CERTIFICATE_LIMITS, DEFAULT_CERTIFICATE } from '@/ui/pages/Certificate/constants'
import type { CertificateValues } from '@/ui/pages/Certificate/types'
import { readCertificate } from '@/ui/pages/Certificate/utils/readCertificate'

const fieldNames: (keyof CertificateValues)[] = ['title', 'name', 'description']

describe('readCertificate', () => {
  test('uses defaults for absent parameters without changing the defaults', () => {
    const defaultsBefore = { ...DEFAULT_CERTIFICATE }
    const result = readCertificate(new URLSearchParams('unrelated=keep'))

    expect(result).toEqual(DEFAULT_CERTIFICATE)
    expect(result).not.toBe(DEFAULT_CERTIFICATE)
    expect(DEFAULT_CERTIFICATE).toEqual(defaultsBefore)
  })

  test('preserves explicitly empty values instead of replacing them with defaults', () => {
    expect(readCertificate(new URLSearchParams('title=&name=&description='))).toEqual({
      title: '',
      name: '',
      description: '',
    })
  })

  test.each(fieldNames)('fills only missing fields when %s is provided', (field) => {
    const params = new URLSearchParams({ [field]: 'Solo este campo' })

    expect(readCertificate(params)).toEqual({ ...DEFAULT_CERTIFICATE, [field]: 'Solo este campo' })
  })

  test('decodes reserved characters, newlines and Unicode as literal text, not HTML', () => {
    const values = {
      title: '<script>alert("ascendido")</script> & + # = % ? /',
      name: '  María 李 🦊\nSenior por suscripción  ',
      description: '<img src=x onerror=alert(1)>\nLínea dos\r\n«café» & raw/wiki + 100%',
    }
    const params = new URLSearchParams(new URLSearchParams(values).toString())

    expect(readCertificate(params)).toEqual(values)
  })

  test.each(fieldNames)('preserves values below and at the %s limit and truncates longer ones', (field) => {
    const limit = CERTIFICATE_LIMITS[field]
    for (const length of [limit - 1, limit, limit + 1, limit * 3]) {
      const value = 'ñ'.repeat(length)
      const result = readCertificate(new URLSearchParams({ [field]: value }))

      expect(result[field]).toBe(value.slice(0, limit))
      expect(result[field]).toHaveLength(Math.min(length, limit))
    }
  })

  test.each(fieldNames)('discards an emoji split at the UTF-16 %s limit without leaving a lone surrogate', (field) => {
    const prefix = 'ñ'.repeat(CERTIFICATE_LIMITS[field] - 1)
    const params = new URLSearchParams({ [field]: `${prefix}🦊` })
    const paramsBefore = params.toString()

    const result = readCertificate(params)

    expect(result[field]).toBe(prefix)
    expect(result[field]).toHaveLength(CERTIFICATE_LIMITS[field] - 1)
    expect(() => encodeURIComponent(result[field])).not.toThrow()
    expect(params.toString()).toBe(paramsBefore)
  })

  test.each(fieldNames)('preserves a complete emoji fitting exactly within the UTF-16 %s limit', (field) => {
    const expected = `${'ñ'.repeat(CERTIFICATE_LIMITS[field] - 2)}🦊`
    const result = readCertificate(new URLSearchParams({ [field]: `${expected}discarded` }))

    expect(result[field]).toBe(expected)
    expect(result[field]).toHaveLength(CERTIFICATE_LIMITS[field])
    expect(() => encodeURIComponent(result[field])).not.toThrow()
  })

  test('applies each field limit independently without trimming whitespace', () => {
    const values = {
      title: `  ${'T'.repeat(CERTIFICATE_LIMITS.title)}  `,
      name: `\n${'N'.repeat(CERTIFICATE_LIMITS.name)}\n`,
      description: ` ${'D'.repeat(CERTIFICATE_LIMITS.description)} `,
    }

    expect(readCertificate(new URLSearchParams(values))).toEqual({
      title: values.title.slice(0, CERTIFICATE_LIMITS.title),
      name: values.name.slice(0, CERTIFICATE_LIMITS.name),
      description: values.description.slice(0, CERTIFICATE_LIMITS.description),
    })
  })

  test('reads the first duplicate value and leaves all input parameters unchanged', () => {
    const params = new URLSearchParams('title=Primero&title=Segundo&name=&description=A%0AB&ref=one&ref=two')
    const before = params.toString()
    const entriesBefore = [...params.entries()]

    expect(readCertificate(params)).toEqual({ title: 'Primero', name: '', description: 'A\nB' })
    expect(params.toString()).toBe(before)
    expect([...params.entries()]).toEqual(entriesBefore)
  })

  test('returns independent instances without sharing mutations with defaults or later reads', () => {
    const params = new URLSearchParams('name=María')
    const first = readCertificate(params)
    const second = readCertificate(params)
    first.title = 'Ascenso autoproclamado'
    first.name = 'Otro nombre'
    first.description = 'Otro texto'

    expect(first).not.toBe(second)
    expect(second).toEqual({ ...DEFAULT_CERTIFICATE, name: 'María' })
    expect(readCertificate(params)).toEqual(second)
    expect(readCertificate(new URLSearchParams())).toEqual(DEFAULT_CERTIFICATE)
  })
})

import { describe, expect, test } from 'bun:test'
import { getShareLinks } from '@/ui/components/Share/utils/getShareLinks'
import { CERTIFICATE_LIMITS, DEFAULT_CERTIFICATE } from '@/ui/pages/Certificate/constants'
import type { CertificateValues } from '@/ui/pages/Certificate/types'
import { getCertificateUrl } from '@/ui/pages/Certificate/utils/getCertificateUrl'
import { readCertificate } from '@/ui/pages/Certificate/utils/readCertificate'

const values: CertificateValues = {
  title: 'LLM & WIKI + #100% «工程師»',
  name: 'María 李 🦊',
  description: '<script>alert("ascenso")</script>\nraw/ → wiki/\r\n¿Senior? = sí & no',
}

describe('getCertificateUrl', () => {
  test('round-trips reserved characters, literal HTML, newlines and Unicode through readCertificate', () => {
    const result = getCertificateUrl(new URL('https://iadev.blog/certificate/'), values)

    expect(result).toBeInstanceOf(URL)
    expect(readCertificate(new URL(result.href).searchParams)).toEqual(values)
    expect(result.searchParams.get('title')).toBe(values.title)
    expect(result.searchParams.get('name')).toBe(values.name)
    expect(result.searchParams.get('description')).toBe(values.description)
    expect(result.searchParams.has('no')).toBe(false)
    expect(result.href).not.toContain('<script>')
  })

  test('preserves origin, credentials, path, unrelated parameters and hash', () => {
    const current = new URL('https://user:secret@example.test:8443/nested/cert%20name/?ref=a&ref=b&empty=#preview')
    const result = getCertificateUrl(current, values)

    expect(result.origin).toBe(current.origin)
    expect(result.username).toBe(current.username)
    expect(result.password).toBe(current.password)
    expect(result.pathname).toBe(current.pathname)
    expect(result.searchParams.getAll('ref')).toEqual(['a', 'b'])
    expect(result.searchParams.get('empty')).toBe('')
    expect(result.hash).toBe('#preview')
  })

  test('does not mutate the input URL, its search parameters or the values object', () => {
    const current = new URL('https://iadev.blog/certificate/?title=Before&name=Other&keep=1#stamp')
    const currentParams = current.searchParams
    const hrefBefore = current.href
    const paramsBefore = [...currentParams.entries()]
    const frozenValues = Object.freeze({ ...values })
    const valuesBefore = { ...frozenValues }

    const result = getCertificateUrl(current, frozenValues)

    expect(result).not.toBe(current)
    expect(current.href).toBe(hrefBefore)
    expect(current.searchParams).toBe(currentParams)
    expect([...currentParams.entries()]).toEqual(paramsBefore)
    expect(frozenValues).toEqual(valuesBefore)
    result.searchParams.set('name', 'Otra persona')
    expect(current.href).toBe(hrefBefore)
    expect(frozenValues).toEqual(valuesBefore)
  })

  test('replaces all duplicate certificate parameters without duplicating unrelated parameters', () => {
    const current = new URL(
      'https://iadev.blog/certificate/?title=Old&title=Older&name=A&name=B&description=X&description=Y&ref=1&ref=2'
    )
    const result = getCertificateUrl(current, values)

    expect(result.searchParams.getAll('title')).toEqual([values.title])
    expect(result.searchParams.getAll('name')).toEqual([values.name])
    expect(result.searchParams.getAll('description')).toEqual([values.description])
    expect(result.searchParams.getAll('ref')).toEqual(['1', '2'])
    expect(current.searchParams.getAll('title')).toEqual(['Old', 'Older'])
  })

  test('serializes explicit empty strings and defaults without dropping fields', () => {
    const current = new URL('https://iadev.blog/certificate/')
    const empty = { title: '', name: '', description: '' }
    const emptyUrl = getCertificateUrl(current, empty)
    const defaultUrl = getCertificateUrl(current, DEFAULT_CERTIFICATE)

    expect([...emptyUrl.searchParams.entries()]).toEqual([
      ['title', ''],
      ['name', ''],
      ['description', ''],
    ])
    expect(readCertificate(emptyUrl.searchParams)).toEqual(empty)
    expect(readCertificate(defaultUrl.searchParams)).toEqual(DEFAULT_CERTIFICATE)
  })

  test('serializes provided values exactly and leaves length limits to readCertificate', () => {
    const longValues = {
      title: 'T'.repeat(CERTIFICATE_LIMITS.title + 1),
      name: 'N'.repeat(CERTIFICATE_LIMITS.name + 1),
      description: 'D'.repeat(CERTIFICATE_LIMITS.description + 1),
    }
    const result = getCertificateUrl(new URL('https://iadev.blog/certificate/'), longValues)

    expect(Object.fromEntries(result.searchParams)).toEqual(longValues)
    expect(readCertificate(result.searchParams)).toEqual({
      title: longValues.title.slice(0, CERTIFICATE_LIMITS.title),
      name: longValues.name.slice(0, CERTIFICATE_LIMITS.name),
      description: longValues.description.slice(0, CERTIFICATE_LIMITS.description),
    })
  })

  test.each([
    { prefixOffset: 1, expectedEmoji: '' },
    { prefixOffset: 2, expectedEmoji: '🦊' },
  ])('round-trips boundary emojis into valid share URLs: %p', ({ prefixOffset, expectedEmoji }) => {
    const prefixes = {
      title: 'T'.repeat(CERTIFICATE_LIMITS.title - prefixOffset),
      name: 'N'.repeat(CERTIFICATE_LIMITS.name - prefixOffset),
      description: 'D'.repeat(CERTIFICATE_LIMITS.description - prefixOffset),
    }
    const current = new URL('https://iadev.blog/certificate/?ref=emoji#preview')
    const incoming = getCertificateUrl(current, {
      title: `${prefixes.title}🦊`,
      name: `${prefixes.name}🦊`,
      description: `${prefixes.description}🦊`,
    })
    const normalized = readCertificate(incoming.searchParams)
    const expected = {
      title: `${prefixes.title}${expectedEmoji}`,
      name: `${prefixes.name}${expectedEmoji}`,
      description: `${prefixes.description}${expectedEmoji}`,
    }
    const normalizedUrl = getCertificateUrl(current, normalized)
    const shareTitle = `${normalized.name} — ${normalized.title}`

    expect(normalized).toEqual(expected)
    expect(readCertificate(normalizedUrl.searchParams)).toEqual(expected)
    expect(() => encodeURIComponent(shareTitle)).not.toThrow()
    const links = getShareLinks(normalizedUrl.href, shareTitle)
    const whatsapp = links.find(({ destination }) => destination === 'whatsapp')
    const telegram = links.find(({ destination }) => destination === 'telegram')
    if (!whatsapp || !telegram) {
      throw new Error('Expected WhatsApp and Telegram share descriptors')
    }
    expect(new URL(telegram.href).searchParams.get('text')).toBe(shareTitle)
    expect(new URL(telegram.href).searchParams.get('url')).toBe(normalizedUrl.href)
    expect(new URL(whatsapp.href).searchParams.get('text')).toBe(`${shareTitle}\n${normalizedUrl.href}`)
  })

  test('returns independent URL instances and is stable when serializing the same values again', () => {
    const current = new URL('https://iadev.blog/certificate/?ref=keep#seal')
    const first = getCertificateUrl(current, values)
    const second = getCertificateUrl(current, values)

    expect(first).not.toBe(second)
    expect(first.href).toBe(second.href)
    expect(getCertificateUrl(first, values).href).toBe(first.href)
    first.searchParams.set('title', 'Autopromoción')
    expect(readCertificate(second.searchParams)).toEqual(values)
  })
})

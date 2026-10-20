import { describe, expect, test } from 'bun:test'
import { serializeStructuredData } from '@/ui/layouts/BaseLayout/components/SeoMetadata/utils/serializeStructuredData'

describe('serializeStructuredData', () => {
  test('escapes less-than signs in keys and nested values to prevent script closing tags', () => {
    const value = {
      '</script><script>': [{ text: '</script><script>alert("IA & café")</script>' }],
    }
    const serialized = serializeStructuredData(value)

    expect(serialized).not.toContain('<')
    expect(JSON.parse(serialized)).toStrictEqual(value)
  })

  test('roundtrips JSON values, Unicode and literal escape sequences without mutation', () => {
    const value = {
      '@context': 'https://schema.org',
      '@graph': [],
      enabled: true,
      count: 0,
      optional: null,
      text: 'Español: áéíóú ñ ¿IA? «café» — 日本語 😀',
      escaped: '\\u003c \\u2028 \\ path "quoted"\n\t',
      nested: { text: '<etiqueta> & \u2028\u2029' },
    }
    const before = structuredClone(value)
    const serialized = serializeStructuredData(value)

    expect(JSON.parse(serialized)).toStrictEqual(before)
    expect(value).toStrictEqual(before)
  })
})

import { expect, test } from 'bun:test'
import { getNewPostUrl } from '@/ui/utils/getNewPostUrl'

const baseUrl = 'https://github.com/prinick96/iadev.blog/new/main/src/content/posts?filename=mi-post.md'

test('preserves the GitHub editor and filename while prefilling a valid anonymous post', () => {
  const date = new Date('2026-10-20T23:45:12.123Z')
  const url = new URL(getNewPostUrl(baseUrl, date))
  const template = url.searchParams.get('value')

  expect(url.origin + url.pathname).toBe('https://github.com/prinick96/iadev.blog/new/main/src/content/posts')
  expect(url.searchParams.get('filename')).toBe('mi-post.md')
  expect(template).toStartWith('---\ntitle: "Mi opinión no solicitada sobre la IA"')
  expect(template).toContain('description: "Un resumen del melón que vienes a abrir."')
  expect(template).toContain('published_at: 2026-10-20T23:45:12.123Z\nauthor: default\ncategories: []\n---')
  expect(template).toContain('Tu cuenta de GitHub seguirá siendo pública')
  expect(template).toContain('créalo en src/content/authors.json y sustituye default por su id')
  expect(template).toContain('Se recomienda que ese id coincida con tu usuario de GitHub')
  expect(template).toContain('https://github.com/<id>')
  expect(date.toISOString()).toBe('2026-10-20T23:45:12.123Z')
})

test('uses the supplied instant in UTC across day boundaries', () => {
  const url = new URL(getNewPostUrl(baseUrl, new Date('2026-10-21T01:30:00+02:00')))

  expect(url.searchParams.get('value')).toContain('published_at: 2026-10-20T23:30:00.000Z')
})

test('replaces an existing template instead of appending duplicate values', () => {
  const url = new URL(getNewPostUrl(`${baseUrl}&value=outdated`, new Date('2026-10-20T12:00:00Z')))

  expect(url.searchParams.getAll('value')).toHaveLength(1)
  expect(url.searchParams.get('value')).not.toContain('outdated')
})

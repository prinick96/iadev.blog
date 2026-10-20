import { describe, expect, test } from 'bun:test'
import { getSocialImagePath } from '@/ui/routes/getSocialImagePath'

describe('getSocialImagePath', () => {
  test('returns a PNG for the post identifier', () => {
    expect(getSocialImagePath('example')).toBe('/social/posts/example.png')
  })

  test('preserves nested identifiers and encodes each segment', () => {
    expect(getSocialImagePath('opinión/IA sin criterio?#')).toBe(
      '/social/posts/opini%C3%B3n/IA%20sin%20criterio%3F%23.png'
    )
  })

  test('encodes percent signs instead of interpreting them as escapes', () => {
    expect(getSocialImagePath('100% automatizado')).toBe('/social/posts/100%25%20automatizado.png')
  })
})

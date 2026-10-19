import { expect, test } from 'bun:test'
import { formatRelativeTime } from '@/ui/utils/formatRelativeTime'

const now = new Date('2026-10-19T12:00:00.000Z')
const minute = 60_000
const hour = 60 * minute
const day = 24 * hour
const month = 30 * day
const year = 365 * day

const relativeTimeCases: [number, string, string][] = [
  [0, 'ahora', 'ahora'],
  [1, 'ahora', 'ahora'],
  [1000, 'ahora', 'ahora'],
  [30_000, 'ahora', 'ahora'],
  [minute - 1, 'ahora', 'ahora'],
  [minute, 'hace 1 minuto', 'dentro de 1 minuto'],
  [2 * minute - 1, 'hace 1 minuto', 'dentro de 1 minuto'],
  [2 * minute, 'hace 2 minutos', 'dentro de 2 minutos'],
  [4 * minute, 'hace 4 minutos', 'dentro de 4 minutos'],
  [hour - 1, 'hace 59 minutos', 'dentro de 59 minutos'],
  [hour, 'hace 1 hora', 'dentro de 1 hora'],
  [2 * hour - 1, 'hace 1 hora', 'dentro de 1 hora'],
  [2 * hour, 'hace 2 horas', 'dentro de 2 horas'],
  [day - 1, 'hace 23 horas', 'dentro de 23 horas'],
  [day, 'ayer', 'mañana'],
  [2 * day - 1, 'ayer', 'mañana'],
  [2 * day, 'anteayer', 'pasado mañana'],
  [3 * day, 'hace 3 días', 'dentro de 3 días'],
  [month - 1, 'hace 29 días', 'dentro de 29 días'],
  [month, 'el mes pasado', 'el próximo mes'],
  [2 * month - 1, 'el mes pasado', 'el próximo mes'],
  [2 * month, 'hace 2 meses', 'dentro de 2 meses'],
  [year - 1, 'hace 12 meses', 'dentro de 12 meses'],
  [year, 'el año pasado', 'el próximo año'],
  [2 * year - 1, 'el año pasado', 'el próximo año'],
  [2 * year, 'hace 2 años', 'dentro de 2 años'],
  [5 * year, 'hace 5 años', 'dentro de 5 años'],
]

test.each(relativeTimeCases)('formats a past offset of %s milliseconds as %s', (elapsed, expected) => {
  const date = new Date(now.getTime() - elapsed).toISOString()

  expect(formatRelativeTime(date, now)).toBe(expected)
})

test.each(relativeTimeCases)('formats a future offset of %s milliseconds', (elapsed, _past, expected) => {
  const date = new Date(now.getTime() + elapsed).toISOString()

  expect(formatRelativeTime(date, now)).toBe(expected)
})

test('uses elapsed time rather than calendar day boundaries', () => {
  const reference = new Date('2026-10-19T00:00:00Z')

  expect(formatRelativeTime('2026-10-18T23:59:00Z', reference)).toBe('hace 1 minuto')
})

test('uses fixed durations across leap days rather than calendar years', () => {
  const reference = new Date('2024-02-29T12:00:00Z')

  expect(formatRelativeTime('2023-03-01T12:00:00Z', reference)).toBe('el año pasado')
})

test('compares timestamps with explicit time zone offsets', () => {
  expect(formatRelativeTime('2026-10-19T11:00:00-01:00', now)).toBe('ahora')
  expect(formatRelativeTime('2026-10-19T11:00:00+01:00', now)).toBe('hace 2 horas')
})

test('accepts date-only strings as UTC dates', () => {
  expect(formatRelativeTime('2026-10-18', new Date('2026-10-19T00:00:00Z'))).toBe('ayer')
})

test('defaults the reference date to the current time', () => {
  expect(formatRelativeTime(new Date().toISOString())).toBe('ahora')
})

test('does not mutate the reference date', () => {
  const reference = new Date(now)
  const timestamp = reference.getTime()

  formatRelativeTime('2025-01-01T00:00:00Z', reference)

  expect(reference.getTime()).toBe(timestamp)
})

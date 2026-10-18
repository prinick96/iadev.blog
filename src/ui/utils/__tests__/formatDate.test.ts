import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatDate } from '@/ui/utils/formatDate'

test('formats a date in Spanish without including the time', () => {
  assert.equal(formatDate(new Date('2026-10-18T12:45:00Z')), '18 de octubre de 2026')
})

test('uses the UTC day even when the input has a different time zone', () => {
  assert.equal(formatDate(new Date('2026-10-18T23:30:00-03:00')), '19 de octubre de 2026')
})

test('supports leap days without mutating the input date', () => {
  const date = new Date('2024-02-29T00:00:00Z')
  const timestamp = date.getTime()

  assert.equal(formatDate(date), '29 de febrero de 2024')
  assert.equal(date.getTime(), timestamp)
})

test('rejects invalid dates', () => {
  assert.throws(() => formatDate(new Date('fecha-invalida')), RangeError)
})

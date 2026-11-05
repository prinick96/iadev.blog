import { describe, expect, test } from 'bun:test'
import { formatClockDate } from '@/ui/layouts/BaseLayout/components/Topbar/components/Clock/utils/formatClockDate'

describe('formatClockDate', () => {
  test('formats the local date and time in the macOS menu bar style', () => {
    const date = new Date(2026, 10, 4, 14, 39, 51)
    const timestamp = date.getTime()

    expect(formatClockDate(date)).toBe('Mié 4 nov 14:39:51')
    expect(date.getTime()).toBe(timestamp)
  })

  test('pads time fields but not the day of the month', () => {
    expect(formatClockDate(new Date(2026, 0, 2, 3, 4, 5))).toBe('Vie 2 ene 03:04:05')
  })

  test('uses midnight rather than hour 24', () => {
    expect(formatClockDate(new Date(2027, 0, 1, 0, 0, 0))).toBe('Vie 1 ene 00:00:00')
  })

  test('formats leap days and double-digit days', () => {
    expect(formatClockDate(new Date(2028, 1, 29, 23, 59, 59))).toBe('Mar 29 feb 23:59:59')
  })

  test('rejects invalid dates', () => {
    expect(() => formatClockDate(new Date('invalid'))).toThrow(RangeError)
  })
})

import { expect, test } from 'bun:test'
import { formatCompactNumber } from '@/ui/utils/formatCompactNumber'

test.each([
  [2000, '2k'],
  [200000, '200k'],
  [2000000, '2M'],
  [2500, '2.5k'],
  [0, '0'],
  [-0, '-0'],
  [1, '1'],
  [12.34, '12.3'],
  [0.04, '0'],
  [Number.MIN_VALUE, '0'],
  [-Number.MIN_VALUE, '-0'],
  [999, '999'],
  [999.94, '999.9'],
  [999.95, '1k'],
  [1000, '1k'],
  [2550, '2.6k'],
  [999949, '999.9k'],
  [999950, '1M'],
  [1000000, '1M'],
  [2500000, '2.5M'],
  [1000000000, '1B'],
  [1000000000000, '1T'],
  [-12.34, '-12.3'],
  [-999.95, '-1k'],
  [-2000, '-2k'],
  [-2500, '-2.5k'],
  [-200000, '-200k'],
  [-2000000, '-2M'],
  [-999950, '-1M'],
])('formats %s as %s', (value, expected) => {
  expect(formatCompactNumber(value)).toBe(expected)
})

test.each([
  [1e15, '1Qa'],
  [1e18, '1Qi'],
  [1e21, '1Sx'],
  [1e24, '1Sp'],
  [1e27, '1Oc'],
  [1e30, '1No'],
  [1e33, '1Dc'],
  [2.5e15, '2.5Qa'],
  [2.5e18, '2.5Qi'],
  [2.5e33, '2.5Dc'],
  [-1e15, '-1Qa'],
  [-2.5e18, '-2.5Qi'],
  [-1e33, '-1Dc'],
])('formats extended short-scale magnitude %s as %s', (value, expected) => {
  expect(formatCompactNumber(value)).toBe(expected)
})

test.each([
  [999_949_000_000, '999.9B'],
  [999_950_000_000, '1T'],
  [999_949_000_000_000, '999.9T'],
  [999_950_000_000_000, '1Qa'],
  [999.95e15, '1Qi'],
  [-999_950_000_000_000, '-1Qa'],
  [999.94e33, '999.9Dc'],
  [999.95e33, '1E36'],
  [-999.95e33, '-1E36'],
])('promotes rounded magnitude boundaries for %s to %s', (value, expected) => {
  expect(formatCompactNumber(value)).toBe(expected)
})

test.each([
  [1e36, '1E36'],
  [1.25e36, '1.3E36'],
  [-1e36, '-1E36'],
  [1e100, '1E100'],
  [Number.MAX_VALUE, '1.8E308'],
  [-Number.MAX_VALUE, '-1.8E308'],
])('uses scientific notation for unsupported magnitude %s as %s', (value, expected) => {
  expect(formatCompactNumber(value)).toBe(expected)
})

test.each([NaN, Infinity, -Infinity])('rejects non-finite value %s with a RangeError', (value) => {
  expect(() => formatCompactNumber(value)).toThrow(RangeError)
  expect(() => formatCompactNumber(value)).toThrow('Cannot format a non-finite number.')
})

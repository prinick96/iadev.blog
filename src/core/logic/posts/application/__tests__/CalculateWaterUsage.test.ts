import { afterEach, beforeEach, expect, setSystemTime, test } from 'bun:test'
import CalculateWaterUsage from '@/core/logic/posts/application/CalculateWaterUsage'

beforeEach(() => {
  setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
})

afterEach(() => {
  setSystemTime()
})

test('returns exactly zero liters for zero tokens', () => {
  expect(CalculateWaterUsage.execute(0)).toBe(0)
})

test.each([
  [1, 0.00000068],
  [1000, 0.00068],
  [10000, 0.0068],
  [1000000, 0.68],
])('applies the 2026 inflation surcharge to the scenario liters for %i tokens', (tokenCount, expectedLiters) => {
  expect(CalculateWaterUsage.execute(tokenCount)).toBeCloseTo(expectedLiters, 12)
})

test.each([
  [2025, 0.00068],
  [2026, 0.00068],
  [2027, 0.00136],
  [2028, 0.00204],
  [2030, 0.0034],
])('adjusts 1000 tokens to %s inflation with %s liters', (year, expectedLiters) => {
  setSystemTime(new Date(`${year}-06-01T00:00:00.000Z`))

  expect(CalculateWaterUsage.execute(1000)).toBeCloseTo(expectedLiters, 12)
})

test('updates the inflation surcharge at the UTC year boundary without reimporting the class', () => {
  setSystemTime(new Date('2026-12-31T23:59:59.999Z'))
  const previousYearLiters = CalculateWaterUsage.execute(1000)

  setSystemTime(new Date('2027-01-01T00:00:00.000Z'))

  expect(CalculateWaterUsage.execute(1000)).toBeCloseTo(previousYearLiters * 2, 12)
})

test('uses the UTC year instead of the year in the input time zone', () => {
  setSystemTime(new Date('2026-12-31T23:00:00.000-02:00'))

  expect(CalculateWaterUsage.execute(1000)).toBeCloseTo(0.00136, 12)
})

test.each([
  [0, 1],
  [1, 1000],
  [1000, 10000],
  [10000, 1000000],
])('increases water usage from %i to %i tokens', (lowerTokenCount, higherTokenCount) => {
  expect(CalculateWaterUsage.execute(higherTokenCount)).toBeGreaterThan(CalculateWaterUsage.execute(lowerTokenCount))
})

test.each([
  [1, 1000],
  [1000, 10],
  [10000, 100],
])('scales proportionally from %i tokens by a factor of %i', (tokenCount, factor) => {
  expect(CalculateWaterUsage.execute(tokenCount * factor)).toBeCloseTo(
    CalculateWaterUsage.execute(tokenCount) * factor,
    12
  )
})

test('accepts the maximum safe integer token count', () => {
  const liters = CalculateWaterUsage.execute(Number.MAX_SAFE_INTEGER)

  expect(Number.isFinite(liters)).toBe(true)
  expect(liters).toBeGreaterThan(0)
})

test.each([-1, -1000, -0.5, 0.5, 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])(
  'rejects invalid token count %s with a useful RangeError',
  (tokenCount) => {
    expect(() => CalculateWaterUsage.execute(tokenCount)).toThrow(RangeError)
    expect(() => CalculateWaterUsage.execute(tokenCount)).toThrow(
      'Pídele al agente un número de tokens entero entre 0 y Number.MAX_SAFE_INTEGER.'
    )
    expect(() => CalculateWaterUsage.execute(tokenCount)).toThrow('Los tokens negativos no son un descuento')
  }
)

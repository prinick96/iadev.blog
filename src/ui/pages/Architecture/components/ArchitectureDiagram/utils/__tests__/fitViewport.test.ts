import { expect, test } from 'bun:test'
import { fitViewport } from '@/ui/pages/Architecture/components/ArchitectureDiagram/utils/fitViewport'

test('expands the width for a landscape container while preserving the bounds center', () => {
  const bounds = { x: 10, y: 20, width: 100, height: 100 }

  expect(fitViewport(bounds, { width: 800, height: 400 })).toEqual({
    x: -40,
    y: 20,
    width: 200,
    height: 100,
  })
})

test('expands the height for a portrait container while preserving the bounds center', () => {
  const bounds = { x: -30, y: -20, width: 100, height: 50 }

  expect(fitViewport(bounds, { width: 400, height: 800 })).toEqual({
    x: -30,
    y: -95,
    width: 100,
    height: 200,
  })
})

test('returns an equal copy when the aspect ratios already match', () => {
  const bounds = { x: 10, y: 20, width: 200, height: 100 }
  const result = fitViewport(bounds, { width: 800, height: 400 })

  expect(result).toEqual(bounds)
  expect(result).not.toBe(bounds)
})

test.each([
  { width: 900, height: 300 },
  { width: 300, height: 900 },
  { width: 300, height: 300 },
])('contains all bounds and matches the container aspect ratio for %o', (size) => {
  const bounds = { x: -12.5, y: 23.75, width: 123.5, height: 67.25 }
  const result = fitViewport(bounds, size)

  expect(result.width / result.height).toBeCloseTo(size.width / size.height)
  expect(result.x + result.width / 2).toBeCloseTo(bounds.x + bounds.width / 2)
  expect(result.y + result.height / 2).toBeCloseTo(bounds.y + bounds.height / 2)
  expect(result.x).toBeLessThanOrEqual(bounds.x)
  expect(result.y).toBeLessThanOrEqual(bounds.y)
  expect(result.x + result.width).toBeGreaterThanOrEqual(bounds.x + bounds.width)
  expect(result.y + result.height).toBeGreaterThanOrEqual(bounds.y + bounds.height)
})

test.each([
  { width: 0, height: 0 },
  { width: 0, height: 50 },
  { width: 100, height: 0 },
])('normalizes zero bounds dimensions without shifting their original center for %o', (dimensions) => {
  const bounds = { x: 10, y: -20, ...dimensions }
  const result = fitViewport(bounds, { width: 800, height: 400 })

  expect(result.width).toBeGreaterThanOrEqual(1)
  expect(result.height).toBeGreaterThanOrEqual(1)
  expect(result.width / result.height).toBe(2)
  expect(result.x + result.width / 2).toBe(bounds.x + bounds.width / 2)
  expect(result.y + result.height / 2).toBe(bounds.y + bounds.height / 2)
})

test.each([
  [
    { width: 0, height: 0 },
    { width: 1, height: 1 },
  ],
  [
    { width: 0, height: 100 },
    { width: 1, height: 100 },
  ],
  [
    { width: 100, height: 0 },
    { width: 100, height: 1 },
  ],
])('treats zero container dimensions as one for %o', (size, normalizedSize) => {
  const bounds = { x: 10, y: 20, width: 100, height: 50 }
  const result = fitViewport(bounds, size)

  expect(result).toEqual(fitViewport(bounds, normalizedSize))
  expect(Number.isFinite(result.x)).toBe(true)
  expect(Number.isFinite(result.y)).toBe(true)
  expect(Number.isFinite(result.width)).toBe(true)
  expect(Number.isFinite(result.height)).toBe(true)
})

test('fits zero bounds into a zero container as a centered unit viewport', () => {
  expect(fitViewport({ x: 10, y: 20, width: 0, height: 0 }, { width: 0, height: 0 })).toEqual({
    x: 9.5,
    y: 19.5,
    width: 1,
    height: 1,
  })
})

test('does not mutate frozen bounds or container dimensions', () => {
  const bounds = Object.freeze({ x: 10, y: 20, width: 100, height: 50 })
  const size = Object.freeze({ width: 400, height: 800 })

  expect(fitViewport(bounds, size)).not.toBe(bounds)
  expect(bounds).toEqual({ x: 10, y: 20, width: 100, height: 50 })
  expect(size).toEqual({ width: 400, height: 800 })
})

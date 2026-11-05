import { expect, test } from 'bun:test'
import { zoomViewport } from '@/ui/pages/Architecture/components/ArchitectureDiagram/utils/zoomViewport'

test('zooms in by dividing dimensions around a world anchor', () => {
  expect(
    zoomViewport({ x: 10, y: 20, width: 200, height: 100 }, 2, { x: 60, y: 95 }, { min_width: 10, max_width: 1000 })
  ).toEqual({ x: 35, y: 57.5, width: 100, height: 50 })
})

test('zooms out when the factor is smaller than one', () => {
  expect(
    zoomViewport({ x: 10, y: 20, width: 100, height: 200 }, 0.5, { x: 35, y: 170 }, { min_width: 10, max_width: 1000 })
  ).toEqual({ x: -15, y: -130, width: 200, height: 400 })
})

test.each([
  { x: 10, y: 20 },
  { x: 210, y: 120 },
  { x: 110, y: 70 },
  { x: 60, y: 95 },
  { x: -100, y: 250 },
])('preserves the relative position of the world anchor %o', (anchor) => {
  const viewport = { x: 10, y: 20, width: 200, height: 100 }
  const result = zoomViewport(viewport, 1.75, anchor, { min_width: 10, max_width: 1000 })

  expect((anchor.x - result.x) / result.width).toBeCloseTo((anchor.x - viewport.x) / viewport.width)
  expect((anchor.y - result.y) / result.height).toBeCloseTo((anchor.y - viewport.y) / viewport.height)
  expect(result.width / result.height).toBeCloseTo(viewport.width / viewport.height)
})

test.each([
  [100, 50],
  [0.01, 400],
  [Number.MAX_VALUE, 50],
  [Number.MIN_VALUE, 400],
])('clamps the width for factor %s to %s while preserving aspect ratio and anchor', (factor, expectedWidth) => {
  const viewport = { x: 10, y: 20, width: 200, height: 100 }
  const anchor = { x: 60, y: 95 }
  const result = zoomViewport(viewport, factor, anchor, { min_width: 50, max_width: 400 })

  expect(result.width).toBe(expectedWidth)
  expect(result.height).toBe(expectedWidth / 2)
  expect((anchor.x - result.x) / result.width).toBeCloseTo(0.25)
  expect((anchor.y - result.y) / result.height).toBeCloseTo(0.75)
})

test.each([50, 400])('does not drift when repeatedly zooming beyond the width limit %s', (width) => {
  const viewport = { x: -25, y: 10, width, height: width * 2 }
  const factor = width === 50 ? 2 : 0.5
  const anchor = { x: 35, y: 80 }
  const limits = { min_width: 50, max_width: 400 }
  const result = zoomViewport(viewport, factor, anchor, limits)

  expect(result).toEqual(viewport)
  expect(zoomViewport(result, factor, anchor, limits)).toEqual(viewport)
  expect(result).not.toBe(viewport)
})

test('uses a fixed width when both limits match', () => {
  expect(
    zoomViewport({ x: 10, y: 20, width: 200, height: 100 }, 0.5, { x: 60, y: 95 }, { min_width: 100, max_width: 100 })
  ).toEqual({ x: 35, y: 57.5, width: 100, height: 50 })
})

test.each([
  { width: 200, height: 100 },
  { width: 100, height: 200 },
  { width: 0.5, height: 0.25 },
])('reverses an unclamped zoom for %o', (dimensions) => {
  const viewport = { x: -12.5, y: 23.75, ...dimensions }
  const anchor = { x: 37.25, y: -8.5 }
  const limits = { min_width: 0.01, max_width: 1000 }
  const zoomed = zoomViewport(viewport, 1.7, anchor, limits)
  const result = zoomViewport(zoomed, 1 / 1.7, anchor, limits)

  expect(zoomed.width).toBeCloseTo(viewport.width / 1.7)
  expect(zoomed.width / zoomed.height).toBeCloseTo(viewport.width / viewport.height)
  expect(result.x).toBeCloseTo(viewport.x)
  expect(result.y).toBeCloseTo(viewport.y)
  expect(result.width).toBeCloseTo(viewport.width)
  expect(result.height).toBeCloseTo(viewport.height)
})

test('returns an equal copy for a neutral zoom factor within limits', () => {
  const viewport = { x: 10, y: 20, width: 200, height: 100 }
  const result = zoomViewport(viewport, 1, { x: 60, y: 95 }, { min_width: 50, max_width: 400 })

  expect(result).toEqual(viewport)
  expect(result).not.toBe(viewport)
})

test.each([0, -0, -1, NaN, Infinity, -Infinity])('returns an unchanged copy for invalid factor %s', (factor) => {
  const viewport = Object.freeze({ x: 10, y: 20, width: 200, height: 100 })
  const result = zoomViewport(viewport, factor, { x: 60, y: 95 }, { min_width: 300, max_width: 400 })

  expect(result).toEqual(viewport)
  expect(result).not.toBe(viewport)
})

test('does not mutate frozen viewport, anchor or limits', () => {
  const viewport = Object.freeze({ x: 10, y: 20, width: 200, height: 100 })
  const anchor = Object.freeze({ x: 60, y: 95 })
  const limits = Object.freeze({ min_width: 50, max_width: 400 })

  expect(zoomViewport(viewport, 2, anchor, limits)).toEqual({ x: 35, y: 57.5, width: 100, height: 50 })
  expect(viewport).toEqual({ x: 10, y: 20, width: 200, height: 100 })
  expect(anchor).toEqual({ x: 60, y: 95 })
  expect(limits).toEqual({ min_width: 50, max_width: 400 })
})

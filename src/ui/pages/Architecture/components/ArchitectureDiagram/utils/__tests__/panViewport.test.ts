import { expect, test } from 'bun:test'
import { panViewport } from '@/ui/pages/Architecture/components/ArchitectureDiagram/utils/panViewport'

test('adds positive world deltas without scaling them by viewport dimensions', () => {
  expect(panViewport({ x: 10, y: 20, width: 200, height: 100 }, { x: 15, y: 30 })).toEqual({
    x: 25,
    y: 50,
    width: 200,
    height: 100,
  })
})

test('adds negative and fractional world deltas', () => {
  expect(panViewport({ x: -10, y: 20, width: 100, height: 200 }, { x: -2.5, y: -30.25 })).toEqual({
    x: -12.5,
    y: -10.25,
    width: 100,
    height: 200,
  })
})

test('returns an equal copy for a zero delta', () => {
  const viewport = { x: 10, y: 20, width: 200, height: 100 }
  const result = panViewport(viewport, { x: 0, y: 0 })

  expect(result).toEqual(viewport)
  expect(result).not.toBe(viewport)
})

test('reverses a pan with the opposite delta', () => {
  const viewport = { x: -10, y: 20, width: 200, height: 100 }
  const delta = { x: 12.5, y: -32.25 }
  const panned = panViewport(viewport, delta)

  expect(panViewport(panned, { x: -delta.x, y: -delta.y })).toEqual(viewport)
})

test('preserves zero dimensions', () => {
  expect(panViewport({ x: 10, y: 20, width: 0, height: 0 }, { x: 15, y: -30 })).toEqual({
    x: 25,
    y: -10,
    width: 0,
    height: 0,
  })
})

test('does not mutate a frozen viewport or delta', () => {
  const viewport = Object.freeze({ x: 10, y: 20, width: 200, height: 100 })
  const delta = Object.freeze({ x: 15, y: -30 })

  expect(panViewport(viewport, delta)).not.toBe(viewport)
  expect(viewport).toEqual({ x: 10, y: 20, width: 200, height: 100 })
  expect(delta).toEqual({ x: 15, y: -30 })
})

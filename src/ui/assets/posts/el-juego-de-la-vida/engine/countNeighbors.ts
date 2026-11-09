import type { Grid } from './types'

const OFFSETS: readonly (readonly [number, number])[] = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
]

export function countNeighbors(current: Grid, x: number, y: number): number {
  let count = 0

  for (const [dx, dy] of OFFSETS) {
    count += current[y + dy]?.[x + dx] ?? 0
  }

  return count
}

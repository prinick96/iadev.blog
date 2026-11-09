import type { PatternName } from './types'

export const COLS = 60
export const ROWS = 40
export const SIZE = 12

export const PATTERNS: Readonly<Record<PatternName, readonly (readonly [number, number])[]>> = {
  block: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  blinker: [
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  glider: [
    [1, 0],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ],
}

import { COLS, PATTERNS, ROWS } from './constants'
import { emptyGrid } from './emptyGrid'
import type { Cell, Grid, PatternName } from './types'

export function createPattern(name: PatternName, columns = COLS, rows = ROWS): Grid {
  const startX = Math.floor(columns / 2) - 2
  const startY = Math.floor(rows / 2) - 2
  const coordinates = PATTERNS[name]

  return emptyGrid(columns, rows).map((row, y) =>
    row.map(
      (_, x): Cell =>
        coordinates.some(([offsetX, offsetY]) => x === startX + offsetX && y === startY + offsetY) ? 1 : 0
    )
  )
}

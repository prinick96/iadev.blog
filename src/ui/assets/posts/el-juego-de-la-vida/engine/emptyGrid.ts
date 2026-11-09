import { COLS, ROWS } from './constants'
import type { Cell, Grid } from './types'

export function emptyGrid(columns = COLS, rows = ROWS): Grid {
  if (!Number.isInteger(columns) || columns < 0 || !Number.isInteger(rows) || rows < 0) {
    throw new RangeError('Grid dimensions must be non-negative integers.')
  }

  return Array.from({ length: rows }, () => Array.from({ length: columns }, (): Cell => 0))
}

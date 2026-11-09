import { COLS, ROWS } from './constants'
import { emptyGrid } from './emptyGrid'
import type { Cell, Grid } from './types'

export function randomGrid(density: number, columns = COLS, rows = ROWS, random: () => number = Math.random): Grid {
  if (!Number.isFinite(density) || density < 0 || density > 1) {
    throw new RangeError('La densidad debe estar entre 0 y 1')
  }

  return emptyGrid(columns, rows).map((row) => row.map((): Cell => (random() < density ? 1 : 0)))
}

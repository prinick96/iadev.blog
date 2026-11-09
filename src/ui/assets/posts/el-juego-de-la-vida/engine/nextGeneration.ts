import { countNeighbors } from './countNeighbors'
import type { Cell, Grid } from './types'

export function nextGeneration(current: Grid): Grid {
  return current.map((row, y) =>
    row.map((cell, x): Cell => {
      const neighbors = countNeighbors(current, x, y)
      return neighbors === 3 || (cell === 1 && neighbors === 2) ? 1 : 0
    })
  )
}

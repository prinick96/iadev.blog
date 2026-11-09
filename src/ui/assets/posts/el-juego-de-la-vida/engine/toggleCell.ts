import type { Cell, Grid } from './types'

export function toggleCell(current: Grid, x: number, y: number): Grid {
  if (!Number.isInteger(x) || !Number.isInteger(y) || current[y]?.[x] === undefined) {
    return current
  }

  return current.map((row, rowIndex) =>
    row.map((cell, columnIndex): Cell => {
      if (rowIndex === y && columnIndex === x) {
        return cell === 1 ? 0 : 1
      }

      return cell
    })
  )
}

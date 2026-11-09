export type Cell = 0 | 1

export type Grid = readonly (readonly Cell[])[]

export type PatternName = 'block' | 'blinker' | 'glider'

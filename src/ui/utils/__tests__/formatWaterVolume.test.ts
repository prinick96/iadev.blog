import { expect, test } from 'bun:test'
import { formatWaterVolume } from '@/ui/utils/formatWaterVolume'

test.each([
  [0, '0 mL'],
  [-0, '0 mL'],
  [0.00000068, '0,00068 mL'],
  [0.00068, '0,68 mL'],
  [0.005576, '5,6 mL'],
  [0.5, '500 mL'],
  [0.99, '990 mL'],
  [1, '1 L'],
  [1.234, '1,2 L'],
  [1.999, '2 L'],
  [12.34, '12 L'],
  [1000, '1000 L'],
])('formats %s liters as %s with at most two significant digits', (liters, expected) => {
  expect(formatWaterVolume(liters)).toBe(expected)
})

test.each([-1, -0.001, NaN, Infinity, -Infinity])('rejects invalid water volume %s with a Spanish error', (liters) => {
  expect(() => formatWaterVolume(liters)).toThrow(
    new RangeError(
      'Dile al agente que el volumen de agua debe ser un número finito y no negativo. Las alucinaciones no rellenan el depósito.'
    )
  )
})

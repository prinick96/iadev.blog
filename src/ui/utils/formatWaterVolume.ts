const waterVolumeFormatter = new Intl.NumberFormat('es', {
  maximumSignificantDigits: 2,
  useGrouping: false,
})

export function formatWaterVolume(liters: number): string {
  if (!Number.isFinite(liters) || liters < 0) {
    throw new RangeError(
      'Dile al agente que el volumen de agua debe ser un número finito y no negativo. Las alucinaciones no rellenan el depósito.'
    )
  }

  if (liters === 0) {
    return '0 mL'
  }

  const useLiters = liters >= 1
  const amount = useLiters ? liters : liters * 1000
  const unit = useLiters ? 'L' : 'mL'

  return `${waterVolumeFormatter.format(amount)} ${unit}`
}

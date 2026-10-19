const magnitudeSuffixes = ['', 'k', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']
const magnitudeBase = 1000

const decimalFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 1,
  useGrouping: false,
})

const scientificFormatter = new Intl.NumberFormat('en', {
  notation: 'scientific',
  maximumFractionDigits: 1,
})

export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new RangeError('Cannot format a non-finite number.')
  }

  const initialMagnitudeIndex = Math.max(0, Math.floor(Math.log10(Math.abs(value)) / Math.log10(magnitudeBase)))
  const scaledValue = value / magnitudeBase ** initialMagnitudeIndex
  const roundedValue = Number(decimalFormatter.format(scaledValue))
  const magnitudeIndex = initialMagnitudeIndex + (Math.abs(roundedValue) >= magnitudeBase ? 1 : 0)
  const suffix = magnitudeSuffixes[magnitudeIndex]

  if (suffix === undefined) {
    return scientificFormatter.format(value)
  }

  const formattedValue = decimalFormatter.format(value / magnitudeBase ** magnitudeIndex)

  return `${formattedValue}${suffix}`
}

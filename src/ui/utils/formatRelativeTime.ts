const minute = 60_000
const hour = 60 * minute
const day = 24 * hour
const month = 30 * day
const year = 365 * day

const relativeTimeUnits: { unit: Intl.RelativeTimeFormatUnit; milliseconds: number }[] = [
  { unit: 'year', milliseconds: year },
  { unit: 'month', milliseconds: month },
  { unit: 'day', milliseconds: day },
  { unit: 'hour', milliseconds: hour },
  { unit: 'minute', milliseconds: minute },
]

const relativeTimeFormatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

export function formatRelativeTime(date: string, now: Date = new Date()): string {
  const timestamp = new Date(date).getTime()
  const currentTimestamp = now.getTime()

  const difference = timestamp - currentTimestamp
  const elapsed = Math.abs(difference)

  for (const { unit, milliseconds } of relativeTimeUnits) {
    if (elapsed >= milliseconds) {
      const value = Math.sign(difference) * Math.floor(elapsed / milliseconds)

      return relativeTimeFormatter.format(value, unit)
    }
  }

  return relativeTimeFormatter.format(0, 'second')
}

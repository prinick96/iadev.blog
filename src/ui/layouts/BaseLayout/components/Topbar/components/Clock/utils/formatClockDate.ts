const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

const timeFormatter = new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

export function formatClockDate(date: Date): string {
  const formattedDate = dateFormatter.format(date).replace(',', '').replaceAll('.', '')
  const capitalizedDate = `${formattedDate.charAt(0).toUpperCase()}${formattedDate.slice(1)}`

  return `${capitalizedDate} ${timeFormatter.format(date)}`
}

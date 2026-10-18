export function formatDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(date)

  return parts
    .filter((part) => part.type !== 'literal')
    .map((part) => part.value.replace(/\.$/, '').toLocaleUpperCase('es-ES'))
    .join(' ')
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeZone: 'UTC' }).format(date)
}

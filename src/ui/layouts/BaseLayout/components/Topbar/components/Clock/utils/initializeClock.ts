import { formatClockDate } from '@/ui/layouts/BaseLayout/components/Topbar/components/Clock/utils/formatClockDate'

export function initializeClock(): void {
  const clocks = document.querySelectorAll<HTMLTimeElement>('time[data-clock]')

  if (clocks.length === 0) {
    return
  }

  const updateClocks = (): void => {
    const now = new Date()
    const formattedDate = formatClockDate(now)

    for (const clock of clocks) {
      clock.dateTime = now.toISOString()
      clock.textContent = formattedDate
      clock.hidden = false
    }
  }

  updateClocks()
  window.setInterval(updateClocks, 1000)
}

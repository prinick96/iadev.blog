import { afterEach, beforeEach, describe, expect, mock, setSystemTime, test } from 'bun:test'
import { initializeClock } from '@/ui/layouts/BaseLayout/components/Topbar/components/Clock/utils/initializeClock'

class ClockMock {
  hidden = true
  textContent = ''
  dateTime = ''
}

const browserGlobals = ['document', 'window']
const originalDescriptors = browserGlobals.map(
  (name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const
)
const setIntervalMock = mock<(...args: [handler: () => void, delay: number]) => number>(() => 1)
let clocks: ClockMock[] = []

beforeEach(() => {
  clocks = []
  setIntervalMock.mockClear()
  setSystemTime(new Date(2026, 10, 4, 14, 39, 51))
  Object.defineProperties(globalThis, {
    document: { configurable: true, value: { querySelectorAll: () => clocks } },
    window: { configurable: true, value: { setInterval: setIntervalMock } },
  })
})

afterEach(() => {
  setSystemTime()

  for (const [name, descriptor] of originalDescriptors) {
    if (descriptor) {
      Object.defineProperty(globalThis, name, descriptor)
    } else {
      Reflect.deleteProperty(globalThis, name)
    }
  }
})

describe('initializeClock', () => {
  test('does not start a timer when no clocks exist', () => {
    initializeClock()

    expect(setIntervalMock).not.toHaveBeenCalled()
  })

  test('immediately reveals the current local time and a machine-readable timestamp', () => {
    const clock = new ClockMock()
    clocks.push(clock)

    initializeClock()

    expect(clock.hidden).toBe(false)
    expect(clock.textContent).toBe('Mié 4 nov 14:39:51')
    expect(clock.dateTime).toBe(new Date().toISOString())
    expect(setIntervalMock).toHaveBeenCalledTimes(1)
    expect(setIntervalMock).toHaveBeenCalledWith(expect.any(Function), 1000)
  })

  test('updates the seconds from the actual system time instead of counting ticks', () => {
    const clock = new ClockMock()
    clocks.push(clock)
    initializeClock()
    setSystemTime(new Date(2026, 10, 4, 14, 42, 8))

    setIntervalMock.mock.calls[0]?.[0]()

    expect(clock.textContent).toBe('Mié 4 nov 14:42:08')
    expect(clock.dateTime).toBe(new Date().toISOString())
  })

  test('updates the date when midnight crosses into a new year', () => {
    const clock = new ClockMock()
    clocks.push(clock)
    setSystemTime(new Date(2026, 11, 31, 23, 59, 59))
    initializeClock()
    expect(clock.textContent).toBe('Jue 31 dic 23:59:59')
    setSystemTime(new Date(2027, 0, 1, 0, 0, 0))

    setIntervalMock.mock.calls[0]?.[0]()

    expect(clock.textContent).toBe('Vie 1 ene 00:00:00')
  })

  test('updates all clocks using one timer', () => {
    const firstClock = new ClockMock()
    const secondClock = new ClockMock()
    clocks.push(firstClock, secondClock)

    initializeClock()

    expect(firstClock.textContent).toBe(secondClock.textContent)
    expect(firstClock.dateTime).toBe(secondClock.dateTime)
    expect(firstClock.hidden).toBe(false)
    expect(secondClock.hidden).toBe(false)
    expect(setIntervalMock).toHaveBeenCalledTimes(1)
  })
})

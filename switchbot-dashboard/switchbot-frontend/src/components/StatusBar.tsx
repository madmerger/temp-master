import { pad2 } from '../lib/format'

interface StatusBarProps {
  meterCount: number
  lastRefresh: Date | null
}

export default function StatusBar({ meterCount, lastRefresh }: StatusBarProps) {
  const noun = meterCount === 1 ? 'meter' : 'meters'
  const time = lastRefresh
    ? `${pad2(lastRefresh.getHours())}:${pad2(lastRefresh.getMinutes())}:${pad2(lastRefresh.getSeconds())}`
    : ''

  return (
    <div data-testid="status-bar" className="mb-4 flex flex-wrap justify-between gap-2 rounded border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
      <span data-testid="status-meters-count">Monitoring {meterCount} {noun}</span>
      <span data-testid="status-last-refresh">Last refresh: {time}</span>
    </div>
  )
}

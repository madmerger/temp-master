interface StatusBarProps {
  count: number
  lastRefresh?: Date
}

export default function StatusBar({ count, lastRefresh }: StatusBarProps) {
  const noun = count === 1 ? 'meter' : 'meters'

  return (
    <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 px-4 py-3 rounded mb-4 flex flex-wrap items-center justify-between gap-2">
      <span className="font-medium">Monitoring {count} {noun}</span>
      {lastRefresh && (
        <span className="text-sm">
          Last refresh: {lastRefresh.toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}

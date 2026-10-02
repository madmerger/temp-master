interface StatusBarProps {
  metersCount: number
  updatedAt: number
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`
}

export function StatusBar({ metersCount, updatedAt }: StatusBarProps) {
  const refreshDate = new Date(updatedAt)
  const refreshTime = `${pad2(refreshDate.getHours())}:${pad2(refreshDate.getMinutes())}:${pad2(refreshDate.getSeconds())}`
  const noun = metersCount === 1 ? 'meter' : 'meters'

  return (
    <div className="mb-5 flex flex-wrap justify-between gap-2 rounded border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-900">
      <span>Monitoring {metersCount} {noun}</span>
      <span>Last refresh: {refreshTime}</span>
    </div>
  )
}

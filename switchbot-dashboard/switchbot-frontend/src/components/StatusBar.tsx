import type { StatusResponse } from '../api/types'

interface Props {
  status: StatusResponse
  refreshedAt: Date | null
}

export function StatusBar({ status, refreshedAt }: Props) {
  const count = status.meters_count || 0
  return (
    <div className="mt-4 flex justify-between gap-3 rounded-lg bg-accent/15 px-4 py-3">
      <span>
        Monitoring {count} {count === 1 ? 'meter' : 'meters'}
      </span>
      <span>
        {refreshedAt ? `Last refresh: ${refreshedAt.toLocaleTimeString()}` : ''}
      </span>
    </div>
  )
}

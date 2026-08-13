import type { StatusResponse } from '../api/types'
export function StatusBar({ status, refreshedAt }: { status: StatusResponse; refreshedAt: Date | null }) {
  const count = status.meters_count || 0
  return <div className="status-bar"><span>Monitoring {count} {count === 1 ? 'meter' : 'meters'}</span><span>{refreshedAt ? `Last refresh: ${refreshedAt.toLocaleTimeString()}` : ''}</span></div>
}

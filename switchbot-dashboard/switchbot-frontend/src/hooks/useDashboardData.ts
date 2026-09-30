import { useCallback, useEffect, useRef, useState } from 'react'
import { REFRESH_INTERVAL } from '../config'
import { fetchMeters, fetchStatus } from '../lib/api'
import type { DashboardStatus, Meter } from '../types'

interface DashboardData {
  meters: Meter[]
  status: DashboardStatus | null
  loading: boolean
  error: string | null
  lastRefresh: Date | null
  reloadToken: number
  reload: () => Promise<void>
}

type LoadFailure = Error & { source: 'meters' | 'status' }

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function useDashboardData(): DashboardData {
  const [meters, setMeters] = useState<Meter[]>([])
  const [status, setStatus] = useState<DashboardStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const latestRequestRef = useRef(0)
  const reload = useCallback(async () => {
    const requestId = ++latestRequestRef.current
    try {
      const [metersResponse, statusResponse] = await Promise.all([
        fetchMeters().catch((cause: unknown) => {
          const failure = new Error(asMessage(cause)) as LoadFailure
          failure.source = 'meters'
          throw failure
        }),
        fetchStatus().catch((cause: unknown) => {
          const failure = new Error(asMessage(cause)) as LoadFailure
          failure.source = 'status'
          throw failure
        }),
      ])
      if (requestId !== latestRequestRef.current) return
      setMeters(metersResponse.meters || [])
      setStatus(statusResponse)
      setError(null)
      setLastRefresh(new Date())
      setReloadToken((value) => value + 1)
    } catch (cause) {
      if (requestId !== latestRequestRef.current) return
      const failure = cause as LoadFailure
      const source = failure.source === 'meters' ? 'meters' : 'status'
      setError(`Failed to fetch ${source}: ${failure.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => void reload())
    const interval = window.setInterval(() => {
      void reload()
    }, REFRESH_INTERVAL)
    return () => window.clearInterval(interval)
  }, [reload])

  return { meters, status, loading, error, lastRefresh, reloadToken, reload }
}

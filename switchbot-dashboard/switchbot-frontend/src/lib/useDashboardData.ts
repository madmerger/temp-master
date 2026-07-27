import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { HistoryPoint, Meter, Status, TimeScale } from '../types'
import { fetchHistory, fetchMeters, fetchStatus } from './api'
import { REFRESH_INTERVAL, isStaleMeter } from './meters'

export interface DashboardData {
  meters: Meter[]
  activeMeters: Meter[]
  staleMeters: Meter[]
  status: Status | null
  histories: Record<string, HistoryPoint[]>
  loading: boolean
  error: string | null
  lastRefresh: Date | null
  reload: () => Promise<void>
}

export function useDashboardData(timeScale: TimeScale): DashboardData {
  const [meters, setMeters] = useState<Meter[]>([])
  const [status, setStatus] = useState<Status | null>(null)
  const [histories, setHistories] = useState<Record<string, HistoryPoint[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const timeScaleRef = useRef(timeScale)
  timeScaleRef.current = timeScale
  const metersRef = useRef<Meter[]>(meters)
  metersRef.current = meters

  const loadHistories = useCallback(async (targetMeters: Meter[], scale: TimeScale) => {
    const results = await Promise.all(
      targetMeters.map(async (meter) => {
        try {
          const response = await fetchHistory(meter.device_id, scale)
          return [meter.device_id, response.history ?? []] as const
        } catch {
          // 個別デバイスの履歴取得失敗は全体の描画を妨げない
          return [meter.device_id, []] as const
        }
      }),
    )
    setHistories(Object.fromEntries(results))
  }, [])

  const reload = useCallback(async () => {
    try {
      const [metersResponse, statusResponse] = await Promise.all([fetchMeters(), fetchStatus()])
      const nextMeters = metersResponse.meters ?? []
      setMeters(nextMeters)
      setStatus(statusResponse)
      setError(null)
      setLoading(false)
      setLastRefresh(new Date())
      await loadHistories(
        nextMeters.filter((meter) => !isStaleMeter(meter)),
        timeScaleRef.current,
      )
    } catch (err) {
      setLoading(false)
      setError(`Failed to fetch data: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [loadHistories])

  // 初回ロードと30秒ごとの自動リフレッシュ
  useEffect(() => {
    void reload()
    const timer = window.setInterval(() => void reload(), REFRESH_INTERVAL)
    return () => window.clearInterval(timer)
  }, [reload])

  // 時間スケール変更時は履歴のみ取り直す（メーター更新時は reload 側で取得済み）
  const loadedTimeScaleRef = useRef(timeScale)
  useEffect(() => {
    if (loadedTimeScaleRef.current === timeScale) {
      return
    }
    loadedTimeScaleRef.current = timeScale
    if (metersRef.current.length === 0) {
      return
    }
    void loadHistories(
      metersRef.current.filter((meter) => !isStaleMeter(meter)),
      timeScale,
    )
  }, [timeScale, loadHistories])

  const { activeMeters, staleMeters } = useMemo(() => {
    const active: Meter[] = []
    const stale: Meter[] = []
    for (const meter of meters) {
      if (isStaleMeter(meter)) {
        stale.push(meter)
      } else {
        active.push(meter)
      }
    }
    return { activeMeters: active, staleMeters: stale }
  }, [meters])

  return {
    meters,
    activeMeters,
    staleMeters,
    status,
    histories,
    loading,
    error,
    lastRefresh,
    reload,
  }
}

import { useEffect, useState } from 'react'
import { fetchHistory } from '../lib/api'
import type { MeterHistoryPoint, TimeScale } from '../types'

export function useMeterHistory(deviceId: string, timeScale: TimeScale, reloadToken: number): MeterHistoryPoint[] {
  const [history, setHistory] = useState<MeterHistoryPoint[]>([])

  useEffect(() => {
    const controller = new AbortController()
    fetchHistory(deviceId, timeScale, controller.signal)
      .then((response) => setHistory(response.history || []))
      .catch(() => undefined)
    return () => controller.abort()
  }, [deviceId, timeScale, reloadToken])

  return history
}

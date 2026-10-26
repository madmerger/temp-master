import { useCallback, useEffect, useRef, useState } from 'react'
import { downloadBackup, fetchMeters, fetchStatus, triggerRefresh } from '../api'
import { DEFAULT_TIME_SCALE, REFRESH_INTERVAL } from '../config'
import { extractFilename } from '../utils'
import type { Meter, StatusResponse, TimeScale } from '../types'

export function useDashboard() {
  const [meters, setMeters] = useState<Meter[]>([])
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [timeScale, setTimeScale] = useState<TimeScale>(DEFAULT_TIME_SCALE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const activeRef = useRef(true)
  const lifecycleRef = useRef(0)

  const showError = useCallback((message: string) => {
    setLoading(false)
    setError(message)
    setConnected(false)
  }, [])

  const fetchData = useCallback(async () => {
    const lifecycle = lifecycleRef.current
    let metersResponse
    try {
      metersResponse = await fetchMeters()
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
      if (activeRef.current && lifecycleRef.current === lifecycle) {
        showError(`Failed to fetch meters: ${message}`)
      }
      return
    }

    if (!activeRef.current || lifecycleRef.current !== lifecycle) {
      return
    }

    let statusResponse
    try {
      statusResponse = await fetchStatus()
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
      if (activeRef.current && lifecycleRef.current === lifecycle) {
        showError(`Failed to fetch status: ${message}`)
      }
      return
    }

    if (!activeRef.current || lifecycleRef.current !== lifecycle) {
      return
    }
    setMeters(metersResponse?.meters ?? [])
    setStatus(statusResponse)
    setLoading(false)
    setError(null)
    setConnected(true)
    setLastRefresh(new Date())
    setRefreshTick((tick) => tick + 1)
  }, [showError])

  useEffect(() => {
    activeRef.current = true
    lifecycleRef.current += 1
    void fetchData()
    const intervalId = window.setInterval(() => void fetchData(), REFRESH_INTERVAL)

    return () => {
      activeRef.current = false
      lifecycleRef.current += 1
      window.clearInterval(intervalId)
    }
  }, [fetchData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await triggerRefresh()
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
      showError(`Failed to refresh: ${message}`)
    }
    void fetchData()
    setRefreshing(false)
  }, [fetchData, showError])

  const onBackup = useCallback(async () => {
    setDownloading(true)
    try {
      const response = await downloadBackup()
      if (!response.ok) {
        let requestId: string | undefined
        try {
          const body: unknown = await response.json()
          if (body && typeof body === 'object' && 'request_id' in body && typeof body.request_id === 'string') {
            requestId = body.request_id
          }
        } catch {
          requestId = undefined
        }
        showError(`Failed to download backup (HTTP ${response.status}).${requestId ? ` Request ID: ${requestId}` : ''}`)
        return
      }

      const filename = extractFilename(response.headers.get('Content-Disposition') || '')
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(objectUrl)
    } catch (caughtError) {
      showError(`Failed to download backup: ${String(caughtError)}`)
    } finally {
      setDownloading(false)
    }
  }, [showError])

  return {
    meters,
    status,
    timeScale,
    setTimeScale,
    loading,
    error,
    connected,
    lastRefresh,
    refreshTick,
    refreshing,
    downloading,
    onRefresh,
    onBackup,
  }
}

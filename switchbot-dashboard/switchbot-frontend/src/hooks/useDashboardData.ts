import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchDashboard } from '../api'
import { REFRESH_INTERVAL_MS } from '../config'
import type { Meter, Status } from '../types'

export function useDashboardData() {
  const [meters, setMeters] = useState<Meter[]>([])
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setErrorMessage] = useState<string | null>(null)
  const [connected, setConnected] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)
  const mounted = useRef(false)
  const controllers = useRef(new Set<AbortController>())

  const setError = useCallback((message: string | null) => {
    setErrorMessage(message)
    if (message) {
      setConnected(false)
      setLoading(false)
    }
  }, [])

  const reload = useCallback(async () => {
    const controller = new AbortController()
    controllers.current.add(controller)
    try {
      const dashboard = await fetchDashboard(controller.signal)
      if (!mounted.current) {
        return
      }
      setMeters(dashboard.meters.meters || [])
      setStatus(dashboard.status)
      setLoading(false)
      setErrorMessage(null)
      setConnected(true)
      setLastRefresh(new Date())
      setRefreshToken((token) => token + 1)
    } catch (requestError) {
      if (!controller.signal.aborted && mounted.current) {
        setLoading(false)
        setErrorMessage(
          requestError instanceof Error
            ? requestError.message
            : String(requestError),
        )
        setConnected(false)
      }
    } finally {
      controllers.current.delete(controller)
    }
  }, [])

  useEffect(() => {
    const activeControllers = controllers.current
    mounted.current = true
    const initialRequest = window.setTimeout(() => void reload(), 0)
    const interval = window.setInterval(() => {
      void reload()
    }, REFRESH_INTERVAL_MS)

    return () => {
      mounted.current = false
      window.clearTimeout(initialRequest)
      window.clearInterval(interval)
      activeControllers.forEach((controller) => controller.abort())
      activeControllers.clear()
    }
  }, [reload])

  return {
    meters,
    status,
    loading,
    error,
    connected,
    lastRefresh,
    refreshToken,
    reload,
    setError,
  }
}

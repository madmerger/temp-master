import { useCallback, useEffect, useReducer, useState } from 'react'
import { BACKUP_URL, errorMessage, fetchMeters, fetchStatus, triggerRefresh } from './api'
import Controls from './components/Controls'
import MeterCard from './components/MeterCard'
import StaleMetersSection from './components/StaleMetersSection'
import StatusBar from './components/StatusBar'
import { DEFAULT_TIME_SCALE, REFRESH_INTERVAL } from './constants'
import type { Meter, StatusResponse, TimeScale } from './types'
import { isStaleMeter } from './utils'

interface DashboardState {
  meters: Meter[]
  status: StatusResponse | null
  loading: boolean
  error: string | null
  connected: boolean
  lastRefresh: Date | null
}

type DashboardAction =
  | { type: 'loaded'; meters: Meter[]; status: StatusResponse }
  | { type: 'failed'; error: string }

const initialState: DashboardState = {
  meters: [],
  status: null,
  loading: true,
  error: null,
  connected: true,
  lastRefresh: null,
}

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'loaded':
      return {
        meters: action.meters,
        status: action.status,
        loading: false,
        error: null,
        connected: true,
        lastRefresh: new Date(),
      }
    case 'failed':
      return { ...state, loading: false, error: action.error, connected: false }
  }
}

function withErrorPrefix<T>(promise: Promise<T>, prefix: string): Promise<T> {
  return promise.catch((err: unknown) => {
    throw new Error(`${prefix}: ${errorMessage(err)}`)
  })
}

export default function App() {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)
  const [timeScale, setTimeScale] = useState<TimeScale>(DEFAULT_TIME_SCALE)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [metersResp, statusResp] = await Promise.all([
        withErrorPrefix(fetchMeters(), 'Failed to fetch meters'),
        withErrorPrefix(fetchStatus(), 'Failed to fetch status'),
      ])
      dispatch({
        type: 'loaded',
        meters: metersResp && metersResp.meters ? metersResp.meters : [],
        status: statusResp,
      })
    } catch (err) {
      dispatch({ type: 'failed', error: errorMessage(err) })
    }
  }, [])

  useEffect(() => {
    void loadData()
    const timer = setInterval(() => void loadData(), REFRESH_INTERVAL)
    return () => clearInterval(timer)
  }, [loadData])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await triggerRefresh()
    } catch (err) {
      dispatch({ type: 'failed', error: `Failed to refresh: ${errorMessage(err)}` })
    }
    await loadData()
    setRefreshing(false)
  }

  const handleBackup = () => {
    window.open(BACKUP_URL, '_blank')
  }

  const activeMeters = state.meters.filter((meter) => !isStaleMeter(meter))
  const staleMeters = state.meters.filter((meter) => isStaleMeter(meter))
  const refreshToken = state.lastRefresh ? state.lastRefresh.getTime() : 0

  return (
    <div className="pt-[70px]">
      <nav className="fixed inset-x-0 top-0 z-10 flex h-[50px] items-center border-b border-[#e7e7e7] bg-[#f8f8f8] px-4">
        <a className="mr-6 text-lg text-[#777] hover:text-[#5e5e5e]" href="#">
          Temp Master Dashboard
        </a>
        <a className="-my-px flex h-[50px] items-center bg-[#e7e7e7] px-4 text-[#555]" href="/">
          Dashboard
        </a>
        <span
          id="connection-status"
          className={`ml-auto rounded px-1.5 py-0.5 text-xs font-bold text-white ${
            state.connected ? 'bg-[#5cb85c]' : 'bg-[#d9534f]'
          }`}
        >
          {state.connected ? 'Connected' : 'Disconnected'}
        </span>
      </nav>

      <main className="px-4">
        <Controls
          timeScale={timeScale}
          refreshing={refreshing}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => void handleRefresh()}
          onBackup={handleBackup}
        />

        <StatusBar status={state.status} lastRefresh={state.lastRefresh} />

        {state.loading && (
          <div id="loading" className="py-10 text-center">
            <p className="text-[#777]">Loading temperature data...</p>
          </div>
        )}

        {state.error && (
          <div id="error" className="mb-5 rounded border border-[#ebccd1] bg-[#f2dede] px-4 py-3 text-[#a94442]">
            <strong>Error.</strong> <span id="error-text">{state.error}</span>
          </div>
        )}

        <div id="meters-container">
          {activeMeters.length > 0 && (
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 md:grid-cols-3">
              {activeMeters.map((meter) => (
                <MeterCard
                  key={meter.device_id}
                  meter={meter}
                  isStale={false}
                  timeScale={timeScale}
                  refreshToken={refreshToken}
                />
              ))}
            </div>
          )}
          <StaleMetersSection meters={staleMeters} timeScale={timeScale} refreshToken={refreshToken} />
        </div>

        <footer className="mt-8 mb-5 text-center text-xs text-[#777]">
          Temp Master Dashboard v1.0 - Built with React + Vite + Recharts
        </footer>
      </main>
    </div>
  )
}

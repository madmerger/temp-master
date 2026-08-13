import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMeters, fetchStatus, triggerRefresh } from './api/client'
import type { TimeScale } from './api/types'
import { isStaleMeter } from './utils/meter'
import { Controls } from './components/Controls'
import { MeterGrid } from './components/MeterGrid'
import { RateLimitWarning } from './components/RateLimitWarning'
import { StaleMetersSection } from './components/StaleMetersSection'
import { StatusBar } from './components/StatusBar'
import { ThemeSwitcher } from './components/ThemeSwitcher'

export default function App() {
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null)
  const queryClient = useQueryClient()
  const meters = useQuery({ queryKey: ['meters'], queryFn: fetchMeters, refetchInterval: 30_000 })
  const status = useQuery({ queryKey: ['status'], queryFn: fetchStatus, refetchInterval: 30_000 })
  useEffect(() => { if (meters.data && status.data) setRefreshedAt(new Date()) }, [meters.data, status.data])
  const [activeMeters, staleMeters] = useMemo(() => {
    const all = meters.data?.meters || []
    return [all.filter((meter) => !isStaleMeter(meter)), all.filter((meter) => isStaleMeter(meter))]
  }, [meters.data])
  const refresh = async () => {
    setRefreshing(true)
    try { await triggerRefresh(); await queryClient.invalidateQueries({ queryKey: ['meters'] }); await queryClient.invalidateQueries({ queryKey: ['status'] }) }
    catch (error) { queryClient.setQueryData(['dashboard-error'], error instanceof Error ? error.message : 'Failed to refresh') }
    finally { setRefreshing(false) }
  }
  const error = meters.error || status.error
  return <div className="app-shell">
    <header className="app-header"><div><p className="eyebrow">ENVIRONMENTAL MONITORING</p><h1>Temp Master Dashboard</h1></div><div className="header-actions"><span className={`connection ${error ? 'disconnected' : 'connected'}`}>{error ? 'Disconnected' : 'Connected'}</span><ThemeSwitcher /></div></header>
    <main>
      <Controls timeScale={timeScale} onTimeScaleChange={setTimeScale} onRefresh={refresh} refreshing={refreshing} />
      {status.data && <StatusBar status={status.data} refreshedAt={refreshedAt} />}
      {status.data?.is_rate_limited && <RateLimitWarning seconds={status.data.backoff_remaining || 0} />}
      {error && <div className="error"><strong>Error.</strong> Failed to fetch data: {error instanceof Error ? error.message : 'Unknown error'}</div>}
      {meters.isLoading ? <div className="loading">Loading temperature data...</div> : <><MeterGrid meters={activeMeters} timeScale={timeScale} /><StaleMetersSection meters={staleMeters} timeScale={timeScale} /></>}
    </main>
    <footer>Temp Master Dashboard v1.0</footer>
  </div>
}

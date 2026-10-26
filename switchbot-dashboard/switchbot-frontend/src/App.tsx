import { Controls } from './components/Controls'
import { ErrorAlert } from './components/ErrorAlert'
import { MeterList } from './components/MeterList'
import { Navbar } from './components/Navbar'
import { RateLimitWarning } from './components/RateLimitWarning'
import { StatusBar } from './components/StatusBar'
import { useDashboard } from './hooks/useDashboard'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const dashboard = useDashboard()
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      <Navbar connected={dashboard.connected} theme={theme} onToggleTheme={toggleTheme} />
      <main className="mx-auto min-h-screen max-w-screen-2xl px-4 pb-2 pt-20">
        <Controls
          timeScale={dashboard.timeScale}
          onTimeScaleChange={dashboard.setTimeScale}
          onRefresh={dashboard.onRefresh}
          onBackup={dashboard.onBackup}
          refreshing={dashboard.refreshing}
          downloading={dashboard.downloading}
        />
        {dashboard.status?.is_rate_limited && (
          <RateLimitWarning remaining={dashboard.status.backoff_remaining || 0} />
        )}
        <StatusBar status={dashboard.status} lastRefresh={dashboard.lastRefresh} />
        {dashboard.loading && (
          <div id="loading" className="py-10 text-center text-sm text-muted">
            <p>Loading temperature data...</p>
          </div>
        )}
        {dashboard.error && <ErrorAlert message={dashboard.error} />}
        <MeterList
          meters={dashboard.meters}
          timeScale={dashboard.timeScale}
          refreshTick={dashboard.refreshTick}
          theme={theme}
        />
        <footer className="my-8 text-center text-xs text-muted">
          Temp Master Dashboard v1.0 - Built with React + Vite + Tailwind CSS
        </footer>
      </main>
    </>
  )
}

import { useMeters } from "./hooks/useMeters";
import { Navbar } from "./components/Navbar";
import { ControlPanel } from "./components/ControlPanel";
import { StatusBar } from "./components/StatusBar";
import { MeterGrid } from "./components/MeterGrid";
import "./App.css";

export function App() {
  const {
    meters,
    status,
    histories,
    loading,
    error,
    connected,
    refreshing,
    timeScale,
    lastRefreshed,
    setTimeScale,
    handleRefresh,
    handleBackup,
  } = useMeters();

  return (
    <>
      <Navbar connected={connected} />
      <div className="container">
        <ControlPanel
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={handleRefresh}
          onBackup={handleBackup}
          refreshing={refreshing}
        />
        <StatusBar status={status} lastRefreshed={lastRefreshed} />
        {loading && (
          <div className="loading">
            <p>Loading temperature data...</p>
          </div>
        )}
        {error && !loading && (
          <div className="alert alert-danger">
            <strong>Error.</strong> {error}
          </div>
        )}
        {!loading && meters.length > 0 && (
          <MeterGrid
            meters={meters}
            histories={histories}
            timeScale={timeScale}
          />
        )}
        <footer className="app-footer">
          Temp Master Dashboard v2.0 - Built with React + Vite + Chart.js 4
        </footer>
      </div>
    </>
  );
}

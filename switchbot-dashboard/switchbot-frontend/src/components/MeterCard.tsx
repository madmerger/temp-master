import { useEffect, useState } from 'react'
import { fetchHistory } from '../api'
import { getDisplayName } from '../displayNames'
import type { MeterDevice, MeterReading, TimeScale } from '../types'
import TemperatureChart from './TemperatureChart'

interface Props {
  meter: MeterDevice
  timeScale: TimeScale
  reloadToken: number
}

export default function MeterCard({ meter, timeScale, reloadToken }: Props) {
  const [history, setHistory] = useState<MeterReading[]>([])

  useEffect(() => {
    let cancelled = false
    fetchHistory(meter.device_id, timeScale)
      .then((data) => {
        if (!cancelled) setHistory(data.history ?? [])
      })
      .catch(() => {
        // History failures are non-fatal; keep last known data.
      })
    return () => {
      cancelled = true
    }
  }, [meter.device_id, timeScale, reloadToken])

  const name = getDisplayName(meter.device_name)
  const hasTemp = meter.current_temperature !== null && meter.current_temperature !== undefined
  const hasHumidity = meter.current_humidity !== null && meter.current_humidity !== undefined
  const hasBattery = meter.battery !== null && meter.battery !== undefined

  return (
    <div className="meter-card">
      <div className="meter-card-header">
        <span className="meter-name">{name}</span>
        <span className="device-type-tag">{meter.device_type}</span>
      </div>
      <div className="meter-card-body">
        <div className="meter-stats">
          {hasTemp && <span className="stat stat-temp">{meter.current_temperature}°C</span>}
          {hasHumidity && <span className="stat stat-humidity">{meter.current_humidity}%</span>}
          {hasBattery && <span className="stat stat-battery">{meter.battery}%</span>}
        </div>
        <div className="meter-chart-wrap">
          <TemperatureChart history={history} timeScale={timeScale} />
        </div>
        {meter.last_updated && (
          <p className="meter-last-updated">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}

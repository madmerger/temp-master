import type { TimeScale } from '../api/types'
import { backupUrl } from '../api/client'

const options: Array<[TimeScale, string]> = [
  ['hour', 'Last Hour'], ['day', 'Last 24 Hours'], ['week', 'Last 7 Days'], ['month', 'Last 30 Days'], ['year', 'Last Year'],
]
interface Props { timeScale: TimeScale; onTimeScaleChange: (scale: TimeScale) => void; onRefresh: () => void; refreshing: boolean }
export function Controls({ timeScale, onTimeScaleChange, onRefresh, refreshing }: Props) {
  return <section className="controls">
    <label htmlFor="time-scale">Time Range:</label>
    <select id="time-scale" value={timeScale} onChange={(event) => onTimeScaleChange(event.target.value as TimeScale)}>
      {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>
    <button className="button button-primary" disabled={refreshing} onClick={onRefresh}>{refreshing ? 'Refreshing...' : 'Refresh Data'}</button>
    <a className="button button-secondary" href={backupUrl} target="_blank" rel="noreferrer">Download Backup</a>
  </section>
}

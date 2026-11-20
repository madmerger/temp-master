import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { downloadBackup, getJson, request } from './api'
import { formatTimestamp, getDisplayName, isStale } from './meters'
import type { Meter, Reading, Status, TimeScale } from './meters'

const polling = { refetchInterval: 30000 }

export function TemperatureChart({ id, scale }: { id: string; scale: TimeScale }) {
  const history = useQuery({
    queryKey: ['history', id, scale],
    queryFn: () => getJson<{ history: Reading[] }>(`/api/meters/${encodeURIComponent(id)}/history?time_scale=${scale}`),
    ...polling,
  })
  if (history.isPending) return <p className="chart-message">履歴を読み込み中...</p>
  if (history.isError) return <p role="alert">履歴データを取得できませんでした</p>
  if (!history.data.history.length) return <p className="chart-message">履歴データがありません</p>
  return <div className="chart" role="img" aria-label="温度の推移">
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <LineChart data={history.data.history} margin={{ top: 12, right: 16, bottom: 0, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbeafe" />
        <XAxis dataKey="timestamp" tickFormatter={value => formatTimestamp(value, scale)} tick={{ fontSize: 11 }} minTickGap={36} />
        <YAxis unit="°" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
        <Tooltip labelFormatter={value => formatTimestamp(String(value), scale)} formatter={value => [`${value}°C`, '温度']} />
        <Line type="monotone" dataKey="temperature" stroke="#2563eb" strokeWidth={2.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
}

export function MeterCard({ meter, scale }: { meter: Meter; scale: TimeScale }) {
  const stale = isStale(meter)
  return <article className={`meter-card ${stale ? 'stale-card' : ''}`}>
    <header className="card-header">
      <div><h3>{getDisplayName(meter.device_name)}</h3>{stale && <span className="badge stale-badge">7日以上未更新</span>}</div>
      <span className="device-tag">{meter.device_type}</span>
    </header>
    <div className="card-body">
      <div className="stats">
        {meter.current_temperature != null && <span className="stat"><small>温度</small>{meter.current_temperature}°C</span>}
        {meter.current_humidity != null && <span className="stat"><small>湿度</small>{meter.current_humidity}%</span>}
        {meter.battery != null && <span className="stat"><small>バッテリー</small>{meter.battery}%</span>}
      </div>
      {stale ? <p className="chart-message">履歴データの取得対象外</p> : <TemperatureChart id={meter.device_id} scale={scale} />}
      {meter.last_updated
        ? <p className="last-updated">Last updated: {new Date(meter.last_updated).toLocaleString()}</p>
        : <p className="last-updated">値がありません（データ未受信）</p>}
    </div>
  </article>
}

export function StaleMetersSection({ meters, scale }: { meters: Meter[]; scale: TimeScale }) {
  if (!meters.length) return null
  return <section className="stale-section" aria-labelledby="stale-title">
    <div className="section-heading"><h2 id="stale-title">未更新のメーター</h2><p>1週間以上更新されていないデバイス</p></div>
    <div className="meter-grid">{meters.map(meter => <MeterCard key={meter.device_id} meter={meter} scale={scale} />)}</div>
  </section>
}

export function StatusBar({ status, connected, updated }: { status?: Status; connected: boolean; updated: number }) {
  return <>
    <div className="status-bar" role="status">
      <span className={`connection ${connected ? 'connected' : ''}`}>{connected ? 'Connected' : 'エラー'}</span>
      {status && <span>Monitoring {status.meters_count} {status.meters_count === 1 ? 'meter' : 'meters'}</span>}
      {updated > 0 && <span className="refresh-time">Last refresh: {new Date(updated).toLocaleTimeString()}</span>}
    </div>
    {status?.is_rate_limited && <p className="notice" role="alert"><strong>Rate Limited. </strong>SwitchBot API rate limit reached. Retry in {status.backoff_remaining || 0} seconds.</p>}
  </>
}

export function Controls({ scale, setScale }: { scale: TimeScale; setScale: (scale: TimeScale) => void }) {
  const [token, setToken] = useState('')
  const client = useQueryClient()
  const refresh = useMutation({
    mutationFn: () => request('/api/meters/refresh', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),
    onSuccess: () => client.invalidateQueries(),
  })
  const backup = useMutation({ mutationFn: () => downloadBackup(token) })
  return <section className="controls" aria-label="表示と管理操作">
    <label>Time Range:
      <select value={scale} onChange={event => setScale(event.target.value as TimeScale)}>
        <option value="hour">Last Hour</option><option value="day">Last 24 Hours</option>
        <option value="week">Last 7 Days</option><option value="month">Last 30 Days</option><option value="year">Last Year</option>
      </select>
    </label>
    <label>管理トークン
      <input type="password" value={token} autoComplete="off" placeholder="管理操作に必要です" onChange={event => setToken(event.target.value)} />
    </label>
    <div className="actions">
      <button disabled={refresh.isPending} onClick={() => refresh.mutate()}>{refresh.isPending ? 'Refreshing...' : 'Refresh Data'}</button>
      <button className="secondary" disabled={backup.isPending} onClick={() => backup.mutate()}>{backup.isPending ? 'Downloading...' : 'Download Backup'}</button>
    </div>
    {refresh.error && <p className="operation-error" role="alert">更新に失敗しました: {refresh.error.message}</p>}
    {backup.error && <p className="operation-error" role="alert">バックアップに失敗しました: {backup.error.message}</p>}
  </section>
}

export default function App() {
  const [scale, setScale] = useState<TimeScale>('day')
  const meters = useQuery({ queryKey: ['meters'], queryFn: () => getJson<{ meters: Meter[]; last_updated: string | null }>('/api/meters'), ...polling })
  const status = useQuery({ queryKey: ['status'], queryFn: () => getJson<Status>('/api/status'), ...polling })
  const all = meters.data?.meters ?? []
  return <>
    <nav className="navbar"><div className="nav-content"><a href="/">Temp Master Dashboard</a><span>ENVIRONMENT MONITORING</span></div></nav>
    <main className="page">
      <div className="page-heading"><div><p className="eyebrow">LIVE OVERVIEW</p><h1>環境モニタリング</h1><p>メーターの温度と湿度を、ひとつのダッシュボードで。</p></div><span className="overview-tag">30秒ごとに自動更新</span></div>
      <Controls scale={scale} setScale={setScale} />
      <StatusBar status={status.data} connected={meters.isSuccess && status.isSuccess && !meters.isError && !status.isError} updated={Math.max(meters.dataUpdatedAt, status.dataUpdatedAt)} />
      {(meters.isError || status.isError) && <p role="alert" className="notice">データを取得できませんでした。接続を確認してください。</p>}
      {meters.isPending && <p className="notice">Loading temperature data...</p>}
      {meters.isSuccess && !all.length && <p className="notice">メーターがありません</p>}
      <div className="meter-grid">{all.filter(meter => !isStale(meter)).map(meter => <MeterCard key={meter.device_id} meter={meter} scale={scale} />)}</div>
      <StaleMetersSection meters={all.filter(meter => isStale(meter))} scale={scale} />
      <footer>Temp Master Dashboard v2.0 - Built with React + Tailwind CSS</footer>
    </main>
  </>
}

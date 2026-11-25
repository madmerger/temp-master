import { formatTimestamp, type TimeScale } from '@temp-master/shared'
import { useQuery } from '@tanstack/react-query'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from './api'

const MAX_TIME_TICKS = 8

export default function MeterChart({ id, name, timeScale }: { id: string; name: string; timeScale: TimeScale }) {
  const history = useQuery({
    queryKey: ['history', id, timeScale],
    queryFn: ({ signal }) => api.getHistory(id, timeScale, signal),
    select: (response) => response.history,
  })

  if (!history.data?.length) {
    let message = 'No readings in this range'
    if (history.isPending) message = 'Loading history…'
    if (history.isError) message = 'Failed to load history'
    return <p className="grid h-[200px] place-items-center text-sm text-muted">{message}</p>
  }

  const readings = history.data
  const count = Math.min(MAX_TIME_TICKS, readings.length)
  const lastIndex = readings.length - 1
  const ticks = count === 1 ? [0] : Array.from(
    { length: count },
    (_, index) => Math.round(index * lastIndex / (count - 1)),
  )
  const formatTick = (index: number) => {
    const reading = readings[index]
    return reading ? formatTimestamp(reading.timestamp, timeScale) : ''
  }
  const points = readings.map(({ temperature }, index) => ({ index, temperature }))

  return (
    <>
      {history.isError && <p className="mb-2 text-xs text-danger">Could not update history</p>}
      <div role="group" aria-label={`Temperature history for ${name}`} className="h-[200px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={points}
            baseValue="dataMin"
            margin={{ top: 8, right: 18, bottom: 0, left: 0 }}
          >
            <CartesianGrid stroke="var(--chart-grid)" />
            <XAxis
              dataKey="index"
              type="number"
              domain={[0, Math.max(lastIndex, 1)]}
              ticks={ticks}
              interval="preserveStartEnd"
              minTickGap={10}
              tickFormatter={formatTick}
              tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
              stroke="var(--chart-grid)"
              tickMargin={7}
            />
            <YAxis
              domain={['auto', 'auto']}
              width={38}
              tickFormatter={(value: number) => `${value}°`}
              tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
              stroke="var(--chart-grid)"
            />
            <Tooltip
              labelFormatter={(value) => formatTick(Number(value))}
              formatter={(value) => typeof value === 'number' ? [`${value.toFixed(1)}°C`, 'Temperature'] : ''}
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-line)',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
              }}
              itemStyle={{ color: 'var(--color-ink)' }}
              cursor={{ stroke: 'var(--color-muted)' }}
            />
            <Area
              type="monotone"
              dataKey="temperature"
              stroke="var(--chart-line)"
              strokeWidth={2}
              fill="var(--chart-fill)"
              dot={readings.length <= 50 ? { r: 3, fill: 'var(--chart-line)', strokeWidth: 0 } : false}
              activeDot={{ r: 5, fill: 'var(--color-primary)' }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}

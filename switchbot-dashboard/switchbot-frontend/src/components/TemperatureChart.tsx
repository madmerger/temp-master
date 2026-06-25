import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TimeScale } from '../types/api';
import { useHistory } from '../hooks/useMeters';

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatTimestamp(timestamp: string, timeScale: TimeScale): string {
  const date = new Date(timestamp);
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  const monthShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ][date.getMonth()];
  const dayNum = date.getDate();

  switch (timeScale) {
    case 'hour':
    case 'day':
      return `${hours}:${minutes}`;
    case 'week':
      return `${dayShort} ${hours}`;
    case 'month':
    case 'year':
      return `${monthShort} ${dayNum}`;
    default:
      return date.toLocaleString();
  }
}

interface Props {
  deviceId: string;
  timeScale: TimeScale;
}

export function TemperatureChart({ deviceId, timeScale }: Props) {
  const history = useHistory(deviceId, timeScale);

  const data =
    history?.history.map((r) => ({
      time: formatTimestamp(r.timestamp, timeScale),
      temperature: r.temperature,
    })) ?? [];

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-gray-400 text-sm">
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${deviceId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          tickLine={false}
          tickFormatter={(v: number) => `${v}\u00b0`}
          domain={['auto', 'auto']}
        />
        <Tooltip
          formatter={(value) => [`${Number(value).toFixed(1)}\u00b0C`, 'Temperature']}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid #e5e7eb',
          }}
        />
        <Area
          type="monotone"
          dataKey="temperature"
          stroke="#ef4444"
          strokeWidth={2}
          fill={`url(#grad-${deviceId})`}
          dot={false}
          activeDot={{ r: 4, fill: '#ef4444' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
